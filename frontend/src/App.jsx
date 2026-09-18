import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import ChatPage from "./components/ChatPage";
import MapPage from "./components/MapPage";
import AdvisoriesPage from "./components/AdvisoriesPage";
import AboutPage from "./components/AboutPage";
import { sendMessage } from "./services/api";

export default function App() {
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "Namaskaram! 🙏 I'm SagarDrishti, your ocean advisor for the Kerala coast — think of me as a second pair of eyes on the sea before you head out.\n\nAsk me where the fish are likely to be today, whether the waves and wind look safe, or what the water temperature's doing out there, and I'll pull together what the satellites and sensors are seeing.\n\nWhere are you headed from Kochi today?",
      timestamp: new Date().toISOString()
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [safety, setSafety] = useState({
    status: "SAFE",
    wave_height_m: 1.4,
    wind_speed_knots: 11.0,
    advice: "Waters are calm off Kochi harbor right now — low swell, so it's a good day for artisanal and gillnet boats."
  });
  const [evidence, setEvidence] = useState({
    sst_range: "28.1 - 28.5 °C",
    chlorophyll: "1.48 mg/m³",
    reasoning: "There's a thermal boundary lining up with a coastal upwelling plume off Kochi — that's usually where the fish gather."
  });
  const [targetLayer, setTargetLayer] = useState({
    id: "pfz",
    name: "Potential Fishing Zones (PFZ)",
    url: "/data/pfz_kochi_2026-09-11.geojson",
    color: "#00e676"
  });
  const [isMockMode, setIsMockMode] = useState(false);

  // Which of the 4 pages (Chat / Map / Advisories / About) is showing
  const [activePage, setActivePage] = useState("chat");

  // Theme: read any saved preference, default to light
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("ocean-advisor-theme") || "light";
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("ocean-advisor-theme", theme);
    } catch (e) {
      // localStorage unavailable (e.g. private browsing) — theme just won't persist
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

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

      const assistantMsg = {
        sender: "assistant",
        text: response.text || "Received response from ocean advisor.",
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (response.layers && response.layers.length > 0) {
        setTargetLayer(response.layers[0]);
      }
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
    <div className="app-container" data-theme={theme}>
      <Navbar
        activePage={activePage}
        onNavigate={setActivePage}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="app-page-body">
        {activePage === "chat" && (
          <ChatPage
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isMockMode={isMockMode}
            safety={safety}
            evidence={evidence}
            targetLayer={targetLayer}
            theme={theme}
          />
        )}
        {activePage === "map" && (
          <MapPage targetLayer={targetLayer} safety={safety} evidence={evidence} />
        )}
        {activePage === "advisories" && <AdvisoriesPage />}
        {activePage === "about" && <AboutPage />}
      </main>
    </div>
  );
}
