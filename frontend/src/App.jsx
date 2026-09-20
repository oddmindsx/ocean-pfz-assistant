import React, { useState, useEffect } from "react";
import './App.css';
import Navbar from "./components/Navbar";
import ChatPage from "./components/ChatPage";
import MapPage from "./components/MapPage";
import AdvisoriesPage from "./components/AdvisoriesPage";
import AboutPage from "./components/AboutPage";
import { sendMessage } from "./services/api";

export default function App() {
  // 1. DYNAMIC LOCATION STATE (Defaults to Kochi if user denies browser location)
  const [userLocation, setUserLocation] = useState({
    name: "Kochi (Default)",
    lat: 9.9312,
    lon: 76.2673
  });

  // Get current date dynamically in YYYY-MM-DD format
  const todayDate = new Date().toISOString().split("T")[0];

  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "Namaskaram! 🙏 I'm SagarDrishti, your ocean advisor — think of me as a second pair of eyes on the sea before you head out.\n\nAsk me where the fish are likely to be today, whether the waves and wind look safe, or what the water temperature's doing out there, and I'll pull together what the satellites and sensors are seeing.\n\nWhere are you heading out from today?",
      timestamp: new Date().toISOString()
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [safety, setSafety] = useState({
    status: "SAFE",
    wave_height_m: 1.4,
    wind_speed_knots: 11.0,
    advice: "Detecting local ocean conditions... low swell reported in your area."
  });
  const [evidence, setEvidence] = useState({
    sst_range: "28.1 - 28.5 °C",
    chlorophyll: "1.48 mg/m³",
    reasoning: "Analyzing satellite thermal and chlorophyll ocean data for your coordinates."
  });
  const [targetLayer, setTargetLayer] = useState({
    id: "pfz",
    name: "Potential Fishing Zones (PFZ)",
    url: `/data/pfz_kochi_${todayDate}.geojson`,
    color: "#00e676"
  });
  const [isMockMode, setIsMockMode] = useState(false);

  // Pages & Theme setup
  const [activePage, setActivePage] = useState("chat");
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("ocean-advisor-theme") || "light";
  });

  // 2. AUTO-DETECT BROWSER LOCATION ON MOUNT
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(4));
          const lon = parseFloat(position.coords.longitude.toFixed(4));
          setUserLocation({
            name: "Current Location",
            lat: lat,
            lon: lon
          });
          console.log(`Updated location to user coordinates: ${lat}, ${lon}`);
        },
        (error) => {
          console.warn("Location permission denied or unavailable, using fallback:", error.message);
        }
      );
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("ocean-advisor-theme", theme);
    } catch (e) {
      // localStorage unavailable
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // 3. SEND MESSAGE WITH REAL-TIME COORDINATES & DATE
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
      location: userLocation,
      date: todayDate
    });

    const assistantMsg = {
      sender: "assistant",
      text: response.text || "Received response from ocean advisor.",
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, assistantMsg]);

    // Safely update layer only if valid layer exists
    if (response.layers && response.layers.length > 0 && response.layers[0]) {
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
            userLocation={userLocation}
          />
        )}
        {activePage === "map" && (
          <MapPage 
            targetLayer={targetLayer} 
            safety={safety} 
            evidence={evidence} 
            userLocation={userLocation}
          />
        )}
        {activePage === "advisories" && <AdvisoriesPage userLocation={userLocation} />}
        {activePage === "about" && <AboutPage />}
      </main>
    </div>
  );
}
