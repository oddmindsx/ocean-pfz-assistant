# API Schema — Ocean PFZ Assistant

## POST /chat

### Request

```json
{
  "message": "string",
  "context": {
    "location": {
      "name": "string",
      "lat": 0.0,
      "lon": 0.0
    },
    "date": "YYYY-MM-DD"
  }
}
```

### Response

```json
{
  "text": "string",
  "language": "string",
  "safety": {
    "status": "string",
    "details": "string"
  },
  "evidence": [
    {
      "source": "string",
      "value": "string"
    }
  ],
  "layers": ["sst", "pfz", "chlorophyll", "boundaries"]
}
```

## GET /layers/{layer_id}/{date}.geojson

Returns a GeoJSON object for the requested layer and date.

Valid layer_id values: sst, pfz, chlorophyll, boundaries

### Response

Standard GeoJSON FeatureCollection.

## Notes

- All endpoints return JSON.
- Dates are in YYYY-MM-DD format.
- Default location if none provided: Kochi.
- Default date if none provided: current date.
