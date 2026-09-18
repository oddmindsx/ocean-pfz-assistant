import React from "react";
import MapPanel from "./MapPanel";
import MetricsStrip from "./MetricsStrip";
import RecommendationPanel from "./RecommendationPanel";

export default function MapPage({ targetLayer, safety, evidence }) {
  return (
    <div className="map-page">
      <div className="map-page-canvas">
        <MapPanel targetLayer={targetLayer} />
      </div>
      <MetricsStrip safety={safety} evidence={evidence} />
      <RecommendationPanel safety={safety} evidence={evidence} />
    </div>
  );
}
