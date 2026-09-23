# API Schema — Ocean PFZ Assistant

## POST /chat

### Request

```json
{
  "message": "string",
  "user_id": "string (optional)",
  "location": {
    "name": "string",
    "lat": 0.0,
    "lon": 0.0
  },
  "date": "YYYY-MM-DD (optional, defaults to today)"
}
```

`location` is optional — if omitted, the backend tries to extract a place
name from `message` text; if that also fails, it falls back to a default
location (Kochi). Always send device GPS in `location` when available —
it takes priority over text-based extraction.

### Response

```json
{
  "text": "string",
  "language": "string",
  "safety": {
    "status": "SAFE | CAUTION | UNSAFE | unknown",
    "reason": "string",
    "alerts": ["string"],
    "is_live": true,
    "wave_height_m": 1.23,
    "wind_speed_knots": null
  },
  "evidence": [
    {
      "source": "string",
      "summary": "string",
      "value": "any, optional",
      "is_live": true
    }
  ],
  "layers": [
    {
      "layer_type": "string",
      "data": { "url": "string", "color": "string", "is_live": false }
    }
  ],
  "context": {
    "location": { "name": "string", "lat": 0.0, "lon": 0.0 },
    "location_source": "device_gps | gazetteer_exact | gazetteer_fuzzy | carried_over_from_session | default_fallback",
    "date": "YYYY-MM-DD",
    "intent": "PFZ_QUERY | SAFETY_CHECK | OTHER",
    "intent_confidence": 0.0,
    "language": "string",
    "matched_keywords": ["string"],
    "raw_message": "string"
  }
}
```

Notes on `is_live`:
- `safety.is_live` and an evidence item's `is_live` are `true` only when
  that specific piece of data came from a real live fetch (or a same-day
  cache of one) this run — e.g. the Open-Meteo marine weather fetch.
- The PFZ advisory evidence item is always `is_live: false`. There is no
  public live INCOIS feed, so it's served from a bundled static snapshot
  — real data, but not live, and never reported as such.
- `context` is echoed back mainly for debugging / for M2 agents chaining
  off this response.

## GET /layers/{layer_id}/{date}.geojson

Returns a GeoJSON object for the requested layer and date.

Optional query params: `lat` (default 9.9312), `lon` (default 76.2673).

Valid `layer_id` values: `pfz`, `sst`, `chlorophyll`, `coastline`, `alert_zone`
`boundaries` is also accepted as a special case (routes to the coastline data)
but is not itself a member of the valid layer set above.

### Response

Standard GeoJSON FeatureCollection.

## Notes

- All endpoints return JSON.
- Dates are in YYYY-MM-DD format.
- Default location if none provided: Kochi.
- Default date if none provided: current date.
- `/chat` also logs each request (message, resolved intent/location/date,
  response text, is_live) to a local `queries` table for usage tracking —
  see `backend/db.py`.
