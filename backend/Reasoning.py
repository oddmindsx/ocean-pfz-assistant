def evaluate(location: dict, evidence: dict) -> dict:
    #Evaluates ocean and weather conditions to produce final recommedation 

    location_name = location.get("Name", "Your location")
    weather = evidence.get("Weather", {})
    pfz_zones = evidence.get("pfz_zones", [])

    wave = weather.get("Wave_height", 1.8)
    wind = weather.get("Wind_speed", 14.2)
    fish_present = len(pfz_zones) > 0

    if wave > 2.5 or wind > 20.0:
        status = "Unsafe !!!!!"
        text = (
            f"⚠️ Caution: Heavy sea conditions detected near {location_name}. "
            f"Wave heights are around {wave}m with winds at {wind} knots. "
            f"It is not recommended to go fishing today."
        )

    elif fish_present:
        status = "Safe !"
        species_list = ", ".join(pfz_zones[0].get("target_species", ["local fish"]))
        text = (
            f"Great conditions for fishing near {location_name}! "
            f"Weather is calm with waves at {wave}m. High density of {species_list} "
            f"detected in nearby hotspots."
        )

    else:
        status = "Safe !"
        text = (
            f"Weather near {location_name} is safe (waves at {wave}m), "
            f"but satellite data shows low fish activity in this zone today."
        )  

    return {
        "text": text,
        "dummy_safety": {
            "status": status,
            "max_wave_m": wave
        }
    }  