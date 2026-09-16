import React from "react";
import { Layers, Eye, EyeOff, Plus, Trash2, Maximize2 } from "lucide-react";

export default function LayerControls({
  activeLayers,
  onToggleLayer,
  onRemoveLayer,
  onAddLayer,
  availableLayers,
  onFitBounds
}) {
  return (
    <div className="layer-controls-panel">
      <div className="layer-controls-header">
        <div className="title-with-icon">
          <Layers size={16} />
          <span>Active Map Layers ({activeLayers.length})</span>
        </div>
        {onFitBounds && (
          <button
            onClick={onFitBounds}
            className="fit-bounds-btn"
            title="Fit map to active layer bounds"
          >
            <Maximize2 size={13} />
            <span>Focus</span>
          </button>
        )}
      </div>

      <div className="layer-items-list">
        {activeLayers.length === 0 ? (
          <div className="empty-layers">No active layers. Ask a query or add below.</div>
        ) : (
          activeLayers.map((layer) => (
            <div key={layer.id} className="layer-item-row">
              <div className="layer-item-info">
                <span
                  className="layer-color-dot"
                  style={{ backgroundColor: layer.color || "#00e676" }}
                />
                <span className="layer-item-name">{layer.name || layer.id.toUpperCase()}</span>
              </div>
              <div className="layer-item-actions">
                <button
                  type="button"
                  onClick={() => onToggleLayer(layer.id)}
                  className="layer-action-btn"
                  title={layer.visible ? "Hide layer" : "Show layer"}
                >
                  {layer.visible ? <Eye size={15} /> : <EyeOff size={15} className="text-muted" />}
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveLayer(layer.id)}
                  className="layer-action-btn danger-hover"
                  title="Remove layer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {availableLayers && availableLayers.length > 0 && (
        <div className="available-layers-dropdown">
          <span className="add-layer-label">Add Available Layer:</span>
          <div className="available-chips">
            {availableLayers.map((avail) => (
              <button
                key={avail.id}
                type="button"
                onClick={() => onAddLayer(avail)}
                className="add-chip-btn"
              >
                <Plus size={12} />
                <span>{avail.name || avail.id.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
