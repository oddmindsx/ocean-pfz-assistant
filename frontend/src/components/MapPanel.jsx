import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import LayerControls from "./LayerControls";
import { fetchLayerGeoJson } from "../services/api";
import { Compass, Navigation } from "lucide-react";

// Fix standard Leaflet default icon issues in bundled environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const KOCHI_COORDS = [9.9312, 76.2673];

export default function MapPanel({ targetLayer }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerObjectsRef = useRef({}); // map: layerId -> L.GeoJSON
  
  const [activeLayers, setActiveLayers] = useState([]);
  const [selectedZoneInfo, setSelectedZoneInfo] = useState(null);

  // 1. Initialize Map on Mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: KOCHI_COORDS,
      zoom: 9,
      minZoom: 6,
      maxZoom: 16,
      zoomControl: false
    });

    // Clean, modern CartoDB Voyager tiles
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> | Data: INCOIS / OCM-3',
        subdomains: "abcd",
        maxZoom: 19
      }
    ).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    // Harbor Pin for Kochi
    const harborIcon = L.divIcon({
      className: "custom-harbor-marker",
      html: `<div class="harbor-marker-pin">⚓</div><div class="harbor-marker-label">Kochi Port</div>`,
      iconSize: [60, 40],
      iconAnchor: [30, 20]
    });

    const marker = L.marker(KOCHI_COORDS, { icon: harborIcon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif;">
        <h4 style="margin:0 0 4px 0; color:#0f172a; font-size:14px;">⚓ Kochi Harbor Base</h4>
        <p style="margin:0; font-size:12px; color:#475569;">Central Command / Fishery Landing Center</p>
        <div style="margin-top:6px; font-size:11px; color:#0284c7; font-weight:600;">Lat: 9.9312°N, Lon: 76.2673°E</div>
      </div>
    `);

    // Load Kerala Coastline base layer
    fetch("/data/kerala_coastline.geojson")
      .then((res) => res.json())
      .then((coastData) => {
        const coastlineLayer = L.geoJSON(coastData, {
          style: {
            color: "#0284c7",
            weight: 3,
            opacity: 0.85,
            dashArray: "4, 4"
          }
        }).addTo(map);
        coastlineLayer.bindTooltip("Kerala Coastline Margin", { sticky: true });
      })
      .catch((err) => console.warn("Coastline load notice:", err));

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. React to Incoming targetLayer from Chat Response (M4 Requirement)
  useEffect(() => {
    if (!targetLayer || !mapInstanceRef.current) return;
    loadOrUpdateLayer(targetLayer);
  }, [targetLayer]);

  const loadOrUpdateLayer = async (layerMeta) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const layerId = layerMeta.id;

    // If layer already exists in Leaflet, ensure it's visible and fit bounds
    if (layerObjectsRef.current[layerId]) {
      const existing = layerObjectsRef.current[layerId];
      if (!map.hasLayer(existing)) {
        existing.addTo(map);
      }
      try {
        const bounds = existing.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
      } catch (e) {}
      setActiveLayers((prev) =>
        prev.map((l) => (l.id === layerId ? { ...l, visible: true } : l))
      );
      return;
    }

    try {
      const geoJsonData = await fetchLayerGeoJson(layerId);

      const leafletGeoLayer = L.geoJSON(geoJsonData, {
        style: (feature) => getLayerStyle(layerId, feature),
        onEachFeature: (feature, layer) => {
          layer.on({
            mouseover: (e) => {
              const l = e.target;
              l.setStyle({ weight: 3, fillOpacity: 0.65 });
            },
            mouseout: (e) => {
              leafletGeoLayer.resetStyle(e.target);
            },
            click: (e) => {
              setSelectedZoneInfo(feature.properties);
              L.DomEvent.stopPropagation(e);
            }
          });

          // Bind rich popup
          const props = feature.properties || {};
          const popupHtml = `
            <div class="pfz-popup-container">
              <div class="popup-badge" style="background:${layerMeta.color || "#00e676"};">
                ${layerId.toUpperCase()} FEATURE
              </div>
              <h4 class="popup-title">${props.zone_name || props.name || props.label || "Ocean Zone"}</h4>
              <div class="popup-specs">
                ${props.distance_km ? `<div><strong>Distance:</strong> ${props.distance_km} km</div>` : ""}
                ${props.direction ? `<div><strong>Bearing:</strong> ${props.direction}</div>` : ""}
                ${props.depth_range ? `<div><strong>Depth:</strong> ${props.depth_range}</div>` : ""}
                ${props.sst_celsius ? `<div><strong>SST:</strong> ${props.sst_celsius} °C</div>` : ""}
                ${props.chlorophyll_mg_m3 ? `<div><strong>Chl-a:</strong> ${props.chlorophyll_mg_m3} mg/m³</div>` : ""}
                ${props.fish_types ? `<div><strong>Target Species:</strong> ${props.fish_types.join(", ")}</div>` : ""}
                ${props.confidence ? `<div><strong>Confidence:</strong> ${props.confidence}</div>` : ""}
              </div>
            </div>
          `;
          layer.bindPopup(popupHtml, { maxWidth: 280 });
        }
      }).addTo(map);

      // Store reference
      layerObjectsRef.current[layerId] = leafletGeoLayer;

      // Fit map bounds to newly loaded layer
      try {
        const bounds = leafletGeoLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
        }
      } catch (e) {}

      // Update state
      setActiveLayers((prev) => {
        const exists = prev.some((l) => l.id === layerId);
        if (exists) {
          return prev.map((l) => (l.id === layerId ? { ...l, visible: true } : l));
        }
        return [...prev, { ...layerMeta, visible: true }];
      });
    } catch (err) {
      console.error(`Failed loading layer ${layerId}:`, err);
    }
  };

  const getLayerStyle = (layerId, feature) => {
    if (layerId === "pfz") {
      return {
        color: "#00c853",
        weight: 2,
        fillColor: "#00e676",
        fillOpacity: 0.35,
        dashArray: "6, 3"
      };
    }
    if (layerId === "sst") {
      const temp = feature?.properties?.temp_c || 28.5;
      const color = temp > 28.8 ? "#ff5722" : temp > 28.3 ? "#ff9800" : "#03a9f4";
      return {
        color: color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.28
      };
    }
    if (layerId === "chlorophyll") {
      return {
        color: "#00897b",
        weight: 2,
        fillColor: "#26a69a",
        fillOpacity: 0.4
      };
    }
    return {
      color: "#3b82f6",
      weight: 2,
      fillColor: "#60a5fa",
      fillOpacity: 0.3
    };
  };

  // Toggle layer visibility
  const handleToggleLayer = (layerId) => {
    const map = mapInstanceRef.current;
    const geoLayer = layerObjectsRef.current[layerId];
    if (!map || !geoLayer) return;

    if (map.hasLayer(geoLayer)) {
      map.removeLayer(geoLayer);
      setActiveLayers((prev) =>
        prev.map((l) => (l.id === layerId ? { ...l, visible: false } : l))
      );
    } else {
      geoLayer.addTo(map);
      setActiveLayers((prev) =>
        prev.map((l) => (l.id === layerId ? { ...l, visible: true } : l))
      );
    }
  };

  // Remove layer completely
  const handleRemoveLayer = (layerId) => {
    const map = mapInstanceRef.current;
    const geoLayer = layerObjectsRef.current[layerId];
    if (map && geoLayer && map.hasLayer(geoLayer)) {
      map.removeLayer(geoLayer);
    }
    delete layerObjectsRef.current[layerId];
    setActiveLayers((prev) => prev.filter((l) => l.id !== layerId));
  };

  // Add available layer manually
  const handleAddLayer = (layerMeta) => {
    loadOrUpdateLayer(layerMeta);
  };

  // Fit bounds to active layers
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const group = L.featureGroup();
    Object.values(layerObjectsRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) {
        group.addLayer(layer);
      }
    });

    if (group.getLayers().length > 0) {
      map.fitBounds(group.getBounds(), { padding: [40, 40] });
    } else {
      map.setView(KOCHI_COORDS, 9);
    }
  };

  // All catalog layers available to toggle
  const allLayersCatalog = [
    { id: "pfz", name: "Potential Fishing Zones", color: "#00e676" },
    { id: "sst", name: "SST Thermal Contours", color: "#ff7043" },
    { id: "chlorophyll", name: "Chlorophyll-a Plumes", color: "#26a69a" }
  ];

  const availableToAdd = allLayersCatalog.filter(
    (c) => !activeLayers.some((a) => a.id === c.id)
  );

  return (
    <div className="map-panel-wrapper">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="leaflet-map-container" />

      {/* Floating Dynamic Layer Controls */}
      <div className="map-floating-controls">
        <LayerControls
          activeLayers={activeLayers}
          onToggleLayer={handleToggleLayer}
          onRemoveLayer={handleRemoveLayer}
          onAddLayer={handleAddLayer}
          availableLayers={availableToAdd}
          onFitBounds={handleFitBounds}
        />
      </div>

      {/* Selected Feature Card */}
      {selectedZoneInfo && (
        <div className="zone-detail-overlay">
          <div className="zone-detail-header">
            <div className="title-row">
              <Navigation size={16} className="text-emerald" />
              <h4>{selectedZoneInfo.zone_name || "PFZ Coordinate Selected"}</h4>
            </div>
            <button onClick={() => setSelectedZoneInfo(null)} className="close-btn">
              &times;
            </button>
          </div>
          <div className="zone-detail-body">
            <div className="zone-metric">
              <span>Distance & Bearing:</span>
              <strong>
                {selectedZoneInfo.distance_km} km ({selectedZoneInfo.direction})
              </strong>
            </div>
            <div className="zone-metric">
              <span>Depth Range:</span>
              <strong>{selectedZoneInfo.depth_range}</strong>
            </div>
            <div className="zone-metric">
              <span>Sea Temperature:</span>
              <strong>{selectedZoneInfo.sst_celsius} °C</strong>
            </div>
            <div className="zone-metric">
              <span>Target Catch:</span>
              <strong>{selectedZoneInfo.fish_types?.join(", ")}</strong>
            </div>
            <div className="zone-metric">
              <span>Forecast Confidence:</span>
              <strong className="text-emerald">{selectedZoneInfo.confidence}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="map-legend">
        <div className="legend-title">Legend</div>
        <div className="legend-item">
          <span className="legend-line coastline-line"></span>
          <span>Kerala Coastline</span>
        </div>
        <div className="legend-item">
          <span className="legend-box pfz-box"></span>
          <span>Potential Fishing Zone (PFZ)</span>
        </div>
        <div className="legend-item">
          <span className="legend-box sst-box"></span>
          <span>Thermal Gradient (SST)</span>
        </div>
      </div>
    </div>
  );
}
