#Getting location 

def get_weather(location: dict, date: str) -> dict:
    #Returns ocean weather condition near specified location and data

    location_name = location.get("Name", "Current location")

    return{
        "Location Name": location_name,
        "Wind_speed": 14.2, #knots
        "Wind_direction": "SW",
        "wave_height": 1.8, #m
        "SST celsius": 27.9,
        "Visibility": 10.0, #Km
        "Date": date
    }

def get_wave(location: dict, date: str) -> float:
    #Returns wave height in meters for safety check
    return 1.8