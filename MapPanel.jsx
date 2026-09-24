import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import LayerControls from "./LayerControls";
import { fetchLayerGeoJson } from "../services/api";
import { Navigation } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_COORDS = [9.9312, 76.2673];

export default function MapPanel({ targetLayer, userLocation }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const layerObjectsRef = useRef({});

  const [activeLayers, setActiveLayers] = useState([]);
  const [selectedZoneInfo, setSelectedZoneInfo] = useState(null);

  const currentCoords =
    userLocation?.lat && userLocation?.lon
      ? [userLocation.lat, userLocation.lon]
      : DEFAULT_COORDS;

  const getLayerStyle = (layerId, feature) => {
    if (layerId === "pfz") {
      return { color: "#00c853", weight: 2, fillColor: "#00e676", fillOpacity: 0.35, dashArray: "6, 3" };
    }
    if (layerId === "sst") {
      const temp = feature?.properties?.temp_c || 28.5;
      const color = temp > 28.8 ? "#ff5722" : temp > 28.3 ? "#ff9800" : "#03a9f4";
      return { color: color, weight: 2, fillColor: color, fillOpacity: 0.28 };
    }
    if (layerId === "chlorophyll") {
      return { color: "#00897b", weight: 2, fillColor: "#26a69a", fillOpacity: 0.4 };
    }
    return { color: "#3b82f6", weight: 2, fillColor: "#60a5fa", fillOpacity: 0.3 };
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: currentCoords,
      zoom: 9,
      minZoom: 6,
      maxZoom: 16,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors | Data: INCOIS / OCM-3',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    fetch("/data/kerala_coastline.geojson")
      .then((res) => res.json())
      .then((coastData) => {
        const coastlineLayer = L.geoJSON(coastData, {
          style: { color: "#0284c7", weight: 3, opacity: 0.85, dashArray: "4, 4" },
        }).addTo(map);
        coastlineLayer.bindTooltip("Coastline Margin", { sticky: true });
      })
      .catch((err) => console.warn("Coastline load notice:", err));

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation?.lat || !userLocation?.lon) return;

    const latLng = [userLocation.lat, userLocation.lon];
    map.flyTo(latLng, 10, { duration: 1.5 });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(latLng);
    } else {
      const locationIcon = L.divIcon({
        className: "custom-user-marker",
        html: `<div class="user-marker-pin" style="font-size:22px;">📍</div><div class="user-marker-label" style="font-weight:600; font-size:12px; background:white; padding:2px 6px; border-radius:4px; box-shadow:0 1px 4px rgba(0,0,0,0.2);">Your Position</div>`,
        iconSize: [160, 40],
        iconAnchor: [40, 20]
      });

      userMarkerRef.current = L.marker(latLng, { icon: locationIcon }).addTo(map);
      userMarkerRef.current.bindPopup(`
        <div style="font-family: sans-serif;">
          <h4 style="margin:0 0 4px 0; color:#0f172a; font-size:14px;">📍 Current GPS Location</h4>
          <div style="margin-top:6px; font-size:11px; color:#0284c7; font-weight:600;">
            Lat: ${userLocation.lat.toFixed(4)}°N, Lon: ${userLocation.lon.toFixed(4)}°E
          </div>
        </div>
      `);
    }
  }, [userLocation]);

  const loadOrUpdateLayer = async (layerMeta) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const layerId = typeof layerMeta === "string" ? layerMeta : layerMeta.id;
    const layerColor = typeof layerMeta === "object" && layerMeta.color ? layerMeta.color : "#00e676";

    if (layerObjectsRef.current[layerId]) {
      const existing = layerObjectsRef.current[layerId];
      if (!map.hasLayer(existing)) {
        existing.addTo(map);
      }
      try {
        const bounds = existing.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20], maxZoom: 11 });
      } catch (e) {}
      setActiveLayers((prev) =>
        prev.map((l) => (l.id === layerId ? { ...l, visible: true } : l))
      );
      return;
    }

    try {
      let geoJsonData;

      if (layerMeta && typeof layerMeta === "object" && layerMeta.url) {
        geoJsonData = await fetchLayerGeoJson(layerMeta.url);
      } else {
        const fetched = await fetchLayerGeoJson(layerId);
        if (typeof fetched === "string") {
          const res = await fetch(fetched);
          geoJsonData = await res.json();
        } else {
          geoJsonData = fetched;
        }
      }

      if (!geoJsonData || (!geoJsonData.features && !Array.isArray(geoJsonData))) return;

      const leafletGeoLayer = L.geoJSON(geoJsonData, {
        style: (feature) => getLayerStyle(layerId, feature),
        onEachFeature: (feature, layer) => {
          layer.on({
            mouseover: (e) => { e.target.setStyle({ weight: 3, fillOpacity: 0.65 }); },
            mouseout: (e) => { leafletGeoLayer.resetStyle(e.target); },
            click: (e) => {
              setSelectedZoneInfo(feature.properties);
              L.DomEvent.stopPropagation(e);
            },
          });

          const props = feature.properties || {};
          const popupHtml = `
            <div class="pfz-popup-container">
              <div class="popup-badge" style="background:${layerColor}; padding:2px 6px; color:#fff; font-weight:bold; font-size:10px; border-radius:3px;">
                ${layerId.toUpperCase()} FEATURE
              </div>
              <h4 class="popup-title" style="margin:6px 0 4px 0; font-size:14px;">${props.zone_name || props.name || "Ocean Feature"}</h4>
              <div class="popup-specs" style="font-size:12px; color:#334155;">
                ${props.distance_km ? `<div><strong>Distance:</strong> ${props.distance_km} km</div>` : ""}
                ${props.direction ? `<div><strong>Bearing:</strong> ${props.direction}</div>` : ""}
              </div>
            </div>
          `;
          layer.bindPopup(popupHtml, { maxWidth: 280 });
        },
      }).addTo(map);

      layerObjectsRef.current[layerId] = leafletGeoLayer;

      try {
        const bounds = leafletGeoLayer.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20], maxZoom: 11 });
      } catch (e) {}

      setActiveLayers((prev) => {
        const metaObj = typeof layerMeta === "object" ? layerMeta : { id: layerId, name: layerId.toUpperCase() };
        return [...prev, { ...metaObj, visible: true }];
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!targetLayer || !mapInstanceRef.current) return;
    loadOrUpdateLayer(targetLayer);
  }, [targetLayer]);

  const handleToggleLayer = (layerId) => {
    const map = mapInstanceRef.current;
    const geoLayer = layerObjectsRef.current[layerId];
    if (!map || !geoLayer) return;

    if (map.hasLayer(geoLayer)) {
      map.removeLayer(geoLayer);
      setActiveLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, visible: false } : l)));
    } else {
      geoLayer.addTo(map);
      setActiveLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, visible: true } : l)));
    }
  };

  const handleRemoveLayer = (layerId) => {
    const map = mapInstanceRef.current;
    const geoLayer = layerObjectsRef.current[layerId];
    if (map && geoLayer && map.hasLayer(geoLayer)) map.removeLayer(geoLayer);
    delete layerObjectsRef.current[layerId];
    setActiveLayers((prev) => prev.filter((l) => l.id !== layerId));
  };

  const handleAddLayer = (layerMeta) => { loadOrUpdateLayer(layerMeta); };

  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const group = L.featureGroup();
    Object.values(layerObjectsRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) group.addLayer(layer);
    });
    if (group.getLayers().length > 0) {
      map.fitBounds(group.getBounds(), { padding: [40, 40] });
    } else {
      map.setView(currentCoords, 9);
    }
  };

  const allLayersCatalog = [
    { id: "pfz", name: "Potential Fishing Zones", color: "#00e676" },
    { id: "sst", name: "SST Thermal Contours", color: "#ff7043" },
    { id: "chlorophyll", name: "Chlorophyll-a Plumes", color: "#26a69a" },
  ];

  const availableToAdd = allLayersCatalog.filter((c) => !activeLayers.some((a) => a.id === c.id));

  return (
    <div className="map-panel-wrapper">
      <div ref={mapContainerRef} className="leaflet-map-container" />
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

      {selectedZoneInfo && (
        <div className="zone-detail-overlay">
          <div className="zone-detail-header">
            <div className="title-row">
              <Navigation size={16} className="text-emerald" />
              <h4>{selectedZoneInfo.zone_name || "PFZ Coordinate Selected"}</h4>
            </div>
            <button onClick={() => setSelectedZoneInfo(null)} className="close-btn">&times;</button>
          </div>
          <div className="zone-detail-body">
            <div className="zone-metric">
              <span>Distance & Bearing:</span>
              <strong>{selectedZoneInfo.distance_km} km ({selectedZoneInfo.direction})</strong>
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
              <strong>{selectedZoneInfo.fish_types?.join(", ") || "Local Fish"}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="map-legend">
        <div className="legend-title">Legend</div>
        <div className="legend-item"><span className="legend-line coastline-line"></span><span>Coastline Margin</span></div>
        <div className="legend-item"><span className="legend-box pfz-box"></span><span>Potential Fishing Zone (PFZ)</span></div>
        <div className="legend-item"><span className="legend-box sst-box"></span><span>Thermal Gradient (SST)</span></div>
      </div>
    </div>
  );
}