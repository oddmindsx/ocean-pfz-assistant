// Mock data generator for Kerala coast / Kochi PFZ advisor
export function generateMockChatResponse(message, context) {
  const locName = context?.location?.name || "Kochi";
  const date = context?.date || "2026-09-11";
  const msgLower = (message || "").toLowerCase();

  const isSafety = msgLower.includes("safe") || msgLower.includes("weather") || msgLower.includes("wave") || msgLower.includes("wind");
  const isSst = msgLower.includes("sst") || msgLower.includes("temperature") || msgLower.includes("thermal");
  const isChloro = msgLower.includes("chlorophyll") || msgLower.includes("plume") || msgLower.includes("algae");

  if (isSafety) {
    return {
      text: `🌊 **Sea Safety Advisory for ${locName} (${date})**:\n\nConditions are currently **SAFE** for motorized artisanal and commercial fishing crafts up to 40 nautical miles.\n- **Wave Height:** 1.4 m (Significant wave height: 1.2–1.6 m)\n- **Surface Wind:** 11 knots from WSW\n- **Swell Period:** 9.2 seconds\n- **Precipitation:** Light coastal showers, visibility > 8 km.\n\n*Recommendation:* Safe to operate, but maintain standard VHF Channel 16 watch.`,
      language: "en",
      safety: {
        status: "SAFE",
        wave_height_m: 1.4,
        wind_speed_knots: 11.0,
        advice: "Conditions favorable for normal fishing operations off Kochi coast."
      },
      evidence: {
        sst_range: "28.1 - 28.5°C",
        chlorophyll: "1.48 mg/m³",
        thermal_fronts: true,
        reasoning: "Moderate oceanic swell with light wind shear allows stable vessel navigation."
      },
      layers: [
        {
          id: "pfz",
          name: "Active PFZ Zones",
          url: `/data/pfz_kochi_${date}.geojson`,
          fallbackUrl: `/data/pfz_kochi_2026-09-11.geojson`,
          type: "geojson",
          color: "#00e676"
        }
      ]
    };
  }

  if (isSst) {
    return {
      text: `🌡️ **Sea Surface Temperature (SST) Thermal Analysis for ${locName}**:\n\nA pronounced thermal boundary gradient exists 15–28 km off the Kochi coast. Temperatures range between **28.1°C** in the offshore upwelling tongue to **29.2°C** in coastal waters. The thermal gradient intersects the coastal shelf break, which drives primary nutrient concentration.`,
      language: "en",
      safety: {
        status: "SAFE",
        wave_height_m: 1.5,
        wind_speed_knots: 12.0,
        advice: "Optimal operating conditions."
      },
      evidence: {
        sst_range: "28.1 - 29.2°C",
        chlorophyll: "1.52 mg/m³",
        thermal_fronts: true,
        reasoning: "Thermal front boundary at shelf break acts as a biological aggregation zone."
      },
      layers: [
        {
          id: "sst",
          name: "SST Thermal Contours",
          url: `/data/sst_kochi_${date}.geojson`,
          fallbackUrl: `/data/sst_kochi_2026-09-11.geojson`,
          type: "geojson",
          color: "#ff7043"
        },
        {
          id: "pfz",
          name: "PFZ Detections",
          url: `/data/pfz_kochi_${date}.geojson`,
          fallbackUrl: `/data/pfz_kochi_2026-09-11.geojson`,
          type: "geojson",
          color: "#00e676"
        }
      ]
    };
  }

  // Default PFZ query
  return {
    text: `🐟 **Potential Fishing Zone (PFZ) Advisory for ${locName} (${date})**:\n\nHigh pelagic fish aggregation is identified **18.5 km WSW** of Kochi harbor (Bearing: 248°).\n\n- **Target Species:** Indian Mackerel (*Rastrelliger kanagurta*), Oil Sardine, and Carangids.\n- **Depth:** 38–52 meters.\n- **Oceanographic Driver:** Overlapping SST thermal front (28.3°C) and elevated Chlorophyll-a plume (1.48 mg/m³).\n- **Secondary Zone:** Chellanam-Alappuzha shelf edge (24 km SW) indicates active Skipjack Tuna and Ribbon Fish.\n\nThe PFZ layer has been loaded onto your map for navigation.`,
    language: "en",
    safety: {
      status: "SAFE",
      wave_height_m: 1.4,
      wind_speed_knots: 10.5,
      advice: "Good sea state for fishing. Favorable winds and low swell."
    },
    evidence: {
      sst_range: "28.1 - 28.5°C",
      chlorophyll: "1.48 - 1.72 mg/m³",
      thermal_fronts: true,
      reasoning: "Coincident thermal boundary and chlorophyll-a upwelling indicates maximum fish congregation probability."
    },
    layers: [
      {
        id: "pfz",
        name: "Potential Fishing Zones (PFZ)",
        url: `/data/pfz_kochi_${date}.geojson`,
        fallbackUrl: `/data/pfz_kochi_2026-09-11.geojson`,
        type: "geojson",
        color: "#00e676"
      },
      {
        id: "sst",
        name: "SST Thermal Fronts",
        url: `/data/sst_kochi_${date}.geojson`,
        fallbackUrl: `/data/sst_kochi_2026-09-11.geojson`,
        type: "geojson",
        color: "#ff7043"
      },
      {
        id: "chlorophyll",
        name: "Chlorophyll-a Plume",
        url: `/data/chlorophyll_kochi_${date}.geojson`,
        fallbackUrl: `/data/chlorophyll_kochi_2026-09-11.geojson`,
        type: "geojson",
        color: "#26a69a"
      }
    ]
  };
}
