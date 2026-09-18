import React from "react";
import { MessageCircle, Map as MapIcon, ClipboardList, Info, Sun, Moon, MapPin, Calendar } from "lucide-react";
import DolphinIcon from "./DolphinIcon";

const TABS = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "map", label: "Map", icon: MapIcon },
  { id: "advisories", label: "Advisories", icon: ClipboardList },
  { id: "about", label: "About", icon: Info }
];

export default function Navbar({ activePage, onNavigate, theme, onToggleTheme }) {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo">
          <DolphinIcon size={22} />
        </div>
        <div>
          <h1 className="navbar-title">Ocean PFZ & Safety Advisor</h1>
          <span className="navbar-subtitle">Smart ocean insights for safer journeys</span>
        </div>
      </div>

      <nav className="navbar-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activePage === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`navbar-tab ${isActive ? "navbar-tab-active" : ""}`}
              onClick={() => onNavigate(tab.id)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="navbar-controls">
        <div className="navbar-pill" title="Region (coming soon)">
          <MapPin size={13} />
          <span>Kerala Coast</span>
        </div>
        <div className="navbar-pill" title="Advisory date (coming soon)">
          <Calendar size={13} />
          <span>11 Sep 2026</span>
        </div>
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle light and dark theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
