"""
ORCA Marine Intelligence Platform — M1: FastAPI app + Conversation Agent.

Run (matches the team run command):
    python -m uvicorn mock_server:app --port 8000 --reload

Test:
    curl -X POST http://localhost:8000/chat \
      -H "Content-Type: application/json" \
      -d '{"message": "Is it safe to venture into the sea tomorrow near Kochi?", "user_id": "demo"}'

    curl http://localhost:8000/layers/pfz/2026-09-14.geojson
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from schemas import ChatRequest, ChatResponse, ChatContext, Location
from conversation_agent import (
    detect_language,
    classify_intent_with_confidence,
    extract_location,
    get_default_date,
)
from planner import run_planner
from layers import get_layer, VALID_LAYERS

app = FastAPI(title="ORCA Conversation API", version="0.2.0")

# Wide open for hackathon dev — no auth by design per team decision.
# Tighten allow_origins before a public deploy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory multi-turn session store: {user_id: {"location": Location, "date": str}}.
# Good enough for a single-process hackathon demo — lets "and tomorrow?" work
# without re-specifying location. Swap for Redis/DB before running >1 worker
# or needing sessions to survive a restart.
_SESSIONS: dict = {}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    message = req.message
    session = _SESSIONS.get(req.user_id, {}) if req.user_id else {}

    language = detect_language(message)
    intent_result = classify_intent_with_confidence(message)

    # Priority 1: live device GPS sent by the frontend for this request.
    if req.location is not None:
        location = req.location
        location_source = "device_gps"
    else:
        loc_dict = extract_location(message)
        if loc_dict["resolved"]:
            location = Location(name=loc_dict["name"], lat=loc_dict["lat"], lon=loc_dict["lon"])
            location_source = loc_dict["method"]
        elif "location" in session:
            # Priority 2: carry over location from earlier in this conversation
            location = session["location"]
            location_source = "carried_over_from_session"
        else:
            # Priority 3: last resort — Kochi default, clearly labeled as such
            location = Location(name=loc_dict["name"], lat=loc_dict["lat"], lon=loc_dict["lon"])
            location_source = loc_dict["method"]

    resolved_date = req.date or session.get("date") or get_default_date()

    context = ChatContext(
        location=location,
        location_source=location_source,
        date=resolved_date,
        intent=intent_result["intent"],
        intent_confidence=intent_result["confidence"],
        language=language,
        matched_keywords=intent_result["matched_keywords"],
        raw_message=message,
    )

    if req.user_id:
        _SESSIONS[req.user_id] = {"location": location, "date": resolved_date}

    result = run_planner(context)

    return ChatResponse(
        text=result["text"],
        language=language,
        safety=result["safety"],
        evidence=result["evidence"],
        layers=result["layers"],
        context=context,
    )


@app.get("/layers/{layer_id}/{date}.geojson")
def layers(layer_id: str, date: str, lat: float = 9.9312, lon: float = 76.2673):
    if layer_id not in VALID_LAYERS:
        raise HTTPException(status_code=404, detail=f"Unknown layer_id. Valid: {sorted(VALID_LAYERS)}")
    return JSONResponse(get_layer(layer_id, date, lat, lon))
