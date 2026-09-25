import React from "react";
import ChatWindow from "./ChatWindow";
import MapPanel from "./MapPanel";
import SafetyBadge from "./SafetyBadge";
import EvidenceCard from "./EvidenceCard";
import { WaterCorner, Seabed, DolphinLeap } from "./decor";

export default function ChatPage({
  messages,
  onSendMessage,
  isLoading,
  isMockMode,
  safety,
  evidence,
  targetLayer,
  theme,
  userLocation
}) {
  const handleSendMessage = (text) => {
    onSendMessage(text);
  };

  return (
    <div className="chat-page">
      <section className="chat-card">
        <WaterCorner />
        <Seabed />
        <DolphinLeap />
        <ChatWindow
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isMockMode={isMockMode}
        />
      </section>

      <section className="chat-map-card">
        <div className="chat-map-preview">
          <MapPanel targetLayer={targetLayer} userLocation={userLocation} />
        </div>
        <div className="chat-map-info">
          <SafetyBadge safety={safety} />
          <EvidenceCard evidence={evidence} />
        </div>
      </section>
    </div>
  );
}
