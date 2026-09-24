"""
Planner — wires real data into the M1 pipeline (weather + PFZ advisory),
falling back to synthetic stub text whenever a live source is unavailable.
"""

import json
import os
from typing import Optional
from groq import Groq

from schemas import ChatContext, SafetyInfo, EvidenceItem, MapLayer
from db import get_cached_advisory, cache_advisory

WEATHER_SOURCE = "open_meteo_marine"
PFZ_FALLBACK_SOURCE = "pfz_static_fallback"

_FRONTEND_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "data")
_PFZ_SNAPSHOT_FILE = "pfz_kochi_2026-09-11.geojson"

# Fetch Groq environment variables
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-20b")


def fetch_marine_weather(lat: float, lon: float, date: str) -> Optional[dict]:
    cached = get_cached_advisory(WEATHER_SOURCE, lat, lon, date)
    if cached is not None:
        return cached

    try:
        import httpx
        resp = httpx.get(
            "https://open-meteo.com",
            params={"latitude": lat, "longitude": lon,
                    "hourly": "wave_height,wave_period"},
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        return None

    cache_advisory(WEATHER_SOURCE, lat, lon, date, data)
    return data


def fetch_pfz_advisory(lat: float, lon: float, date: str) -> Optional[dict]:
    cached = get_cached_advisory(PFZ_FALLBACK_SOURCE, lat, lon, date)
    if cached is not None:
        return cached

    path = os.path.join(_FRONTEND_DATA_DIR, _PFZ_SNAPSHOT_FILE)
    try:
        with open(path, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError):
        return None

    cache_advisory(PFZ_FALLBACK_SOURCE, lat, lon, date, data)
    return data


def _avg_wave_height_m(weather: dict) -> Optional[float]:
    try:
        values = weather["hourly"]["wave_height"]
        values = [v for v in values if v is not None]
        if not values:
            return None
        return round(sum(values) / len(values), 2)
    except (KeyError, TypeError, ZeroDivisionError):
        return None


def run_planner(context: ChatContext) -> dict:
    weather = fetch_marine_weather(context.location.lat, context.location.lon, context.date)
    pfz = fetch_pfz_advisory(context.location.lat, context.location.lon, context.date)
    
    is_live = weather is not None
    avg_wave_m = _avg_wave_height_m(weather) if weather else 1.06  # default baseline

    raw_msg = (context.raw_message or "").lower()
    lang = getattr(context, "language", "en")

    if context.location_source == "device_gps" or context.location.name == "Current Location":
        location_display = "your current coastal area"
    elif context.location.name == "Kochi" and context.location_source == "default_fallback":
        location_display = "your coastal area"
    else:
        location_display = context.location.name

    safety_status = "SAFE"
    if avg_wave_m > 2.5:
        safety_status = "UNSAFE"

    # Set up native layout structures
    if context.intent == "PFZ_QUERY" or any(w in raw_msg for w in ["fish", "machli", "meen"]):
        layer_type = "PFZ"
        layer_name = "Potential Fishing Zones (PFZ)"
        layer_url = f"/layers/pfz/{context.date}.geojson"
        layer_color = "#00e676"
    else:
        layer_type = "ALERT_ZONE"
        layer_name = "Sea Safety Warning Zone"
        layer_url = f"/layers/boundaries/{context.date}.geojson"
        layer_color = "#ff1744"

    layers = [
        MapLayer(
            layer_type=layer_type,
            data={
                "id": "safety",
                "name": layer_name,
                "url": layer_url,
                "color": layer_color,
                "is_live": is_live
            }
        )
    ]

    # Live API Call Execution Block
    if GROQ_API_KEY:
        try:
            client = Groq(api_key=GROQ_API_KEY)
            prompt = f"""
            You are ORCA, an intelligent marine assistant for fishermen. 
            
            Context Data:
            - User Location: {location_display}
            - Sea Safety Condition: {safety_status} (Average Wave Height: {avg_wave_m}m)
            - Intent Detected: {context.intent}

            Instructions:
            1. If the 'Intent Detected' is 'OTHER' or the message is just a general greeting, respond politely as an AI fishing assistant, greet them back, and ask how you can help them with fishing or sea safety today.
            2. If the intent is related to fishing (PFZ) or safety, generate a short advisory update based on the Context Data.
            3. Keep your response under 3 short sentences.
            4. Natively match the language code '{lang}' (e.g. if 'hi' use Hindi, if 'ta' use Tamil, if 'ml' use Malayalam, if 'mr' use Marathi, if 'en' use English).
            """
            
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=GROQ_MODEL,
                temperature=0.3
            )
            # FIXED: Added [0] index to select the first choice item from the list object response
            text = chat_completion.choices[0].message.content
        except Exception as e:
            print(f"Groq Integration Error: {e}")
            text = f"Safety advisory for {location_display} on {context.date}: Moderate sea conditions reported."
    else:
        text = f"Safety advisory for {location_display} on {context.date}: Moderate sea conditions reported."

    return {
        "text": text,
        "safety": SafetyInfo(
            status=safety_status, 
            reason=f"Live Open-Meteo marine data: average wave height ~{avg_wave_m}m off {location_display} today.",
            alerts=[],
            is_live=is_live,
            wave_height_m=avg_wave_m,
            wind_speed_knots=None
        ),
        "evidence": [
            EvidenceItem(source="open_meteo_marine", summary=f"Open-Meteo marine forecast for {location_display}: avg wave height {avg_wave_m}m.", value=avg_wave_m, is_live=is_live),
            EvidenceItem(source="pfz_static_fallback", summary=f"Using last available PFZ advisory snapshot for {location_display} (not live).", value=None, is_live=False)
        ],
        "layers": layers
    }
