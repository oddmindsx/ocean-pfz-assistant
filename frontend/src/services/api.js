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

    // Backend sends evidence as a List[EvidenceItem] (source/summary/value/is_live),
    // not an object — pass it through as-is instead of coercing to {}, which
    // previously caused EvidenceCard to always show its hardcoded placeholders.
    return {
      text: data.text || "Received ocean advisory.",
      safety: data.safety || { status: "SAFE", reason: "Conditions clear." },
      evidence: data.evidence || [],
      layers: formattedLayers,
      isMock: false
    };

  } catch (error) {
    console.warn("Could not reach backend server, falling back to mock response:", error);
    return {
      text: `[Offline Mode] Query: "${prompt}". Server issue or connection dropped.`,
      safety: { status: "SAFE", reason: "Displaying fallback parameters." },
      evidence: [],
      layers: [],
      isMock: true
    };
  }
}

export async function sendChatMessage(message, location = null) {
  const response = await fetch("http://localhost:8000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: message,
      user_id: "default_user",
      location: location // <-- If null, backend falls back; if object, backend uses device GPS
    }),
  });

  return await response.json();
}

export async function fetchLayerGeoJson(url) {
  try {
    const fullUrl = url.startsWith("http") ? url : `http://localhost:8000${url}`;
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch GeoJSON: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching GeoJSON layer:", error);
    return null;
  }
}
