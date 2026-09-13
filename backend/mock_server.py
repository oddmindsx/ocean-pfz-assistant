"""
OCRA - FastAPI Backend Mock Companion (M1, M2, M3 baseline)
Implements:
- POST /chat: Request/response schema matching M1 & M2
- GET /layers/{layer_id}/{date}.geojson: GeoJSON layer serving matching M3
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
import os

from Planner import query
from Ocean_stub import get_pfz
from Weather_stub import get_weather, get_wave
from Reasoning import evaluate

app = FastAPI()

# Enable CORS for Vite frontend
app.add_middleware( 
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schema definitions matching M1
class LocationModel(BaseModel):
    name: str = "Kochi"
    lat: float = 9.9312
    lon: float = 76.2673

class ContextModel(BaseModel):
    location: Optional[LocationModel] = None
    date: Optional[str] = "2026-09-11"

class ChatRequest(BaseModel):
    message: str
    context: Optional[ContextModel] = None

class SafetyModel(BaseModel):
    status: str
    wave_height_m: float
    wind_speed_knots: float
    advice: str

class EvidenceModel(BaseModel):
    sst_range: str
    chlorophyll: str
    thermal_fronts: bool
    reasoning: str

class LayerModel(BaseModel):
    id: str
    name: str
    url: str
    type: str = "geojson"
    color: Optional[str] = None

class ChatResponse(BaseModel):
    text: str
    language: str = "en"
    safety: SafetyModel
    evidence: EvidenceModel
    layers: List[LayerModel]

@app.get("/")
def root():
    return {"status": "online", "service": "SagarDrishti Marine API", "version": "1.0.0"}

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(payload: ChatRequest):
    message = payload.message.lower()
    location_name = payload.context.location.name if payload.context and payload.context.location else "Kochi"
    date_str = payload.context.date if payload.context and payload.context.date else "2026-09-11"

    if "safe" in message or "wave" in message or "wind" in message:
        return ChatResponse(
            text=f"🌊 Sea Safety Alert for {location_name} ({date_str}): Conditions are SAFE. Significant wave height is 1.4m and winds are steady at 11 kts from WSW.",
            language="en",
            safety=SafetyModel(
                status="SAFE",
                wave_height_m=1.4,
                wind_speed_knots=11.0,
                advice="Favorable sea state for all fishing vessels."
            ),
            evidence=EvidenceModel(
                sst_range="28.1 - 28.5°C",
                chlorophyll="1.48 mg/m³",
                thermal_fronts=True,
                reasoning="Low swell period and stable surface wind profile."
            ),
            layers=[
                LayerModel(
                    id="pfz",
                    name="Potential Fishing Zones",
                    url=f"http://localhost:8000/layers/pfz/{date_str}.geojson",
                    type="geojson",
                    color="#00e676"
                )
            ]
        )

    # Default PFZ response
    return ChatResponse(
        text=f"🐟 Potential Fishing Zone Advisory for {location_name} ({date_str}): High concentration zone detected 18.5 km WSW of Kochi harbor. Target species: Indian Mackerel, Oil Sardine. Depth 38-52m.",
        language="en",
        safety=SafetyModel(
            status="SAFE",
            wave_height_m=1.4,
            wind_speed_knots=10.5,
            advice="Safe for sailing and longline operations."
        ),
        evidence=EvidenceModel(
            sst_range="28.2 - 28.6°C",
            chlorophyll="1.50 mg/m³",
            thermal_fronts=True,
            reasoning="Persistent thermal boundary with chlorophyll upwelling plume."
        ),
        layers=[
            LayerModel(
                id="pfz",
                name="Potential Fishing Zones (PFZ)",
                url=f"http://localhost:8000/layers/pfz/{date_str}.geojson",
                type="geojson",
                color="#00e676"
            ),
            LayerModel(
                id="sst",
                name="SST Thermal Contours",
                url=f"http://localhost:8000/layers/sst/{date_str}.geojson",
                type="geojson",
                color="#ff7043"
            )
        ]
    )

@app.get("/layers/{layer_id}/{date}.geojson")
def get_layer(layer_id: str, date: str):
    frontend_data_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "data")
    target_filename = f"{layer_id}_kochi_{date}.geojson"
    target_path = os.path.join(frontend_data_dir, target_filename)

    if not os.path.exists(target_path):
        # Try fallback
        fallback = os.path.join(frontend_data_dir, f"{layer_id}_kochi_2026-09-11.geojson")
        if os.path.exists(fallback):
            target_path = fallback
        else:
            raise HTTPException(status_code=404, detail=f"Layer {layer_id} for date {date} not found")

    with open(target_path, "r", encoding="utf-8-sig") as f:
        return json.load(f)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
