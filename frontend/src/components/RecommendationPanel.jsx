import React from "react";
import { Thermometer, Droplet, Wind, MapPin } from "lucide-react";

export default function RecommendationPanel({ safety, evidence }) {
  const columns = [
    {
      icon: Thermometer,
      title: "SST Gradient",
      body: evidence?.reasoning || "Strong thermal front promoting fish aggregation.",
      tag: "Layer: SST",
      tagClass: "tag-cyan"
    },
    {
      icon: Droplet,
      title: "Chlorophyll Upwelling",
      body: `Elevated chlorophyll (${evidence?.chlorophyll || "0.6–1.0 mg/m³"}) indicates productive waters.`,
      tag: "Layer: Chlorophyll",
      tagClass: "tag-emerald"
    },
    {
      icon: Wind,
      title: "Weather",
      body: safety?.advice || "Stable winds and pressure — a good window to head out.",
      tag: "Source: IMD",
      tagClass: "tag-amber"
    },
    {
      icon: MapPin,
      title: "Location",
      body: "18 km SW of Kochi, 9.80°N, 75.85°E. Depth ~85 m. Suitable for target species.",
      tag: "Area: Kerala Coast",
      tagClass: "tag-cyan"
    }
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
