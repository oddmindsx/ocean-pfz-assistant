import React from "react";
import { Wind, Waves, ArrowUpDown, Ship, Zap } from "lucide-react";

// Placeholder alerts for the Kochi/Kerala coast. Swap `alerts` for a real
// feed (INCOIS/IMD/NDMA or your own backend endpoint) once it's ready —
// shape: { id, severity, icon, title, meta, body }
// severity: 'safe' | 'caution' | 'danger'  (reuses the same three states as SafetyBadge)
// icon: 'cyclone' | 'tsunami' | 'tide' | 'incident' | 'lightning'
const defaultAlerts = [
  {
    id: "mw1",
    severity: "danger",
    icon: "cyclone",
    title: "Cyclone Watch",
    meta: "2h ago",
    body: "Depression forming ~180 km offshore, expected to intensify. Advisory pending from IMD.",
  },
  {
    id: "mw2",
    severity: "safe",
    icon: "tsunami",
    title: "Tsunami Bulletin",
    meta: "—",
    body: "No active tsunami warning for the Kerala coastline at this time.",
  },
  {
    id: "mw3",
    severity: "caution",
    icon: "tide",
    title: "High Tide",
    meta: "4:40 PM",
    body: "1.8 m expected off Kochi. Low tide follows at 10:55 PM (0.4 m).",
  },
  {
    id: "mw4",
    severity: "caution",
    icon: "incident",
    title: "Vessel Incident",
    meta: "6h ago",
    body: "Minor grounding reported near Kochi harbour mouth. Channel now clear.",
  },
  {
    id: "mw5",
    severity: "safe",
    icon: "lightning",
    title: "Lightning Risk",
    meta: "Low",
    body: "No thunderstorm cells detected within 50 km of Kochi.",
  },
];

const iconMap = { cyclone: Wind, tsunami: Waves, tide: ArrowUpDown, incident: Ship, lightning: Zap };
const iconColorVar = {
  danger: "var(--accent-danger)",
  caution: "var(--accent-amber)",
  safe: "var(--accent-emerald)",
};

function MarineWatchItem({ alert }) {
  const Icon = iconMap[alert.icon] ?? Wind;
  return (
    <div className={`marine-watch-item status-${alert.severity}`}>
      <div className="marine-watch-item-icon">
        <Icon size={14} color={iconColorVar[alert.severity]} />
      </div>
      <div className="marine-watch-item-body">
        <div className="marine-watch-item-title">
          <span>{alert.title}</span>
          <span className="marine-watch-item-meta">{alert.meta}</span>
        </div>
        <p>{alert.body}</p>
      </div>
    </div>
  );
}

/**
 * Drop this into panel-side-cards, right after <EvidenceCard />:
 *
 *   <div className="panel-side-cards">
 *     <SafetyBadge safety={safety} />
 *     <EvidenceCard evidence={evidence} />
 *     <MarineWatchPanel />
 *   </div>
 *
 * Pass live data later with: <MarineWatchPanel alerts={liveAlerts} />
 */
export default function MarineWatchPanel({ alerts = defaultAlerts }) {
  return (
    <div className="marine-watch-card">
      <div className="marine-watch-header">
        <Waves size={16} className="text-cyan" />
        <h4>Marine Watch</h4>
        <span className="marine-watch-subtitle">Kerala coast · updates every 15 min</span>
      </div>

      <div className="marine-watch-list">
        {alerts.map((a) => <MarineWatchItem alert={a} key={a.id} />)}
      </div>
    </div>
  );
}
