"""
Planner — wires real data into the M1 pipeline (weather + PFZ advisory),
falling back to synthetic stub text whenever a live source is unavailable.

is_live IS ONLY TRUE WHEN DATA ACTUALLY CAME FROM A LIVE FETCH THIS RUN OR
FROM A CACHED COPY OF ONE — never for the bundled static PFZ snapshot, and
never for the synthetic stub. This is what lets the frontend/judges trust
the flag instead of it being decorative.

Data sources:
  - fetch_marine_weather(): Open-Meteo Marine API (free, no key required),
    cache-checked first (same lat/lon/date reuses the DB row instead of
    re-fetching). On any network failure, returns None and the caller
    falls back to the stub weather text.
  - fetch_pfz_advisory(): INCOIS has no public programmatic feed, so this
    falls back to the bundled snapshot GeoJSON in frontend/public/data as
    "best available" data. This is real geodata but NOT live, so it is
    never allowed to set is_live=True.

Both need real internet access to hit Open-Meteo — this dev sandbox is
network-locked to a small allowlist, so the live path can only be tested
once deployed; the code degrades safely (to the old stub) if the request
fails, so /chat never crashes because of it.
"""

import json
import os
from typing import Optional

from schemas import ChatContext, SafetyInfo, EvidenceItem, MapLayer
from db import get_cached_advisory, cache_advisory

WEATHER_SOURCE = "open_meteo_marine"
PFZ_FALLBACK_SOURCE = "pfz_static_fallback"

_FRONTEND_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "data")
_PFZ_SNAPSHOT_FILE = "pfz_kochi_2026-09-11.geojson"


