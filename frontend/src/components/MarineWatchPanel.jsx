import React from "react";
import { Wind, Waves, ArrowUpDown, Ship, Zap } from "lucide-react";

// Placeholder alerts for the Kochi/Kerala coast. Swap `alerts` for a real
// feed (INCOIS/IMD/NDMA or your own backend endpoint) once it's ready —
// shape: { id, severity, icon, title, meta, body }
// severity: 'safe' | 'caution' | 'danger'  (reuses the same three states as SafetyBadge)
// icon: 'cyclone' | 'tsunami' | 'tide' | 'incident' | 'lightning'
export const defaultAlerts = [
  {
    id: "mw1",
    severity: "danger",
    icon: "cyclone",
    title: "Cyclone Watch",
    meta: "2h ago",
    body: "A depression is forming about 180 km offshore and looks like it's strengthening. IMD hasn't issued a formal advisory yet, but worth keeping an eye on.",
  },
  {
    id: "mw2",
    severity: "safe",
    icon: "tsunami",
    title: "Tsunami Bulletin",
    meta: "—",
    body: "Nothing to worry about here — no active tsunami warning anywhere along the Kerala coast right now.",
  },
  {
    id: "mw3",
    severity: "caution",
    icon: "tide",
    title: "High Tide",
    meta: "4:40 PM",
    body: "Expect around 1.8 m off Kochi this afternoon, easing to a 0.4 m low tide by 10:55 PM.",
  },
  {
    id: "mw4",
    severity: "caution",
    icon: "incident",
    title: "Vessel Incident",
    meta: "6h ago",
    body: "A small boat briefly ran aground near the Kochi harbour mouth earlier — it's since been cleared and the channel is open again.",
  },
  {
    id: "mw5",
    severity: "safe",
    icon: "lightning",
    title: "Lightning Risk",
    meta: "Low",
    body: "Skies look calm — no thunderstorm cells detected within 50 km of Kochi.",
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
