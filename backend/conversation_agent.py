"""
Conversation Agent (M1) — language detection, intent classification, location resolution.

READ THIS BEFORE DEMO DAY — what's actually fixed vs. what's a hard limit:

detect_language():
  Uses langdetect (statistical n-gram model, ships its own language profiles,
  no network call) instead of pure script matching. This correctly tells
  Hindi from Marathi (both Devanagari) and identifies Tamil/Telugu/Malayalam/
  Kannada/Gujarati/Bengali/Punjabi by script + statistics.
  HARD LIMIT: romanized regional-language text ("kal jaana safe hai kya",
  typed in Latin letters) is NOT reliably detectable by any statistical
  language-ID approach, this one included — it commonly gets misclassified
  as an unrelated language (Indonesian, Somali, etc). This is a known open
  problem in NLP, not a bug in this function. If romanized input matters for
  the demo, that needs a transliteration model or an LLM call — flag it to
  the team rather than expecting a keyword fix.

classify_intent_with_confidence():
  Multilingual + fuzzy keyword matching with an explainable confidence score
  (see matched_keywords). Covers en/hi/mr/ta/te/ml/kn for PFZ and safety
  intents, including hazard words like tsunami/storm surge.
  HARD LIMIT: translations for hi/mr/ta/te/ml/kn below are from general
  knowledge, not verified by a native speaker — have someone on the team
  sanity-check spellings before the demo. Also, keyword matching in any
  language can still misfire on indirect or sarcastic phrasing; that's
  inherent to the approach.

extract_location():
  Text-based fallback ONLY. Live GPS from the client (req.location in
  mock_server.py) is always the primary source and wins over this — the
  frontend should send device coordinates whenever it has them. This
  function expands the gazetteer to ~30 coastal locations and adds fuzzy
  matching for spelling variants, but it is still a finite list, not real
  geocoding.
"""

import re
from typing import Dict

from datetime import date as _date
from langdetect import detect_langs, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException
from rapidfuzz import fuzz, process

DetectorFactory.seed = 0  # deterministic results across runs

SUPPORTED_LANGUAGES = {"en", "hi", "mr", "ta", "te", "ml", "kn", "gu", "bn", "pa"}

_SCRIPT_RANGES = {
    "hi": (0x0900, 0x097F),  # Devanagari — shared by Hindi AND Marathi
    "bn": (0x0980, 0x09FF),
    "gu": (0x0A80, 0x0AFF),
    "pa": (0x0A00, 0x0A7F),
    "ta": (0x0B80, 0x0BFF),
    "te": (0x0C00, 0x0C7F),
    "kn": (0x0C80, 0x0CFF),
    "ml": (0x0D00, 0x0D7F),
}


def _script_heuristic(text: str) -> str:
    """Unicode block check. Reliable for SCRIPT id, not language id (can't split Hindi/Marathi)."""
    counts = {lang: 0 for lang in _SCRIPT_RANGES}
    for ch in text:
        cp = ord(ch)
        for lang, (start, end) in _SCRIPT_RANGES.items():
            if start <= cp <= end:
                counts[lang] += 1
                break
    best_lang, best_count = max(counts.items(), key=lambda kv: kv[1])
    return best_lang if best_count > 0 else "en"


def detect_language(text: str) -> str:
    """Real statistical language ID, restricted to ORCA's supported language set."""
    if not text or not text.strip():
        return "en"

    stripped = text.strip()

    # langdetect is unreliable under ~4 tokens — use the script heuristic instead
    if len(stripped.split()) < 4:
        return _script_heuristic(stripped)

    try:
        candidates = detect_langs(stripped)
    except LangDetectException:
        return _script_heuristic(stripped)

    for candidate in candidates:
        if candidate.lang in SUPPORTED_LANGUAGES:
            return candidate.lang

    # Top guess wasn't a supported language — likely romanized text misfiring.
    # Try the script heuristic (catches non-Latin scripts langdetect missed);
    # otherwise surface langdetect's raw guess rather than silently forcing "en".
    script_guess = _script_heuristic(stripped)
    return script_guess if script_guess != "en" else candidates[0].lang


