import React from "react";
import { Wind, Waves, ArrowUpDown, Ship, Zap } from "lucide-react";
import { defaultAlerts } from "./MarineWatchPanel";

const iconMap = { cyclone: Wind, tsunami: Waves, tide: ArrowUpDown, incident: Ship, lightning: Zap };

export default function AdvisoriesPage({ alerts = defaultAlerts }) {
  return (
    <div className="advisories-page">
      <div className="advisories-header">
        <h2>Marine Advisories</h2>
        <p>Everything worth knowing about conditions along the Kerala coast, updated every 15 minutes.</p>
      </div>
      <div className="advisories-grid">
        {alerts.map((alert) => {
          const Icon = iconMap[alert.icon] ?? Wind;
          return (
            <div className={`advisory-card status-${alert.severity}`} key={alert.id}>
              <div className="advisory-card-icon">
                <Icon size={18} />
              </div>
              <div className="advisory-card-body">
                <div className="advisory-card-title">
                  <span>{alert.title}</span>
                  <span className="advisory-card-meta">{alert.meta}</span>
                </div>
                <p>{alert.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
