// This is the address of our backend server
const API_BASE_URL = "http://localhost:8000/api"; 

/**
 * Sends the user's message, current location, and date to the backend
 */
export async function sendMessage(prompt, context) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: prompt,
        location: context?.location || { lat: 9.9312, lon: 76.2673, name: "Kochi" },
        date: context?.date || new Date().toISOString().split("T")[0],
      }),
    });

    // If the server sent back an error, throw it
    if (!response.ok) {
      throw new Error(`Server status error: ${response.status}`);
    }

    // Return the real data from the backend
    const data = await response.json();
    return data;

  } catch (error) {
    console.warn("Could not reach backend server, falling back to mock response:", error);
    
    // Safety Fallback: If your backend python server isn't turned on yet, 
    // it will return this so your website doesn't crash!
    return {
      text: `[Offline Mode] Received your query: "${prompt}". Please start your backend server at port 5000 for live data!`,
      safety: {
        status: "SAFE",
        wave_height_m: 1.2,
        wind_speed_knots: 10.0,
        advice: "Backend server offline. Displaying default sea conditions."
      },
      evidence: {
        sst_range: "28.0 - 28.5 °C",
        chlorophyll: "1.50 mg/m³",
        reasoning: "Offline fallback mode active."
      },
      isMock: true
    };
  }
}

export async function fetchLayerGeoJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load layer data: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Could not fetch layer GeoJSON, returning empty collection:", error);
    return {
      type: "FeatureCollection",
      features: []
    };
  }
}
