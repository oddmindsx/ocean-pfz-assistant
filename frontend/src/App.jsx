import React, { useState } from "react";
import ChatWindow from "./components/ChatWindow";
import MapPanel from "./components/MapPanel";
import SafetyBadge from "./components/SafetyBadge";
import EvidenceCard from "./components/EvidenceCard";
import MarineWatchPanel from "./components/MarineWatchPanel";
import { sendMessage } from "./services/api";
import { Anchor, Waves, Radio, Activity } from "lucide-react";

export default function App() {
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "Namaskaram! 🙏 I am your **SagarDrishti Marine Advisory Assistant** for the Kerala coast.\n\nI provide real-time **Potential Fishing Zones (PFZ)**, **Sea Surface Temperature (SST)** thermal fronts, and **Sea Safety Advisories**.\n\nHow can I help your fishing voyage from Kochi today?",
      timestamp: new Date().toISOString()
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [safety, setSafety] = useState({
    status: "SAFE",
    wave_height_m: 1.4,
    wind_speed_knots: 11.0,
    advice: "Normal sea condition off Kochi harbor. Low swell; safe for artisanal & gillnet boats."
  });
  const [evidence, setEvidence] = useState({
    sst_range: "28.1 - 28.5 °C",
    chlorophyll: "1.48 mg/m³",
    reasoning: "Coincident thermal boundary with coastal upwelling plume off Kochi."
  });
  const [targetLayer, setTargetLayer] = useState({
    id: "pfz",
    name: "Potential Fishing Zones (PFZ)",
    url: "/data/pfz_kochi_2026-09-11.geojson",
    color: "#00e676"
  });
  const [isMockMode, setIsMockMode] = useState(false);

  const handleSendMessage = async (text) => {
    const userMsg = {
      sender: "user",
      text,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await sendMessage(text, {
        location: { name: "Kochi", lat: 9.9312, lon: 76.2673 },
        date: "2026-09-11"
      });

      // 1. Show text in chat
      const assistantMsg = {
        sender: "assistant",
        text: response.text || "Received response from ocean advisor.",
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // 2. Load first layer from layers onto map (M4 Requirement)
      if (response.layers && response.layers.length > 0) {
        setTargetLayer(response.layers[0]);
      }

      // 3. Update safety and evidence metadata
      if (response.safety) {
        setSafety(response.safety);
      }
      if (response.evidence) {
        setEvidence(response.evidence);
      }

      setIsMockMode(!!response.isMock);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: `⚠️ Error retrieving ocean state: ${err.message}`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <header className="app-navbar">
        <div className="nav-brand">
          <div className="nav-logo">
            <Anchor size={22} className="text-cyan" />
          </div>
          <div>
            <h1 className="nav-title">SagarDrishti</h1>
            <span className="nav-subtitle">Kerala Coastal Ocean Advisory & PFZ Intelligence</span>
          </div>
        </div>

        <div className="nav-status-group">
          <div className="status-pill">
            <span className="status-pulse-green"></span>
            <span>INCOIS Sector 10</span>
          </div>
          <div className="status-pill server-pill">
            <Activity size={14} className={isMockMode ? "text-amber" : "text-emerald"} />
            <span>{isMockMode ? "Mock Server Active" : "Port 8000 Ready"}</span>
          </div>
        </div>
      </header>

      {/* Main Split Layout: Left Chat + Cards | Right Leaflet Map */}
      <main className="app-body">
        {/* Left Column: Chat & Informational Badges */}
        <section className="left-panel">
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isMockMode={isMockMode}
          />
          <div className="panel-side-cards">
            <SafetyBadge safety={safety} />
            <EvidenceCard evidence={evidence} />
            <MarineWatchPanel />
          </div>
        </section>

        {/* Right Column: Interactive Map */}
        <section className="right-panel">
          <MapPanel targetLayer={targetLayer} />
        </section>
      </main>
    </div>
  );
}
