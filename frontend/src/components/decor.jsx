import React from "react";

import waterImg from "../assets/decor/water.png";
import coralImg from "../assets/decor/coral.png";
import starfishImg from "../assets/decor/starfish.png";
import shellImg from "../assets/decor/shell.png";
import dolphinImg from "../assets/decor/dolphin.png";

/**
 * Ocean decorations for the chat card. All are decorative only
 * (empty alt, aria-hidden) and sit behind the chat content.
 */

/** Rippling water tucked into the top-left corner of the card. */
export function WaterCorner() {
  return (
    <img
      src={waterImg}
      alt=""
      aria-hidden="true"
      draggable="false"
      className="decor-water"
    />
  );
}

/** Coral, starfish and shell resting in the bottom-left corner, with a few bubbles. */
export function Seabed() {
  return (
    <div className="decor-seabed" aria-hidden="true">
      <span className="decor-bubble decor-bubble-1" />
      <span className="decor-bubble decor-bubble-2" />
      <span className="decor-bubble decor-bubble-3" />
      <img src={starfishImg} alt="" draggable="false" className="decor-starfish" />
      <img src={coralImg} alt="" draggable="false" className="decor-coral" />
      <img src={shellImg} alt="" draggable="false" className="decor-shell" />
    </div>
  );
}

/** A small dolphin in the bottom-right corner. */
export function DolphinLeap() {
  return (
    <img
      src={dolphinImg}
      alt=""
      aria-hidden="true"
      draggable="false"
      className="decor-dolphin"
    />
  );
}
