"""
ORCA Marine Intelligence Platform — M1: FastAPI app + Conversation Agent.

Run locally:
    uvicorn main:app --reload --port 8000

Test:
    curl -X POST http://localhost:8000/chat \
      -H "Content-Type: application/json" \
      -d '{"message": "Is it safe to venture into the sea tomorrow near Kochi?"}'
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from schemas import ChatRequest, ChatResponse, ChatContext, Location
from conversation_agent import (
    detect_language,
    classify_intent_with_confidence,
    extract_location,
    get_default_date,
)
from planner import run_planner
from db import init_db, log_query

app = FastAPI(title="ORCA Conversation API", version="0.1.0")
init_db()

# Wide open for hackathon dev — tighten before demo/deploy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    message = req.message

    language = detect_language(message)
    intent_result = classify_intent_with_confidence(message)

    if req.location is not None:
        location = req.location
        location_source = "device_gps"
    else:
        loc_dict = extract_location(message)
        location = Location(
            name=loc_dict["name"], lat=loc_dict["lat"], lon=loc_dict["lon"]
        )
        location_source = loc_dict["method"]

    resolved_date = req.date if req.date else get_default_date()

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

    result = run_planner(context)

    response = ChatResponse(
        text=result["text"],
        language=language,
        safety=result["safety"],
        evidence=result["evidence"],
        layers=result["layers"],
        context=context,
    )

    log_query(
        message=message,
        intent=context.intent,
        location_name=location.name,
        lat=location.lat,
        lon=location.lon,
        date=resolved_date,
        language=language,
        response_text=result["text"],
        is_live=result["safety"].is_live,
    )

    return response
