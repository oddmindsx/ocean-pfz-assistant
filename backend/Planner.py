from datetime import datetime

def query(intent: str, context: dict) -> dict:

    #Fetching the user's location data
    #Asking for location access permission
    location_data = context.get("location", {})

    #If access not granted, set to a default location of Kochi
    lat = location_data.get("lat", 9.9312)
    lon = location_data.get("lon", 76.2673)
    loc_name = location_data.get("name", "unknown coast")

    #Re-packing location objects for all the agents to receive identical structures
    location = {
        "name" : loc_name,
        "longitude": lon,
        "latitude": lat
    }

    #Fetching date and time
    today_str = datetime.now().strftime("%d-%m-%Y")
    date = context.get("Date", today_str)
    now_str = datetime.now().strftime("%H:%M:%S")

    #Inintialize our tasks
    tasks = []

    #Check the user's query
    if intent == "PFZ_QUERY":

        #If about fishing zone    
        #Asking our ocean agent for fish coordinates near this location
        tasks.append
        (
            {
                "agent": "Ocean",
                "function": "get_pfz",
                "args": {"Location": location, "data": date}
            }
        )

        #If about weather
        #Asking our weather agent if the ocean conditions are okay
        tasks.append
        (
            {
                "agent": "Weather",
                "function": "get_weather",
                "args": {"Location": location, "date": date}
            }
        )

    #If query about safety check
    elif intent == "SAFETY_CHECK":
        tasks.append
        (
            {
                "agent": "weather",
                "function": "get_weather",
                "args": {"Location": location, "date": date}
            }
        )

    else:
        tasks.append
        (
            {
                "agent": "weather",
                "function": "get_weather",
                "args": {"Location": location, "date": date}
            }
        )

    return
    {
        "intent": intent,
        "tasks": tasks,
        "location": location,
        "Date": date
    }