import React from "react";

/** A simple flat-style palm tree, used as a light-theme corner decoration. */
export function PalmTree({ size = 90, className = "" }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 100 110" className={className}>
      <path d="M48 108 L52 40 L56 108 Z" fill="#8a6a43" opacity="0.9" />
      <path d="M52 40 C 30 34, 12 40, 4 54 C 22 52, 36 48, 52 44 Z" fill="#0d7a5f" />
      <path d="M52 40 C 74 30, 92 34, 98 48 C 80 48, 66 44, 52 42 Z" fill="#12946f" />
      <path d="M52 40 C 34 22, 18 18, 8 24 C 22 30, 36 34, 52 40 Z" fill="#0d7a5f" />
      <path d="M52 40 C 68 18, 86 14, 96 20 C 82 28, 66 34, 52 40 Z" fill="#12946f" />
      <path d="M52 40 C 46 18, 48 4, 56 -2 C 58 14, 56 28, 52 40 Z" fill="#0d7a5f" />
      <circle cx="52" cy="40" r="6" fill="#a8670e" opacity="0.85" />
    </svg>
  );
}

/** A simple flat-style plumeria (frangipani) flower cluster. */
export function Plumeria({ size = 70, className = "" }) {
  const petal = (rotate) => (
    <ellipse
      cx="0"
      cy="-14"
      rx="8"
      ry="15"
      fill="#ffffff"
      stroke="#f5d7e0"
      strokeWidth="0.6"
      transform={`rotate(${rotate})`}
    />
  );
  return (
    <svg width={size} height={size} viewBox="-30 -30 60 60" className={className}>
      <g opacity="0.95">
        {petal(0)}
        {petal(72)}
        {petal(144)}
        {petal(216)}
        {petal(288)}
      </g>
      <circle r="4.5" fill="#f7c948" />
    </svg>
  );
}
