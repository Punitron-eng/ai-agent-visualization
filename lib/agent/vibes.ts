/**
 * Office vibes.
 *
 * Only the *scene* is re-skinned. Agent state colours are deliberately fixed
 * across every vibe — they are semantic, and a state that means one thing in
 * one theme and another in the next would be worse than no theme at all.
 */

export type VibeId = "warm" | "studio" | "graphite";

export interface SceneColors {
  ground: string;
  floor: string;
  floorSheen: string;
  wall: string;
  deskTop: string;
  deskLeg: string;
  metal: string;
  seat: string;
  fabric: string;
  screenOff: string;
  leaf: string;
  leafDark: string;
  pot: string;
  glass: string;
  crate: string;
  clay: string;
  clayLight: string;
  clayDark: string;
  amber: string;
  rug: string;
  rugAlt: string;
  window: string;
  lampWarm: string;
  paper: string;
  divider: string;
  dark: string;
}

export interface Vibe {
  id: VibeId;
  label: string;
  hint: string;
  /** Fog and clear colour behind the room. */
  scene: SceneColors;
  /** Lighting rig, since a bright room needs a different key than a dark one. */
  light: {
    hemiSky: string;
    hemiGround: string;
    hemiIntensity: number;
    ambient: string;
    ambientIntensity: number;
    keyColor: string;
    keyIntensity: number;
    fillColor: string;
    fillIntensity: number;
    lampColor: string;
    lampIntensity: number;
  };
}

export const VIBES: Record<VibeId, Vibe> = {
  warm: {
    id: "warm",
    label: "Warm studio",
    hint: "Dusk, wood and amber",
    scene: {
      ground: "#141010",
      floor: "#6d5642",
      floorSheen: "#5c4835",
      wall: "#574433",
      deskTop: "#a2764f",
      deskLeg: "#3b2f27",
      metal: "#5b4f47",
      seat: "#5d4c41",
      fabric: "#8a7461",
      screenOff: "#0c1013",
      leaf: "#4f9a67",
      leafDark: "#3b7a50",
      pot: "#9c7150",
      glass: "#a7e2ef",
      crate: "#7a5a3c",
      clay: "#c4614a",
      clayLight: "#dd7f68",
      clayDark: "#9c4a37",
      amber: "#e8a33d",
      rug: "#7a5a4a",
      rugAlt: "#5f6b5a",
      window: "#9fd0e8",
      lampWarm: "#ffd9a0",
      paper: "#e2dacd",
      divider: "#6b5647",
      dark: "#1b1614",
    },
    light: {
      hemiSky: "#ffd9b0",
      hemiGround: "#6b4f38",
      hemiIntensity: 1.5,
      ambient: "#8a6f55",
      ambientIntensity: 0.5,
      keyColor: "#ffd9ab",
      keyIntensity: 2.4,
      fillColor: "#9fe2f2",
      fillIntensity: 0.9,
      lampColor: "#ffc98a",
      lampIntensity: 20,
    },
  },

  studio: {
    id: "studio",
    label: "White & orange",
    hint: "Bright studio, coral accents",
    scene: {
      ground: "#e8e4de",
      floor: "#efeae3",
      floorSheen: "#e2dcd3",
      wall: "#f6f3ee",
      deskTop: "#f0ede7",
      deskLeg: "#c9c2b8",
      metal: "#b9b2a8",
      seat: "#e07a4d",
      fabric: "#f0a67d",
      screenOff: "#2b2b2e",
      leaf: "#5aa76e",
      leafDark: "#478a58",
      pot: "#e0764a",
      glass: "#cfe8f2",
      crate: "#e0a06a",
      clay: "#ee7b45",
      clayLight: "#ff9c6b",
      clayDark: "#c85a2c",
      amber: "#f0932b",
      rug: "#f2c9ac",
      rugAlt: "#d8dcd2",
      window: "#dff0fa",
      lampWarm: "#fff3df",
      paper: "#ffffff",
      divider: "#ddd6cc",
      dark: "#3a3a3e",
    },
    light: {
      hemiSky: "#ffffff",
      hemiGround: "#e6ddd2",
      hemiIntensity: 2.4,
      ambient: "#ffffff",
      ambientIntensity: 1.5,
      keyColor: "#fff3e2",
      keyIntensity: 2.2,
      fillColor: "#dfeef7",
      fillIntensity: 1.0,
      lampColor: "#ffd9a8",
      lampIntensity: 8,
    },
  },

  graphite: {
    id: "graphite",
    label: "Cool graphite",
    hint: "Neutral, restrained, cyan",
    scene: {
      ground: "#0d0f11",
      floor: "#3a4045",
      floorSheen: "#31373b",
      wall: "#3d4449",
      deskTop: "#5a6167",
      deskLeg: "#2a2f33",
      metal: "#6c757c",
      seat: "#414850",
      fabric: "#5b656e",
      screenOff: "#0a0d0f",
      leaf: "#4d9a72",
      leafDark: "#3a7a58",
      pot: "#6b6259",
      glass: "#b7e6f5",
      crate: "#6a6155",
      clay: "#c4614a",
      clayLight: "#dd7f68",
      clayDark: "#9c4a37",
      amber: "#e8a33d",
      rug: "#4a5158",
      rugAlt: "#3f4a4d",
      window: "#a8d8ea",
      lampWarm: "#e8f2ff",
      paper: "#dfe3e6",
      divider: "#4a5157",
      dark: "#15181a",
    },
    light: {
      hemiSky: "#d8ecf5",
      hemiGround: "#3a4045",
      hemiIntensity: 1.7,
      ambient: "#8f9aa3",
      ambientIntensity: 0.7,
      keyColor: "#eaf4ff",
      keyIntensity: 2.0,
      fillColor: "#7fd4e8",
      fillIntensity: 0.8,
      lampColor: "#cfe6f5",
      lampIntensity: 14,
    },
  },
};

export const VIBE_IDS = Object.keys(VIBES) as VibeId[];
export const DEFAULT_VIBE: VibeId = "warm";
