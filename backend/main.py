"""
ORCA Marine Intelligence Platform — M1: FastAPI app + Conversation Agent.

Run locally:
    uvicorn main:app --reload --port 8000

Test:
    curl -X POST http://localhost:8000/chat \
      -H "Content-Type: application/json" \
      -d '{"message": "Is it safe to venture into the sea tomorrow near Kochi?"}'
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from schemas import ChatRequest, ChatResponse, ChatContext, Location
from conversation_agent import (
    detect_language,
    classify_intent,
    extract_location,
    get_default_date,
)
from planner import run_planner

app = FastAPI(title="ORCA Conversation API", version="0.1.0")

# Wide open for hackathon dev — tighten before demo/deploy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    message = req.message

    language = detect_language(message)
    intent = classify_intent(message)

    if req.location is not None:
        location = req.location
    else:
        loc_dict = extract_location(message)
        location = Location(**loc_dict)

    resolved_date = req.date if req.date else get_default_date()

    context = ChatContext(
        location=location,
        date=resolved_date,
        intent=intent,
        language=language,
        raw_message=message,
    )

    result = run_planner(context)

    return ChatResponse(
        text=result["text"],
        language=language,
        safety=result["safety"],
        evidence=result["evidence"],
        layers=result["layers"],
        context=context,
    )
