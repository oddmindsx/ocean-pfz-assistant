import React from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Wind, Waves } from "lucide-react";

export default function SafetyBadge({ safety }) {
  if (!safety) return null;

  const isSafe = safety.status === "SAFE";
  const isCaution = safety.status === "CAUTION";

  return (
    <div className={`safety-badge-card ${isSafe ? "status-safe" : isCaution ? "status-caution" : "status-danger"}`}>
      <div className="safety-header">
        <div className="safety-title-wrap">
          {isSafe ? (
            <ShieldCheck className="safety-icon safe-icon" size={20} />
          ) : (
            <ShieldAlert className="safety-icon danger-icon" size={20} />
          )}
          <div>
            <span className="safety-tag">SEA SAFETY STATUS</span>
            <h4 className="safety-status-text">{safety.status || "SAFE"}</h4>
          </div>
        </div>
        <div className="safety-metrics">
          <div className="metric-item" title="Significant Wave Height">
            <Waves size={16} />
            <span>{safety.wave_height_m || 1.4} m</span>
          </div>
          <div className="metric-item" title="Wind Speed">
            <Wind size={16} />
            <span>{safety.wind_speed_knots || 11} kts</span>
          </div>
        </div>
      </div>
      {safety.advice && <p className="safety-advice">{safety.advice}</p>}
    </div>
  );
}