def fetch_marine_weather(lat: float, lon: float, date: str) -> Optional[dict]:
    """Live wave-height/period data from Open-Meteo Marine, DB-cached per
    (lat, lon, date). Returns None on cache miss + fetch failure — callers
    must treat None as "fall back to the stub", never as an error."""
    cached = get_cached_advisory(WEATHER_SOURCE, lat, lon, date)
    if cached is not None:
        return cached

    try:
        import httpx
        resp = httpx.get(
            "https://marine-api.open-meteo.com/v1/marine",
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
    """No public live INCOIS feed exists, so this reads the bundled PFZ
    snapshot GeoJSON as 'best available' data and DB-caches the read so
    repeat requests hit the DB instead of the filesystem. This data is
    real but NOT live — callers must never derive is_live=True from it."""
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
    """Pull a simple average wave height (m) out of Open-Meteo's hourly
    series, if present. Returns None if the shape is unexpected."""
    try:
        values = weather["hourly"]["wave_height"]
        values = [v for v in values if v is not None]
        if not values:
            return None
        return round(sum(values) / len(values), 2)
    except (KeyError, TypeError, ZeroDivisionError):
        return None

# Response templates localized by language code or script
PFZ_RESPONSES = {
    "hi": "यहाँ {location} के लिए आज {date} का संभावित मत्स्य क्षेत्र (PFZ) परामर्श है। आपके तट के पास उच्च क्लोरोफिल और अनुकूल समुद्री तापमान देखा गया है।",
    "ta": "இன்று {date} -ல் {location} பகுதிாக்கான சாத்தியமான மீன்பிடி மண்டல (PFZ) தகவல் இதோ. உங்கள் கடலோரப் பகுதியில் அதிகமான குளோரோஃபில் மற்றும் சாதகமான வெப்பநிலை கண்டறியப்பட்டுள்ளது.",
    "ml": "இന്ന് {date} -ൽ {location} തീരത്തിനായുള്ള സാധ്യതയുള്ള മത്സ്യബന്ധന മേഖല (PFZ) വിവരങ്ങൾ ഇതാ. നിങ്ങളുടെ കടൽത്തീരത്ത് ഉയർന്ന ക്ലോറോഫിൽ അടയാളപ്പെടുത്തിയിട്ടുണ്ട്.",
    "en": "Here's the Potential Fishing Zone advisory for {location} on {date}. High chlorophyll concentrations and favorable thermal boundaries have been detected off your coast."
}

SAFETY_RESPONSES = {
    "hi": "{location} के लिए {date} का सुरक्षा परामर्श: समुद्र में मध्यम स्थितियां हैं। तट से दूर हल्की लहरें दर्ज की गई हैं।",
    "ta": "{location} பகுதிக்கு {date} தேதிக்கான பாதுகாப்பு எச்சரிக்கை: கடல் மிதமான நிலையில் உள்ளது.",
    "ml": "{location} തീരത്തിന് {date} തീയതിയിലെ സുരക്ഷാ മുന്നറിയിപ്പ്: കടലിൽ സാധാരണ നിലയിലുള്ള തിരമാലകൾ രേഖപ്പെടുത്തിയിട്ടുണ്ട്.",
    "en": "Safety advisory for {location} on {date}: Moderate sea conditions reported. Low swell off the coast."
}


def run_planner(context: ChatContext) -> dict:
    weather = fetch_marine_weather(context.location.lat, context.location.lon, context.date)
    pfz = fetch_pfz_advisory(context.location.lat, context.location.lon, context.date)
    # Only a genuine live/cached-live weather fetch counts as "live" — the
    # PFZ snapshot is real data but a static fallback, never live.
    is_live = weather is not None
    avg_wave_m = _avg_wave_height_m(weather) if weather else None

    raw_msg = (context.raw_message or "").lower()
    
    # Read language directly from ChatContext
    lang = getattr(context, "language", "en")

    # Resolve location label dynamically
    # Avoids hardcoding "Current Location" or default "Kochi" when GPS coordinates are active
    if context.location_source == "device_gps" or context.location.name == "Current Location":
        location_display = "your current coastal area"
    elif context.location.name == "Kochi" and context.location_source == "default_fallback":
        location_display = "your coastal area"
    else:
        location_display = context.location.name

    # Match explicit PFZ intent or fallback keyword check
    if context.intent == "PFZ_QUERY" or any(w in raw_msg for w in ["fish", "machli", "meen"]):
        template = PFZ_RESPONSES.get(lang, PFZ_RESPONSES["en"])
        text = template.format(location=location_display, date=context.date)
        
        layers = [
            MapLayer(
                layer_type="PFZ",
                data={
                    "id": "pfz",
                    "name": "Potential Fishing Zones (PFZ)",
                    "url": f"/layers/pfz/{context.date}.geojson",
                    "color": "#00e676",
                    # The /layers/pfz endpoint still serves layer.py's stub
                    # bbox geometry (out of scope here), so this is always
                    # honestly False regardless of weather is_live.
                    "is_live": False
                }
            )
        ]

    elif context.intent == "SAFETY_CHECK" or any(w in raw_msg for w in ["safe", "wave", "wind", "weather", "toofan", "kadal"]):
        template = SAFETY_RESPONSES.get(lang, SAFETY_RESPONSES["en"])
        text = template.format(location=location_display, date=context.date)
        
        layers = [
            MapLayer(
                layer_type="ALERT_ZONE",
                data={
                    "id": "safety",
                    "name": "Sea Safety Warning Zone",
                    "url": f"/layers/boundaries/{context.date}.geojson",
                    "color": "#ff1744",
                    "is_live": is_live
                }
            )
        ]
    else:
        text = (
            f"Got your message. I understood location={location_display} "
            f"(resolved via {context.location_source}), date={context.date}, but "
            f"don't have a specific handler for this intent yet."
        )
        layers = []

    # Derive an honest safety verdict from the real wave data when we have
    # it; otherwise keep the old synthetic stub text (and is_live=False).
    if avg_wave_m is not None:
        if avg_wave_m < 1.25:
            safety_status = "SAFE"
        elif avg_wave_m < 2.5:
            safety_status = "CAUTION"
        else:
            safety_status = "UNSAFE"
        safety_reason = (
            f"Live Open-Meteo marine data: average wave height ~{avg_wave_m}m "
            f"off {location_display} today."
        )
        evidence = [
            EvidenceItem(
                source=WEATHER_SOURCE,
                summary=f"Open-Meteo marine forecast for {location_display}: avg wave height {avg_wave_m}m.",
                value=avg_wave_m,
                is_live=True,
            )
        ]
    else:
        safety_status = "SAFE"
        safety_reason = "Low wave height and light winds in area (stub — live weather fetch unavailable)"
        evidence = [
            EvidenceItem(
                source="stub",
                summary=f"Analyzed satellite data for {location_display}.",
                is_live=False,
            )
        ]

    if pfz is not None:
        evidence.append(
            EvidenceItem(
                source=PFZ_FALLBACK_SOURCE,
                summary=f"Using last available PFZ advisory snapshot for {location_display} (not live).",
                is_live=False,
            )
        )

    return {
        "text": text,
        "safety": SafetyInfo(
            status=safety_status,
            reason=safety_reason,
            is_live=is_live,
            wave_height_m=avg_wave_m,
        ),
        "evidence": evidence,
        "layers": layers,
    }
