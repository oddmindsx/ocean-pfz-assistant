import React, { useState, useEffect } from "react";
import ChatWindow from "./ChatWindow";
import MapPanel from "./MapPanel";
import SafetyBadge from "./SafetyBadge";
import EvidenceCard from "./EvidenceCard";
import { PalmTree, Plumeria } from "./decor";

export default function ChatPage({
  messages,
  onSendMessage,
  isLoading,
  isMockMode,
  safety,
  evidence,
  targetLayer,
  theme
}) {
  const [userCoords, setUserCoords] = useState(null);

  // Acquire GPS position when the component mounts
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            name: "Current Location",
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Geolocation warning/error:", error.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const handleSendMessage = (text) => {
    // Pass both the message text and the location object to parent/handler
    onSendMessage(text, userCoords);
  };

  return (
    <div className="chat-page">
      {theme === "light" && (
        <>
          <PalmTree size={80} className="decor-corner decor-top-left" />
          <Plumeria size={54} className="decor-corner decor-bottom-left" />
        </>
      )}

      <section className="chat-card">
        <ChatWindow
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isMockMode={isMockMode}
        />
      </section>

      <section className="chat-map-card">
        <div className="chat-map-preview">
          <MapPanel targetLayer={targetLayer} userLocation={userCoords} />
        </div>
        <div className="chat-map-info">
          <SafetyBadge safety={safety} />
          <EvidenceCard evidence={evidence} />
        </div>
      </section>
    </div>
  );
}
