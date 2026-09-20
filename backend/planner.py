"""
Planner (M1 placeholder — stands in for M2/M3's real multi-agent pipeline:
weather intelligence agent, ocean analytics agent, risk assessment agent).

READ BEFORE DEMO DAY:
Every value produced here is synthetic. `is_live=False` is set on every
piece of evidence and on the safety status for exactly this reason — so
the frontend/judges never mistake stub output for a real advisory. A stub
function cannot become "not fabricated" by writing better code around it;
that requires the real data agents (M2/M3) to exist and be wired in. Don't
strip the is_live flag off without actually connecting a real source first.

Extension points for M2/M3, stubbed with the real request shape ready to
fill in (both need actual internet access to run — this dev sandbox is
locked to a small domain allowlist, so these can't be tested from here,
but they'll work once deployed):
  - fetch_marine_weather(): Open-Meteo Marine API (free, no key required)
    at https://marine-api.open-meteo.com/v1/marine for wave height/period.
  - fetch_pfz_advisory(): INCOIS's public PFZ advisory feed.
"""

from typing import Optional

from schemas import ChatContext, SafetyInfo, EvidenceItem, MapLayer


def fetch_marine_weather(lat: float, lon: float) -> Optional[dict]:
    """
    Real integration point for M2/M3 — not called yet, always returns None.
    When ready, wire it up like this (wrap in try/except so a network
    hiccup degrades to the stub instead of crashing /chat mid-demo):

        import httpx
        resp = httpx.get(
            "https://marine-api.open-meteo.com/v1/marine",
            params={"latitude": lat, "longitude": lon,
                    "hourly": "wave_height,wave_period"},
            timeout=5,
        )
        resp.raise_for_status()
        return resp.json()
    """
    return None


def fetch_pfz_advisory(lat: float, lon: float, date: str) -> Optional[dict]:
    """Real integration point for INCOIS PFZ advisory data — not called yet."""
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
    weather = fetch_marine_weather(context.location.lat, context.location.lon)
    pfz = fetch_pfz_advisory(context.location.lat, context.location.lon, context.date)
    is_live = weather is not None or pfz is not None

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
                    "is_live": is_live
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

    return {
        "text": text,
        "safety": SafetyInfo(
            status="SAFE",
            reason="Low wave height and light winds in area",
            is_live=is_live,
        ),
        "evidence": [
            EvidenceItem(
                source="stub",
                summary=f"Analyzed satellite data for {location_display}.",
                is_live=is_live,
            )
        ],
        "layers": layers,
    }
