// Every dial Orby has, and the palettes. One source of truth for defaults and for the dev panel.

export interface Palette {
  background: string; // the room behind Orby
  glow: string; // the room's haze and Orby's halo
  specular: string; // highlights
}

export const PALETTES = {
  orby: { background: "#02080d", glow: "#5fe0d0", specular: "#eafcff" },
  viki: { background: "#02060b", glow: "#9fd2ff", specular: "#e6f4ff" },
  ember: { background: "#080402", glow: "#ffb76b", specular: "#fff1df" },
  phosphor: { background: "#020804", glow: "#7dffa4", specular: "#e8fff0" },
  ghost: { background: "#060607", glow: "#f2f2f5", specular: "#ffffff" },
} satisfies Record<string, Palette>;

export type PaletteName = keyof typeof PALETTES;

// drag: Orby turns toward the cursor only while you hold the mouse down; always: it watches the cursor; off: it just drifts
export const FOLLOW_MODES = ["drag", "always", "off"] as const;
export type FollowMode = (typeof FOLLOW_MODES)[number];

export interface Params {
  palette: PaletteName;
  // the look
  bloom: number;
  bloomThreshold: number;
  rays: number;
  haze: number;
  beams: number;
  grain: number;
  // following the cursor
  follow: FollowMode;
  yawRange: number;
  pitchRange: number;
  stiffness: number;
  autopilotDelay: number;
  autopilotAmp: number;
  // the camera and the canvas
  cameraDistance: number;
  fov: number;
  dprCap: number;
}

export const DEFAULT_PARAMS: Params = {
  palette: "orby",
  bloom: 0.45,
  bloomThreshold: 1.3,
  rays: 0.25,
  haze: 0.35,
  beams: 0.35,
  grain: 0.035,
  follow: "drag",
  yawRange: 0.9,
  pitchRange: 0.55,
  stiffness: 7,
  autopilotDelay: 6,
  autopilotAmp: 0.35,
  cameraDistance: 4.2,
  fov: 0.75,
  dprCap: 2,
};

export const hexToRgb = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16);

  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