# --- intent classification --------------------------------------------------
# English keywords are verified. hi/mr/ta/te/ml/kn entries are best-effort —
# have a native speaker on the team check these before the demo.
INTENT_KEYWORDS = {
    "PFZ_QUERY": {
        "en": ["pfz", "potential fishing zone", "fishing zone", "where to fish",
               "chlorophyll", "fish availability", "nearest fishing", "fish stock"],
        "hi": ["मछली पकड़ने का क्षेत्र", "मछली", "मत्स्य क्षेत्र"],
        "mr": ["मासेमारी क्षेत्र", "मासे", "मत्स्य क्षेत्र"],
        "ta": ["மீன்பிடி பகுதி", "மீன்"],
        "te": ["చేపలు పట్టే ప్రాంతం", "చేపలు"],
        "ml": ["മത്സ്യബന്ധന മേഖല", "മീൻ"],
        "kn": ["ಮೀನುಗಾರಿಕೆ ಪ್ರದೇಶ", "ಮೀನು"],
    },
    "SAFETY_CHECK": {
        "en": ["safe", "safety", "venture into", "cyclone", "lightning", "storm",
               "high wave", "warning", "alert", "risk", "hazard", "danger",
               "tsunami", "storm surge", "rough sea", "gale"],
        "hi": ["सुरक्षित", "खतरा", "तूफान", "चक्रवात", "चेतावनी", "सुनामी",
               "बिजली गिरना", "ऊंची लहरें"],
        "mr": ["सुरक्षित", "धोका", "वादळ", "चक्रीवादळ", "इशारा", "त्सुनामी", "वीज"],
        "ta": ["பாதுகாப்பான", "ஆபத்து", "புயல்", "எச்சரிக்கை", "சுனாமி", "மின்னல்"],
        "te": ["సురక్షితం", "ప్రమాదం", "తుఫాను", "హెచ్చరిక", "సునామి", "పిడుగు"],
        "ml": ["സുരക്ഷിതം", "അപകടം", "കൊടുങ്കാറ്റ്", "ചുഴലിക്കാറ്റ്",
               "മുന്നറിയിപ്പ്", "സുനാമി", "മിന്നൽ"],
        "kn": ["ಸುರಕ್ಷಿತ", "ಅಪಾಯ", "ಬಿರುಗಾಳಿ", "ಚಂಡಮಾರುತ", "ಎಚ್ಚರಿಕೆ",
               "ಸುನಾಮಿ", "ಮಿಂಚು"],
    },
}

_FUZZY_THRESHOLD = 0.85   # rapidfuzz partial_ratio / 100, catches typos/variants
_CONFIDENCE_FLOOR = 0.55  # below this, classify as OTHER rather than force a guess


def classify_intent_with_confidence(text: str) -> Dict:
    """
    Returns {"intent": str, "confidence": float 0-1, "matched_keywords": [...]}.
    Exact substring hits score 1.0; fuzzy hits score their match ratio.
    classify_intent() below just unwraps this for simple callers.
    """
    if not text or not text.strip():
        return {"intent": "OTHER", "confidence": 1.0, "matched_keywords": []}

    lowered = text.lower()
    best_intent = "OTHER"
    best_score = 0.0
    best_matches = []

    for intent, lang_map in INTENT_KEYWORDS.items():
        intent_score = 0.0
        intent_matches = []
        for kw_list in lang_map.values():
            for kw in kw_list:
                kw_lower = kw.lower()
                if kw_lower in lowered:
                    intent_score = 1.0
                    intent_matches.append(kw)
                else:
                    ratio = fuzz.partial_ratio(kw_lower, lowered) / 100
                    if ratio >= _FUZZY_THRESHOLD and ratio > intent_score:
                        intent_score = ratio
                        intent_matches.append(kw)
        if intent_score > best_score:
            best_score = intent_score
            best_intent = intent
            best_matches = intent_matches

    if best_score < _CONFIDENCE_FLOOR:
        return {"intent": "OTHER", "confidence": round(1 - best_score, 2), "matched_keywords": []}

    return {
        "intent": best_intent,
        "confidence": round(best_score, 2),
        "matched_keywords": best_matches[:5],
    }


def classify_intent(text: str) -> str:
    """Thin wrapper kept for simple callers that only want the label."""
    return classify_intent_with_confidence(text)["intent"]


