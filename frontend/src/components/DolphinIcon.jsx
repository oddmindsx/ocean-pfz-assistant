import React from "react";

/**
 * A small flat-style dolphin silhouette used as the app's brand mark
 * and as the assistant's avatar in chat. Uses currentColor so it
 * inherits whatever color/theme context it's placed in.
 */
export default function DolphinIcon({ size = 20, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M44 14c-3.5-3-8-4-12-2.5-1.2-3-4-5.5-8-5.5-5 0-9 3.5-10.5 8.5C8.5 15 5 18.5 4 23c5 1 8-1 10-3 .5 3 2.5 5.5 5.5 7-3 1-6.5 1-9.5-.5 2 4 6.5 6.5 11 6 5.5-.5 9.5-4 11-9 2.5.5 5-.5 6.5-2.5-2-.5-3.5-1.5-4.5-3 3.5.5 7-1 10-4z"
        fill="currentColor"
      />
      <circle cx="30" cy="15" r="1.4" fill="var(--bg-secondary, #fff)" />
    </svg>
  );
}
