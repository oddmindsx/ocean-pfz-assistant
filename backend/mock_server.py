"""
ORCA Marine Intelligence Platform - M1: FastAPI app + Conversation Agent.

Run (matches the team run command):
    python -m uvicorn mock_server:app --port 8000 --reload
"""

import os
import json

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
from layer import get_layer, VALID_LAYERS
from db import init_db, log_query

app = FastAPI(title="ORCA Conversation API", version="0.2.0")
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

    if req.location is not None:
        location = req.location
        location_source = "device_gps"
    else:
        loc_dict = extract_location(message)
        if loc_dict["resolved"]:
            location = Location(name=loc_dict["name"], lat=loc_dict["lat"], lon=loc_dict["lon"])
            location_source = loc_dict["method"]
        elif "location" in session:
            location = session["location"]
            location_source = "carried_over_from_session"
        else:
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


@app.get("/layers/{layer_id}/{date}.geojson")
def layers(layer_id: str, date: str, lat: float = 9.9312, lon: float = 76.2673):
    if layer_id == "boundaries":
        frontend_data_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "data")
        target_path = os.path.join(frontend_data_dir, "backend/data/kerala_coastline.geojson")
        if not os.path.exists(target_path):
            raise HTTPException(status_code=404, detail="Coastline layer not found")
        with open(target_path, "r", encoding="utf-8-sig") as f:
            return json.load(f)

    if layer_id not in VALID_LAYERS:
        raise HTTPException(status_code=404, detail=f"Unknown layer_id. Valid: {sorted(VALID_LAYERS)}")
    return JSONResponse(get_layer(layer_id, date, lat, lon))

@app.get("/data/{filename}")
async def get_geojson_layer(filename: str):
    # Construct base path inside backend/data or backend folder
    file_path = os.path.join("data", filename)
    fallback_path = os.path.join("data", "pfz_kochi_default.geojson") # or static sample file
    
    if os.path.exists(file_path):
        return FileResponse(file_path)
    elif os.path.exists(fallback_path):
        # Serve default sample layer instead of throwing 404
        return FileResponse(fallback_path)
    else:
        raise HTTPException(status_code=404, detail="GeoJSON layer not found")