# --- location resolution -----------------------------------------------
# Gazetteer of major Indian coastal / fishing-hub locations. This is a
# fallback for TYPED place names only — live GPS from the client always
# wins (see mock_server.py). Still a finite list, not real geocoding.
KNOWN_LOCATIONS = {
    "kochi": {"name": "Kochi", "lat": 9.9312, "lon": 76.2673},
    "mumbai": {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777},
    "chennai": {"name": "Chennai", "lat": 13.0827, "lon": 80.2707},
    "goa": {"name": "Goa", "lat": 15.2993, "lon": 74.1240},
    "visakhapatnam": {"name": "Visakhapatnam", "lat": 17.6868, "lon": 83.2185},
    "vizag": {"name": "Visakhapatnam", "lat": 17.6868, "lon": 83.2185},
    "mangalore": {"name": "Mangalore", "lat": 12.9141, "lon": 74.8560},
    "kozhikode": {"name": "Kozhikode", "lat": 11.2588, "lon": 75.7804},
    "calicut": {"name": "Kozhikode", "lat": 11.2588, "lon": 75.7804},
    "thiruvananthapuram": {"name": "Thiruvananthapuram", "lat": 8.5241, "lon": 76.9366},
    "trivandrum": {"name": "Thiruvananthapuram", "lat": 8.5241, "lon": 76.9366},
    "kollam": {"name": "Kollam", "lat": 8.8932, "lon": 76.6141},
    "alappuzha": {"name": "Alappuzha", "lat": 9.4981, "lon": 76.3388},
    "tuticorin": {"name": "Thoothukudi", "lat": 8.7642, "lon": 78.1348},
    "thoothukudi": {"name": "Thoothukudi", "lat": 8.7642, "lon": 78.1348},
    "rameswaram": {"name": "Rameswaram", "lat": 9.2876, "lon": 79.3129},
    "nagapattinam": {"name": "Nagapattinam", "lat": 10.7672, "lon": 79.8449},
    "puducherry": {"name": "Puducherry", "lat": 11.9416, "lon": 79.8083},
    "pondicherry": {"name": "Puducherry", "lat": 11.9416, "lon": 79.8083},
    "kakinada": {"name": "Kakinada", "lat": 16.9891, "lon": 82.2475},
    "machilipatnam": {"name": "Machilipatnam", "lat": 16.1875, "lon": 81.1389},
    "paradip": {"name": "Paradip", "lat": 20.3167, "lon": 86.6167},
    "puri": {"name": "Puri", "lat": 19.8135, "lon": 85.8312},
    "digha": {"name": "Digha", "lat": 21.6274, "lon": 87.5093},
    "kolkata": {"name": "Kolkata", "lat": 22.5726, "lon": 88.3639},
    "diu": {"name": "Diu", "lat": 20.7144, "lon": 70.9874},
    "veraval": {"name": "Veraval", "lat": 20.9077, "lon": 70.3661},
    "porbandar": {"name": "Porbandar", "lat": 21.6417, "lon": 69.6293},
    "okha": {"name": "Okha", "lat": 22.4707, "lon": 69.0658},
    "surat": {"name": "Surat", "lat": 21.1702, "lon": 72.8311},
    "ratnagiri": {"name": "Ratnagiri", "lat": 16.9902, "lon": 73.3120},
    "malvan": {"name": "Malvan", "lat": 16.0667, "lon": 73.4667},
    "karwar": {"name": "Karwar", "lat": 14.8137, "lon": 74.1290},
    "udupi": {"name": "Udupi", "lat": 13.3409, "lon": 74.7421},
    "port blair": {"name": "Port Blair", "lat": 11.6234, "lon": 92.7265},
    "kavaratti": {"name": "Kavaratti", "lat": 10.5669, "lon": 72.6420},
}

DEFAULT_LOCATION = KNOWN_LOCATIONS["kochi"]
_LOCATION_FUZZY_THRESHOLD = 85  # rapidfuzz score, 0-100


def extract_location(text: str) -> Dict:
    """
    Returns {"name", "lat", "lon", "resolved": bool, "method": str}.
    method is one of: "gazetteer_exact" | "gazetteer_fuzzy" | "default_fallback".
    `resolved=False` means nothing matched and Kochi was used as a last resort —
    callers should check this rather than silently trusting the coordinates.
    """
    if not text:
        result = dict(DEFAULT_LOCATION)
        result.update(resolved=False, method="default_fallback")
        return result

    lowered = text.lower()

    for key, loc in KNOWN_LOCATIONS.items():
        if re.search(rf"\b{re.escape(key)}\b", lowered):
            out = dict(loc)
            out.update(resolved=True, method="gazetteer_exact")
            return out

    best_match = process.extractOne(lowered, KNOWN_LOCATIONS.keys(), scorer=fuzz.partial_ratio)
    if best_match and best_match[1] >= _LOCATION_FUZZY_THRESHOLD:
        out = dict(KNOWN_LOCATIONS[best_match[0]])
        out.update(resolved=True, method="gazetteer_fuzzy")
        return out

    result = dict(DEFAULT_LOCATION)
    result.update(resolved=False, method="default_fallback")
    return result


def get_default_date() -> str:
    """Today's date in ISO format, used when neither the request nor the session has one."""
    return _date.today().isoformat()
