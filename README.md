# Ocean PFZ Assistant

A conversational assistant that helps identify Potential Fishing Zones (PFZ), weather, and ocean conditions along the Kerala coast.

## Project Structure

- /backend — FastAPI server, conversation agent, planner, stub agents, layers service
- /frontend — React chat + map UI
- /docs — API schema and shared documentation

## Backend Setup

cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn mock_server:app --reload --port 8000

The backend will run at http://localhost:8000
(mock_server.py is the complete server — it has session carry-over, the
/layers endpoint the map needs, and confidence scores. main.py is a
simpler/older entry point kept for reference.)

## Frontend Setup

cd frontend
npm install
npm run dev

The frontend will run at http://localhost:5173 and calls the backend at http://localhost:8000

## API Contract

See docs/api_schema.md for the full /chat and /layers request/response schema.

## Notes

- Backend must always run on port 8000.
- Frontend must always point to http://localhost:8000.
- CORS must be enabled on the backend for local frontend requests to succeed.
