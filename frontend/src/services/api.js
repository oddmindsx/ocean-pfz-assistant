// Address of backend server (can also read from Vite env variables)
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:8000";

// Helper to get today's ISO date string (YYYY-MM-DD)
const getTodayIsoDate = () => new Date().toISOString().split("T")[0];

/**
 * Sends chat prompt and context to the FastAPI /chat endpoint.
 */
export async function sendMessage(prompt, context) {
  const currentDate = context?.date || getTodayIsoDate();

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: prompt,
        location: context?.location || { name: "Kochi", lat: 9.9312, lon: 76.2673 },
        date: currentDate,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server status error: ${response.status}`);
    }

    const data = await response.json();

    // Format and sanitize layers returned by backend schema
    const formattedLayers = (data.layers || []).map((layer, index) => {
      // If layer is already in frontend MapLayer shape (has id and url)
      if (layer.id && layer.url) {
        return layer;
      }
      // Handle nested Pydantic data payloads or raw layer_type models
      if (layer.data && layer.data.url) {
        return layer.data;
      }
      const layerId = (layer.layer_type || `layer-${index}`).toLowerCase();
      return {
        id: layerId,
        name: layer.name || layer.layer_type || "Ocean Data Layer",
        url: layer.url || `/layers/${layerId}/${currentDate}.geojson`,
        color: layer.color || (layerId === "safety_check" ? "#ff1744" : "#00e676"),
        is_live: layer.is_live ?? false,
      };
    });

    return {
      text: data.text || "Received ocean advisory.",
      safety: data.safety || { status: "SAFE", reason: "Conditions clear." },
      evidence: data.evidence || [],
      layers: formattedLayers,
      context: data.context || null,
      isMock: false,
    };
  } catch (error) {
    console.warn("Could not reach backend server, falling back to mock response:", error);
    return {
      text: `[Offline Mode] Query: "${prompt}". Backend unreachable.`,
      safety: { status: "SAFE", reason: "Displaying fallback parameters." },
      evidence: [],
      layers: [],
      context: null,
      isMock: true,
    };
  }
}

/**
 * Direct chat invocation for quick messages or GPS position updates.
 */
export async function sendChatMessage(message, location = null) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        user_id: "default_user",
        location: location, // Passed GPS object or null
      }),
    });

    if (!response.ok) {
      throw new Error(`Server status error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in sendChatMessage:", error);
    return null;
  }
}

/**
 * Fetches GeoJSON data for map overlays.
 */
export async function fetchLayerGeoJson(urlOrId) {
  try {
    const isUrl = urlOrId.includes("/") || urlOrId.endsWith(".geojson");
    const targetPath = isUrl ? urlOrId : `/layers/${urlOrId}/${getTodayIsoDate()}.geojson`;
    const fullUrl = targetPath.startsWith("http") ? targetPath : `${API_BASE_URL}${targetPath}`;

    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch GeoJSON: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching GeoJSON layer (${urlOrId}):`, error);
    return null;
  }
}
