"""
Common schema shared across the team (M1-M4).
Frontend (M4) and downstream agents (M2/M3) should import from here instead
of redefining models, so everyone plugs into the same contract.
"""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class Location(BaseModel):
    name: str
    lat: float
    lon: float


class ChatContext(BaseModel):
    """Resolved context passed down to the planner/agents after parsing the message."""
    location: Location
    location_source: str
    # "device_gps" | "gazetteer_exact" | "gazetteer_fuzzy" |
    # "carried_over_from_session" | "default_fallback"
    date: str  # ISO date string, e.g. "2026-09-14"
    intent: str  # PFZ_QUERY | SAFETY_CHECK | OTHER
    intent_confidence: float  # 0-1
    language: str  # ISO 639-1 code, e.g. "en", "hi", "mr", "ta"
    matched_keywords: List[str] = Field(default_factory=list)
    raw_message: str


class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    # Live device GPS — always send this from the frontend when available.
    # It takes priority over any text-based location extraction.
    location: Optional[Location] = None
    date: Optional[str] = None


class SafetyInfo(BaseModel):
    status: str = "unknown"       # "safe" | "caution" | "unsafe" | "unknown"
    reason: str = ""
    alerts: List[str] = Field(default_factory=list)
    is_live: bool = False  # False until a real weather/ocean data source is wired in


class EvidenceItem(BaseModel):
    source: str
    summary: str
    value: Optional[Any] = None
    is_live: bool = False  # False = synthetic/stub data, not a real reading


class MapLayer(BaseModel):
    layer_type: str   # e.g. "PFZ", "SST", "CHLOROPHYLL", "ALERT_ZONE"
    data: Dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    text: str
    language: str
    safety: SafetyInfo
    evidence: List[EvidenceItem]
    layers: List[MapLayer]
    context: ChatContext  # echoed back — useful for debugging / M2 chaining
