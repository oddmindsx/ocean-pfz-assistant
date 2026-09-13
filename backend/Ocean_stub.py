# ocean.py

def get_pfz(location: dict, date: str) -> list[dict]:

    #Fetching the user's location data
    #Asking for location access permission
    location_name = location.get("location", {})

    #If access not granted, set to a default location of Kochi
    lat = location_name.get("lat", 9.9312)
    lon = location_name.get("lon", 76.2673)
    loc_name = location_name.get("name", "unknown coast")

    pfz_polygon = [
        #Opens a list to store multiple fishing hotspot objects
        {
            "Zone id": f"pfz_{loc_name.replace(' ', '_')}_01",
            #Creates a unique zone ID string dynamically using Python f-strings.

            #Specifies that this hotspot has a "HIGH" prediction confidence, lists likely fish species found in the region, and sets a mock distance of 14.2 km from the user's position.
            "Confidence": "High",
            "Target species": ["Oil Sardin", "Indian Mackrel", "Tuna"],
            "distance_km": 14.2,

            "Coordinates": [
                [lon + 0.02, lat + 0.02],
                [lon + 0.05, lat + 0.05],
                [lon + 0.06, lat + 0.06],
                [lon + 0.02, lat + 0.02]
            ],

            "SST celsius": 27.9,
            "Chlorophyll_mg": 1.90,
        }
    ]

    return pfz_polygon