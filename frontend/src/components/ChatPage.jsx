import React from "react";
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
  theme,
  userLocation
}) {
  const handleSendMessage = (text) => {
    onSendMessage(text);
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
