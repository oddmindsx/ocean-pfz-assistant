import React from "react";
import { Thermometer, Droplet, Wind, MapPin } from "lucide-react";

export default function RecommendationPanel({ safety, evidence, context }) {
  const evidenceList = Array.isArray(evidence) ? evidence : [];
  
  const weatherEvidence = evidenceList.find((item) =>
    item.source?.includes("open_meteo") || item.source?.includes("weather")
  );
  
  const pfzEvidence = evidenceList.find((item) =>
    item.source?.includes("pfz") || item.summary?.toLowerCase().includes("pfz")
  );

  const locationName = context?.location?.name || "Target Offshore Area";
  const latDisplay = context?.location?.lat ? `${context.location.lat.toFixed(2)}°N` : "";
  const lonDisplay = context?.location?.lon ? `${context.location.lon.toFixed(2)}°E` : "";

  const columns = [
    {
      icon: Thermometer,
      title: "SST Gradient",
      body: pfzEvidence?.summary || "Thermal boundary gradient encouraging pelagic fish aggregation.",
      tag: "Layer: SST",
      tagClass: "tag-cyan",
    },
    {
      icon: Droplet,
      title: "Chlorophyll Upwelling",
      body: "High-concentration chlorophyll plumes detected in coastal upwelling zones.",
      tag: "Layer: Chlorophyll",
      tagClass: "tag-emerald",
    },
    {
      icon: Wind,
      title: "Marine Conditions",
      body: weatherEvidence?.summary || safety?.reason || "Favorable wave height and wind conditions recorded.",
      tag: weatherEvidence?.is_live ? "Source: Open-Meteo (Live)" : "Source: Imputed Forecast",
      tagClass: weatherEvidence?.is_live ? "tag-emerald" : "tag-amber",
    },
    {
      icon: MapPin,
      title: "Target Location",
      body: `${locationName} ${latDisplay && lonDisplay ? `(${latDisplay},${lonDisplay})` : ""}. Monitored for optimal catch density.`,
      tag: `Area: ${locationName}`,
      tagClass: "tag-cyan",
    },
  ];

  return (
    <div className="recommendation-panel">
      <h4 className="recommendation-heading">Why this recommendation?</h4>
      <p className="recommendation-subheading">Key factors analyzed to generate this advisory.</p>
      <div className="recommendation-grid">
        {columns.map((col) => {
          const Icon = col.icon;
          return (
            <div className="recommendation-col" key={col.title}>
              <div className="recommendation-col-title">
                <Icon size={14} />
                <span>{col.title}</span>
              </div>
              <p>{col.body}</p>
              <span className={`metric-tag ${col.tagClass}`}>{col.tag}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
