import React from "react";
import { Thermometer, Waves, Droplet, Wind } from "lucide-react";

// Pulls the first numeric value out of a range string like "28.1 - 28.5°C"
function firstNumber(str, fallback) {
  if (!str) return fallback;
  const match = String(str).match(/[\d.]+/);
  return match ? match[0] : fallback;
}

export default function MetricsStrip({ safety, evidence }) {
  const sstValue = firstNumber(evidence?.sst_range, "28.4");
  const chloroValue = firstNumber(evidence?.chlorophyll, "0.72");
  const waveValue = safety?.wave_height_m ?? 1.8;
  const windValue = safety?.wind_speed_knots ? Math.round(safety.wind_speed_knots * 1.852) : 14;

  const metrics = [
    {
      icon: Thermometer,
      label: "Sea Surface Temp",
      value: `${sstValue} °C`,
      tag: Number(sstValue) > 28.5 ? "Warm" : "Moderate",
      tagClass: "tag-amber"
    },
    {
      icon: Waves,
      label: "Wave Height",
      value: `${waveValue} m`,
      tag: waveValue > 2 ? "Caution" : "Moderate",
      tagClass: waveValue > 2 ? "tag-danger" : "tag-amber"
    },
    {
      icon: Droplet,
      label: "Chlorophyll",
      value: `${chloroValue} mg/m³`,
      tag: "Good",
      tagClass: "tag-emerald"
    },
    {
      icon: Wind,
      label: "Wind",
      value: `${windValue} km/h NE`,
      tag: "Light",
      tagClass: "tag-cyan"
    }
  ];

  return (
    <div className="metrics-strip">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div className="metric-card" key={m.label}>
            <div className="metric-icon">
              <Icon size={18} />
            </div>
            <div>
              <span className="metric-label">{m.label}</span>
              <span className="metric-value">{m.value}</span>
              <span className={`metric-tag ${m.tagClass}`}>{m.tag}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
