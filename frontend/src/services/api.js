/**
 * api.js - Frontend API Client
 * 
 * Yeh file backend se communicate karti hai.
 * 1. sendMessage: User ka query aur location backend ke /chat endpoint pe bhejti hai.
 * 2. fetchLayerGeoJson: Map ke liye GeoJSON layers (PFZ, SST, etc.) fetch karti hai.
 * 3. Smart Fallback: Agar backend band ho, toh crash hone ke bajaye realistic mock data dikhaati hai.
 */

import { generateMockChatResponse } from "./mockData";

// Backend server ka URL (FastAPI port 8000 pe chalega)
const BACKEND_URL = "http://localhost:8000";

/**
 * Sends chat message to backend POST /chat
 * @param {string} message - User ka query (e.g. "Where are the fish near Kochi?")
 * @param {object} context - Location aur date details
 */
export async function sendMessage(message, context = {}) {
  // Default values agar user ne kuch specific select na kiya ho
  const defaultContext = {
    location: {
      name: "Kochi",
      lat: 9.9312,
      lon: 76.2673
    },
    date: new Date().toISOString().split("T")[0],
    ...context
  };

  // Request payload strictly matches M1 & M2 schema
  const payload = {
    message,
    context: defaultContext
  };

  try {
    // 3.5 second timeout to quickly detect if backend server is offline
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    // Call real backend: POST http://localhost:8000/chat
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    return {
      ...normalizeResponse(data, defaultContext),
      isMock: false
    };
  } catch (err) {
    // Agar backend offline hai ya error de raha hai, fallback to realistic mock
    console.warn("Backend offline ya unreachable hai. Fallback mock use ho raha hai:", err.message);
    
    // Thoda realistic delay (450ms) taaki typing feel natural lage
    await new Promise(res => setTimeout(res, 450));
    const mockData = generateMockChatResponse(message, defaultContext);
    return {
      ...mockData,
      isMock: true,
      mockReason: `Backend not reached (${err.message}). Using local contract mock.`
    };
  }
}

/**
 * Map layers ko fetch karne ka function
 * GET /layers/{layer_id}/{date}.geojson
 */
export async function fetchLayerGeoJson(layerId, date = "2026-09-11") {
  // Pehle real backend se fetch karne ki koshish karo
  try {
    const res = await fetch(`${BACKEND_URL}/layers/${layerId}/${date}.geojson`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Backend band hai, local public folder se load karenge
  }

  // Local static files in public/data folder
  const localUrls = [
    `/data/${layerId}_kochi_${date}.geojson`,
    `/data/${layerId}_kochi_2026-09-11.geojson`,
    `/data/kerala_${layerId}.geojson`
  ];

  for (const url of localUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Agle path ko try karo
    }
  }

  throw new Error(`Layer GeoJSON nahi mila: ${layerId}`);
}

/**
 * Helper function: Layers array ko uniform format me convert karta hai
 */
function normalizeResponse(data, context) {
  const date = context.date || "2026-09-11";
  let layers = data.layers || [];

  // Agar backend ne sirf strings bheji ho ["pfz", "sst"]
  layers = layers.map(layer => {
    if (typeof layer === "string") {
      return {
        id: layer,
        name: layer.toUpperCase(),
        url: `${BACKEND_URL}/layers/${layer}/${date}.geojson`,
        fallbackUrl: `/data/${layer}_kochi_${date}.geojson`,
        color: layer === "pfz" ? "#00e676" : layer === "sst" ? "#ff7043" : "#26a69a"
      };
    }
    return {
      color: layer.id === "pfz" ? "#00e676" : layer.id === "sst" ? "#ff7043" : "#26a69a",
      fallbackUrl: `/data/${layer.id}_kochi_${date}.geojson`,
      ...layer
    };
  });

  return {
    ...data,
    layers
  };
}
