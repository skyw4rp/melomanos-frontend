import type { CSSProperties } from "react";

export const recordGrooves: CSSProperties = {
  backgroundImage: `repeating-radial-gradient(
    circle at 50% 50%,
    transparent 0px,
    transparent 3px,
    rgba(255,255,255,0.45) 3px,
    rgba(255,255,255,0.45) 4px
  )`,
};

export const labelGrooves: CSSProperties = {
  backgroundImage: `repeating-radial-gradient(
    circle at center,
    transparent 0,
    transparent 2px,
    rgba(255,255,255,0.5) 2px,
    rgba(255,255,255,0.5) 3px
  )`,
};
