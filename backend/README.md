# ORCA — M1 Backend (API + Conversation Agent)

## Run
```
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Test
```
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Is it safe to venture into the sea tomorrow near Kochi?"}'
```

## Files
- `schemas.py` — shared request/response models (import from here in M2+, don't redefine)
- `conversation_agent.py` — detect_language, classify_intent, extract_location (all standalone, testable without FastAPI)
- `planner.py` — stub; M2 replaces `run_planner()` internals, keep the signature
- `main.py` — FastAPI app, `POST /chat`, `GET /health`

## Known MVP limitations (flag these to the team)
- `extract_location` only knows 5 hardcoded cities (Kochi, Mumbai, Chennai, Goa, Visakhapatnam); anything else falls back to Kochi.
- `classify_intent` is keyword matching in English only — a Hindi/Malayalam query about safety won't hit the SAFETY_CHECK keywords even though language detection correctly tags it as hi/ml. M2/M3 will likely want per-language keyword sets or an LLM-based classifier.
- `detect_language` is script-range based — distinguishes scripts (Hindi vs Tamil vs English) but can't tell Hindi from Marathi (both Devanagari) or similar same-script languages apart.
