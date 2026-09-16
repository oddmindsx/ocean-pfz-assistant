"""
Geospatial layer server (M1 stub) — backs GET /layers/{layer_id}/{date}.geojson.

Returns GeoJSON FeatureCollections for the frontend's Leaflet map.
All geometry here is a placeholder bounding box around the queried point
(or Kochi by default) — NOT real PFZ/SST/chlorophyll data. Every feature
carries "is_live": false in its properties, same convention as planner.py's
evidence flags, so the frontend never renders stub geometry as if it were
a real advisory layer.

M2/M3 replace the body of get_layer() with real geospatial queries
(ISRO Bhuvan / INCOIS layers) but should keep the same GeoJSON shape and
the is_live flag so the frontend doesn't need to change.
"""

from typing import Dict

VALID_LAYERS = {"pfz", "sst", "chlorophyll", "coastline", "alert_zone"}


def _bbox_around(lat: float, lon: float, delta: float = 0.5):
    return [
        [lon - delta, lat - delta],
        [lon + delta, lat - delta],
        [lon + delta, lat + delta],
        [lon - delta, lat + delta],
        [lon - delta, lat - delta],
    ]


def get_layer(layer_id: str, date: str, lat: float = 9.9312, lon: float = 76.2673) -> Dict:
    """Returns a GeoJSON FeatureCollection. Raises ValueError for an unknown layer_id."""
    if layer_id not in VALID_LAYERS:
        raise ValueError(f"Unknown layer_id '{layer_id}'. Valid: {sorted(VALID_LAYERS)}")

    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [_bbox_around(lat, lon)],
                },
                "properties": {
                    "layer_id": layer_id,
                    "date": date,
                    "is_live": False,
                    "note": "stub geometry — no real geospatial data source connected yet",
                },
            }
        ],
    }
