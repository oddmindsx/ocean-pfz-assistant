"""
Common schema shared across the team (M1-M5).
Everyone should import from here instead of redefining models,
so M2/M3/M4 agents plug straight into the same shape.
"""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class Location(BaseModel):
    name: str
    lat: float
    lon: float


class ChatContext(BaseModel):
    """Resolved context passed down to planner/agents after parsing the message."""
    location: Location
    date: str  # ISO date string, e.g. "2026-09-12"
    intent: str  # PFZ_QUERY | SAFETY_CHECK | OTHER
    language: str  # ISO 639-1 code, e.g. "en", "hi", "ml"
    raw_message: str


class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    # Optional overrides — if the frontend already knows the user's location/date
    # (e.g. from GPS or a date picker), it can pass them and we skip extraction.
    location: Optional[Location] = None
    date: Optional[str] = None


class SafetyInfo(BaseModel):
    status: str = "unknown"       # "safe" | "caution" | "unsafe" | "unknown"
    reason: str = ""
    alerts: List[str] = Field(default_factory=list)


class EvidenceItem(BaseModel):
    source: str
    summary: str
    value: Optional[Any] = None


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
