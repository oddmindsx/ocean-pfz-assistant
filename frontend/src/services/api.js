// This is the address of our backend server
const API_BASE_URL = "http://localhost:8000"; 

export async function sendMessage(prompt, context) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: prompt,
        location: context?.location || { name: "Kochi", lat: 9.9312, lon: 76.2673 },
        date: context?.date || "2026-09-20",
      }),
    });

    if (!response.ok) {
      throw new Error(`Server status error: ${response.status}`);
    }

    const data = await response.json();

    // Transform layers if returned in Pydantic schema format
    const formattedLayers = (data.layers || []).map((layer, index) => {
      if (layer.data && layer.data.url) {
        return layer.data;
      }
      return {
        id: layer.layer_type?.toLowerCase() || `layer-${index}`,
        name: layer.layer_type || "Ocean Data Layer",
        url: `/layers/${(layer.layer_type || "pfz").toLowerCase()}/${context?.date || "2026-09-20"}.geojson`,
        color: layer.layer_type === "SAFETY_CHECK" ? "#ff1744" : "#00e676"
      };
    });

    return {
      text: data.text || "Received ocean advisory.",
      safety: data.safety || { status: "SAFE", advice: "Conditions clear." },
      evidence: data.evidence || {},
      layers: formattedLayers,
      isMock: false
    };

  } catch (error) {
    console.warn("Could not reach backend server, falling back to mock response:", error);
    return {
      text: `[Offline Mode] Query: "${prompt}". Server issue or connection dropped.`,
      safety: { status: "SAFE", advice: "Displaying fallback parameters." },
      evidence: {},
      layers: [],
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
