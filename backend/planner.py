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

def run_planner(context: ChatContext) -> dict:
    weather = fetch_marine_weather(context.location.lat, context.location.lon)
    pfz = fetch_pfz_advisory(context.location.lat, context.location.lon, context.date)
    is_live = weather is not None or pfz is not None

    raw_msg = (context.raw_message or "").lower()

    # Match explicit PFZ intent or fallback keyword check
    if context.intent == "PFZ_QUERY" or "fish" in raw_msg:
        text = (
            f"Here's the Potential Fishing Zone advisory for {context.location.name} on {context.date}. "
            f"High chlorophyll concentrations and favorable thermal boundaries have been detected off your coast."
        )
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
    elif context.intent == "SAFETY_CHECK" or any(w in raw_msg for w in ["safe", "wave", "wind", "weather"]):
        text = (
            f"Safety advisory for {context.location.name} on {context.date}: "
            f"Moderate sea conditions reported. Low swell off the coast."
        )
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
            f"Got your message. I understood location={context.location.name} "
            f"(resolved via {context.location_source}), date={context.date}, but "
            f"don't have a specific handler for this intent yet "
            f"(confidence in that read: {context.intent_confidence})."
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
                summary=f"Analyzed satellite data for {context.location.name}.",
                is_live=is_live,
            )
        ],
        "layers": layers,
    }
