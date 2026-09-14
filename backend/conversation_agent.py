"""
Conversation Agent (M1).

Three standalone functions, each independently testable, so M2 (planner/agent
orchestration) can import and call them directly without touching FastAPI.
"""

import re
from datetime import date
from typing import Dict

# --- known locations for MVP (extend this dict as needed) -----------------
KNOWN_LOCATIONS = {
    "kochi": {"name": "Kochi", "lat": 9.9312, "lon": 76.2673},
    "mumbai": {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777},
    "chennai": {"name": "Chennai", "lat": 13.0827, "lon": 80.2707},
    "goa": {"name": "Goa", "lat": 15.2993, "lon": 74.1240},
    "visakhapatnam": {"name": "Visakhapatnam", "lat": 17.6868, "lon": 83.2185},
}

DEFAULT_LOCATION = KNOWN_LOCATIONS["kochi"]


def detect_language(text: str) -> str:
    """
    Very lightweight script-based detection for MVP.
    Checks unicode ranges for common Indian scripts before falling back to English.
    Swap this out for `langdetect` / `fasttext` in M-later if needed.
    """
    if not text or not text.strip():
        return "en"

    script_ranges = {
        "hi": (0x0900, 0x097F),  # Devanagari (Hindi/Marathi)
        "bn": (0x0980, 0x09FF),  # Bengali
        "ta": (0x0B80, 0x0BFF),  # Tamil
        "te": (0x0C00, 0x0C7F),  # Telugu
        "ml": (0x0D00, 0x0D7F),  # Malayalam
        "gu": (0x0A80, 0x0AFF),  # Gujarati
        "kn": (0x0C80, 0x0CFF),  # Kannada
        "pa": (0x0A00, 0x0A7F),  # Gurmukhi (Punjabi)
    }

    counts = {lang: 0 for lang in script_ranges}
    for ch in text:
        cp = ord(ch)
        for lang, (start, end) in script_ranges.items():
            if start <= cp <= end:
                counts[lang] += 1
                break

    best_lang, best_count = max(counts.items(), key=lambda kv: kv[1])
    if best_count > 0:
        return best_lang
    return "en"


# --- intent classification --------------------------------------------------
_PFZ_KEYWORDS = [
    "pfz", "potential fishing zone", "fishing zone", "where to fish",
    "chlorophyll", "fish availability", "nearest fishing",
]
_SAFETY_KEYWORDS = [
    "safe", "safety", "venture into", "cyclone", "lightning", "storm",
    "high wave", "warning", "alert", "risk", "hazard", "danger",
]


def classify_intent(text: str) -> str:
    """
    Simple keyword-matching classifier for MVP.
    Returns one of: PFZ_QUERY, SAFETY_CHECK, OTHER.
    Replace with an actual intent model / LLM call once M2's planner exists —
    this function's signature can stay the same.
    """
    if not text:
        return "OTHER"

    lowered = text.lower()

    if any(kw in lowered for kw in _SAFETY_KEYWORDS):
        return "SAFETY_CHECK"
    if any(kw in lowered for kw in _PFZ_KEYWORDS):
        return "PFZ_QUERY"
    return "OTHER"


# --- location extraction ----------------------------------------------------
def extract_location(text: str) -> Dict:
    """
    Naive substring match against KNOWN_LOCATIONS.
    Falls back to Kochi (MVP default) when nothing matches.
    Returns: {"name": str, "lat": float, "lon": float}
    """
    if not text:
        return dict(DEFAULT_LOCATION)

    lowered = text.lower()
    for key, loc in KNOWN_LOCATIONS.items():
        if re.search(rf"\b{re.escape(key)}\b", lowered):
            return dict(loc)

    return dict(DEFAULT_LOCATION)


def get_default_date() -> str:
    """Today's date in ISO format, used when the request doesn't supply one."""
    return date.today().isoformat()
