"""
Planner stub (M1 placeholder).

M2 replaces `run_planner` with actual multi-agent orchestration
(planning agent -> data-discovery agent -> ocean analytics agent -> etc).
Keep the function signature stable: takes a ChatContext, returns a dict
matching {text, safety, evidence, layers} so main.py doesn't need to change.
"""

from schemas import ChatContext, SafetyInfo, EvidenceItem, MapLayer


def run_planner(context: ChatContext) -> dict:
    """Dummy response generator so /chat has something real to return end-to-end."""

    if context.intent == "PFZ_QUERY":
        text = (
            f"Here's a placeholder Potential Fishing Zone result for "
            f"{context.location.name} on {context.date}. Real PFZ data pending M2/M3."
        )
        layers = [MapLayer(layer_type="PFZ", data={"note": "stub polygon"})]
    elif context.intent == "SAFETY_CHECK":
        text = (
            f"Placeholder safety check for {context.location.name} on {context.date}. "
            f"No live weather/ocean data wired up yet."
        )
        layers = [MapLayer(layer_type="ALERT_ZONE", data={"note": "stub"})]
    else:
        text = (
            f"Got your message. I understood location={context.location.name}, "
            f"date={context.date}, but I don't have a specific handler for this "
            f"intent yet."
        )
        layers = []

    return {
        "text": text,
        "safety": SafetyInfo(status="unknown", reason="stub planner — no live data yet"),
        "evidence": [
            EvidenceItem(
                source="stub",
                summary="This is dummy evidence from the M1 planner stub.",
            )
        ],
        "layers": layers,
    }
