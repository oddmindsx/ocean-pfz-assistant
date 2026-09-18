import React from "react";
import { Anchor, Satellite, ShieldCheck, HeartHandshake } from "lucide-react";
import DolphinIcon from "./DolphinIcon";

export default function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="about-hero-icon">
          <DolphinIcon size={30} />
        </div>
        <h2>Ocean PFZ & Safety Advisor</h2>
        <p>
          A decision-support companion for fishing crews along the Kerala coast — built to turn
          satellite ocean data into plain, practical guidance before a boat leaves the harbor.
        </p>
      </div>

      <div className="about-grid">
        <div className="about-card">
          <Satellite size={18} className="text-cyan" />
          <h4>Where the data comes from</h4>
          <p>
            Potential Fishing Zones, sea surface temperature fronts, and chlorophyll-a upwelling
            plumes are drawn from INCOIS and satellite ocean-colour sources, refreshed daily.
          </p>
        </div>
        <div className="about-card">
          <ShieldCheck size={18} className="text-emerald" />
          <h4>Safety first</h4>
          <p>
            Wave height and wind advisories are meant to support, not replace, your own judgment
            and official IMD bulletins. Always check conditions again before departure.
          </p>
        </div>
        <div className="about-card">
          <Anchor size={18} className="text-amber" />
          <h4>Built for artisanal crews</h4>
          <p>
            Designed around the way small and medium fishing operations actually plan a trip —
            quick questions, clear answers, and a map you can act on.
          </p>
        </div>
        <div className="about-card">
          <HeartHandshake size={18} className="text-cyan" />
          <h4>Feedback welcome</h4>
          <p>
            This is an evolving prototype. If something looks off or you'd like a feature added,
            that feedback directly shapes what gets built next.
          </p>
        </div>
      </div>
    </div>
  );
}
