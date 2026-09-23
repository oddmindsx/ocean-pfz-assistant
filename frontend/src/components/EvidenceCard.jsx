import React from "react";
import { Sparkles, Radio, Database } from "lucide-react";

export default function EvidenceCard({ evidence }) {
  const items = Array.isArray(evidence) ? evidence : [];
  if (items.length === 0) return null;

  return (
    <div className="evidence-card">
      <div className="evidence-header">
        <Sparkles size={16} className="text-cyan" />
        <h4>Oceanographic Evidence ("Why here?")</h4>
      </div>
      <div className="evidence-list">
        {items.map((item, idx) => (
          <div className="evidence-item" key={`${item.source || "evidence"}-${idx}`}>
            <div className="evidence-item-header">
              {item.is_live ? (
                <span className="evidence-badge evidence-badge-live" title="Live data">
                  <Radio size={12} /> Live
                </span>
              ) : (
                <span className="evidence-badge evidence-badge-static" title="Static / stub data">
                  <Database size={12} /> Static
                </span>
              )}
              <span className="evidence-source">{item.source}</span>
            </div>
            <p className="evidence-summary">{item.summary}</p>
            {item.value !== null && item.value !== undefined && (
              <span className="evidence-value">{item.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
