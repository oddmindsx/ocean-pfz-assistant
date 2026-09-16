/**
 * ChatWindow.jsx - Chat Interface Component
 * 
 * Yeh component user ke sath interactive conversation handle karta hai:
 * - User input box aur Send button (Enter key support ke saath)
 * - User vs Assistant message bubbles alag styling me
 * - Quick prompt suggestion buttons (e.g. "Find PFZ near Kochi")
 * - Typing indicator jab backend response generate kar raha ho
 */

import React, { useState, useRef, useEffect } from "react";
import { Send, Compass, Fish, ShieldAlert, Sparkles } from "lucide-react";

export default function ChatWindow({ messages, onSendMessage, isLoading, isMockMode }) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom jab naya message aaye
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Form submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText("");
  };

  // Quick query pill click handler
  const handleQuickQuery = (text) => {
    if (isLoading) return;
    onSendMessage(text);
  };

  return (
    <div className="chat-window-container">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-title">
          <div className="pulse-indicator"></div>
          <div>
            <h3>SagarDrishti Ocean Advisor</h3>
            <span className="location-pill">📍 Kochi, Kerala (Today)</span>
          </div>
        </div>
        {isMockMode && (
          <span className="mock-badge" title="Backend not running on :8000; simulating responses matching schema">
            Offline Mock Active
          </span>
        )}
      </div>

      {/* Suggested Quick Queries (Ek click me common sawal poochne ke liye) */}
      <div className="quick-prompts">
        <button
          type="button"
          onClick={() => handleQuickQuery("Where are the potential fishing zones today near Kochi?")}
          disabled={isLoading}
        >
          <Fish size={14} /> Find PFZ near Kochi
        </button>
        <button
          type="button"
          onClick={() => handleQuickQuery("Is it safe for small boats to go fishing today? Check wave height.")}
          disabled={isLoading}
        >
          <ShieldAlert size={14} /> Sea Safety & Waves
        </button>
        <button
          type="button"
          onClick={() => handleQuickQuery("Show sea surface temperature (SST) thermal fronts off Kerala.")}
          disabled={isLoading}
        >
          <Compass size={14} /> View SST Contours
        </button>
      </div>

      {/* Messages List Feed */}
      <div className="messages-list">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message-row ${msg.sender === "user" ? "user-row" : "assistant-row"}`}
          >
            {msg.sender === "assistant" && (
              <div className="avatar assistant-avatar">
                <Sparkles size={16} />
              </div>
            )}
            <div className={`message-bubble ${msg.sender === "user" ? "user-bubble" : "assistant-bubble"}`}>
              <div className="message-content">
                {msg.text.split("\n").map((line, i) => (
                  <p key={i}>
                    {line.startsWith("**") && line.endsWith("**") ? (
                      <strong>{line.replace(/\*\*/g, "")}</strong>
                    ) : line.includes("**") ? (
                      line.split(/(\*\*.*?\*\*)/).map((chunk, ci) =>
                        chunk.startsWith("**") && chunk.endsWith("**") ? (
                          <strong key={ci}>{chunk.replace(/\*\*/g, "")}</strong>
                        ) : (
                          chunk
                        )
                      )
                    ) : (
                      line
                    )}
                  </p>
                ))}
              </div>
              <span className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {msg.sender === "user" && (
              <div className="avatar user-avatar">
                <span>You</span>
              </div>
            )}
          </div>
        ))}

        {/* Loading / Typing State */}
        {isLoading && (
          <div className="message-row assistant-row">
            <div className="avatar assistant-avatar">
              <Sparkles size={16} className="spin-slow" />
            </div>
            <div className="message-bubble assistant-bubble loading-bubble">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="typing-text">Analyzing satellite thermal fronts & ocean waves...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box & Send button */}
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about fishing zones, sea condition, SST..."
          disabled={isLoading}
          className="chat-input"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="chat-send-btn"
          title="Send query"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
