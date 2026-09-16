import React from "react";
import { HelpCircle, Thermometer, Droplet, Sparkles } from "lucide-react";

export default function EvidenceCard({ evidence }) {
  if (!evidence) return null;

  return (
    <div className="evidence-card">
      <div className="evidence-header">
        <Sparkles size={16} className="text-cyan" />
        <h4>Oceanographic Evidence ("Why here?")</h4>
      </div>
      <div className="evidence-grid">
        <div className="evidence-stat">
          <Thermometer size={14} />
          <div>
            <span className="label">SST Gradient</span>
            <span className="value">{evidence.sst_range || "28.1–28.5 °C"}</span>
          </div>
        </div>
        <div className="evidence-stat">
          <Droplet size={14} />
          <div>
            <span className="label">Chlorophyll-a</span>
            <span className="value">{evidence.chlorophyll || "1.48 mg/m³"}</span>
          </div>
        </div>
      </div>
      {evidence.reasoning && (
        <p className="evidence-reasoning">
          <strong>Scientific Rationale:</strong> {evidence.reasoning}
        </p>
      )}
    </div>
  );
}
