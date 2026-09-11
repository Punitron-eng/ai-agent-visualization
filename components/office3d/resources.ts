import * as THREE from "three";
import type { AgentState } from "@/lib/agent/agentTypes";
import { SCENE_COLOR, STATE_COLOR } from "@/lib/agent/palette";
import { DEFAULT_VIBE, VIBES, type SceneColors, type Vibe } from "@/lib/agent/vibes";

/**
 * Every geometry and material in the office, created once at module scope and
 * shared by every mesh that needs it.
 *
 * This is the single biggest lever on a scene with twenty workstations: without
 * it, each desk would upload its own copy of identical buffers, and each mesh
 * would compile its own shader program. With it, the whole office is a couple
 * of dozen GPU resources no matter how many projects are open.
 *
 * These live for the lifetime of the page, so they are deliberately never
 * disposed; `disposeSharedResources` exists for tests and teardown.
 */

/** Plan coordinates (x across, y into the room) -> world, with height in y. */
export function pos(x: number, planY: number, height = 0): [number, number, number] {
  return [x, height, planY];
}

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

export const GEO = {
  unitBox: box(1, 1, 1),
  plane: new THREE.PlaneGeometry(1, 1),
  circle: new THREE.CircleGeometry(0.5, 20),

  deskTop: box(2.7, 0.09, 1.5),
  deskLeg: box(0.12, 0.74, 0.12),
  keyboard: box(0.82, 0.035, 0.3),
  mug: new THREE.CylinderGeometry(0.075, 0.065, 0.11, 12),

  monitorBody: box(1.05, 0.62, 0.05),
  monitorNeck: box(0.09, 0.14, 0.09),
  monitorFoot: box(0.42, 0.025, 0.22),
  monitorScreen: new THREE.PlaneGeometry(0.96, 0.53),

  chairSeat: box(0.5, 0.09, 0.48),
  chairBack: box(0.5, 0.5, 0.08),
  chairPost: new THREE.CylinderGeometry(0.045, 0.045, 0.36, 8),

  // Robot rig. A handful of primitives serve the whole cast.
  head: new THREE.SphereGeometry(0.29, 18, 12),
  visor: new THREE.SphereGeometry(0.205, 16, 10),
  torso: new THREE.CapsuleGeometry(0.235, 0.2, 3, 12),
  limb: new THREE.CapsuleGeometry(0.058, 0.16, 2, 8),
  antenna: new THREE.CylinderGeometry(0.014, 0.014, 0.17, 6),
  bulb: new THREE.SphereGeometry(0.05, 10, 8),
  ear: new THREE.CapsuleGeometry(0.038, 0.05, 2, 6),
  // Added definition: joints, hands, feet and panelling, so the cast reads as
  // built rather than assembled from three blobs.
  neck: new THREE.CylinderGeometry(0.075, 0.09, 0.09, 10),
  shoulder: new THREE.SphereGeometry(0.085, 10, 8),
  hand: new THREE.SphereGeometry(0.062, 10, 8),
  thigh: new THREE.CapsuleGeometry(0.072, 0.15, 2, 8),
  shin: new THREE.CapsuleGeometry(0.06, 0.15, 2, 8),
  foot: box(0.14, 0.07, 0.22),
  pelvis: box(0.3, 0.12, 0.2),
  chestPlate: box(0.26, 0.2, 0.06),
  backpack: box(0.28, 0.26, 0.1),
  brow: box(0.42, 0.035, 0.06),
  crown: new THREE.SphereGeometry(0.29, 16, 8, 0, Math.PI * 2, 0, 0.9),

  pot: new THREE.CylinderGeometry(0.17, 0.13, 0.24, 10),
  leaf: new THREE.SphereGeometry(0.17, 10, 7),
  crate: box(0.72, 0.6, 0.72),
  rack: box(0.66, 1.65, 0.72),
  rackLed: box(0.5, 0.045, 0.02),
  sofaBase: box(2.4, 0.32, 0.9),
  sofaBack: box(2.4, 0.6, 0.18),
  table: box(1.3, 0.06, 0.85),
  tableLeg: box(0.09, 0.62, 0.09),
  board: box(2.3, 1.35, 0.07),
  note: box(0.14, 0.14, 0.012),
  book: box(0.13, 0.26, 0.3),

  // Chill-office dressing.
  trunk: new THREE.CylinderGeometry(0.075, 0.1, 1.5, 8),
  canopy: new THREE.SphereGeometry(0.52, 12, 9),
  divider: box(2.6, 0.62, 0.07),
  pendantCone: new THREE.ConeGeometry(0.26, 0.3, 12, 1, true),
  pendantCord: new THREE.CylinderGeometry(0.008, 0.008, 0.55, 5),
  discLight: new THREE.CircleGeometry(0.24, 14),
  windowPane: new THREE.PlaneGeometry(1, 1),
  beanBag: new THREE.SphereGeometry(0.42, 12, 9),
  lampPost: new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6),
  lampShade: new THREE.ConeGeometry(0.24, 0.3, 12, 1, true),
  frame: box(0.7, 0.5, 0.04),
  cooler: box(0.42, 1.05, 0.4),
} as const;

const standard = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.85, ...extra });

export const MAT = {
  floor: standard(SCENE_COLOR.floor, { roughness: 0.55, metalness: 0.05 }),
  floorSheen: standard(SCENE_COLOR.floorSheen, { roughness: 0.42, metalness: 0.08 }),
  wall: standard(SCENE_COLOR.wall, { roughness: 0.95 }),
  deskTop: standard(SCENE_COLOR.deskTop, { roughness: 0.7 }),
  deskLeg: standard(SCENE_COLOR.deskLeg, { roughness: 0.6, metalness: 0.25 }),
  metal: standard(SCENE_COLOR.metal, { roughness: 0.4, metalness: 0.55 }),
  seat: standard(SCENE_COLOR.seat, { roughness: 0.9 }),
  fabric: standard(SCENE_COLOR.fabric, { roughness: 1 }),
  dark: standard("#1b1614", { roughness: 0.75 }),
  screenOff: standard(SCENE_COLOR.screenOff, { roughness: 0.35 }),
  clay: standard(SCENE_COLOR.clay, { roughness: 0.62 }),
  clayDark: standard(SCENE_COLOR.clayDark, { roughness: 0.68 }),
  clayLight: standard(SCENE_COLOR.clayLight, { roughness: 0.6 }),
  visorGlass: standard("#08070a", { roughness: 0.95, metalness: 0 }),
  leaf: standard(SCENE_COLOR.leaf, { roughness: 0.95 }),
  leafDark: standard(SCENE_COLOR.leafDark, { roughness: 0.95 }),
  pot: standard(SCENE_COLOR.pot, { roughness: 0.9 }),
  crate: standard(SCENE_COLOR.crate, { roughness: 0.95 }),
  paper: standard("#e2dacd", { roughness: 0.98 }),
  rug: standard(SCENE_COLOR.rug, { roughness: 1 }),
  rugAlt: standard(SCENE_COLOR.rugAlt, { roughness: 1 }),
  divider: standard("#6b5647", { roughness: 0.9 }),
  warmGlow: new THREE.MeshBasicMaterial({ color: new THREE.Color(SCENE_COLOR.lampWarm), toneMapped: false }),
  windowGlow: new THREE.MeshBasicMaterial({ color: new THREE.Color(SCENE_COLOR.window), toneMapped: false }),
  shade: standard("#3a2f28", { roughness: 0.85, side: THREE.DoubleSide }),
  glass: new THREE.MeshStandardMaterial({
    color: new THREE.Color(SCENE_COLOR.glass),
    transparent: true,
    opacity: 0.07,
    roughness: 0.1,
    metalness: 0.1,
    depthWrite: false,
  }),
  shadow: new THREE.MeshBasicMaterial({
    color: "#000000",
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  }),
} as const;

/**
 * One emissive material per state, shared by every object tinted by that
 * state. Nine materials total rather than one per workstation.
 */
const emissiveCache = new Map<string, THREE.MeshStandardMaterial>();

export function stateEmissive(state: AgentState, intensity = 1.1): THREE.MeshStandardMaterial {
  const key = `${state}:${intensity}`;
  let material = emissiveCache.get(key);
  if (!material) {
    const color = new THREE.Color(STATE_COLOR[state]);
    material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.4,
      toneMapped: false,
    });
    emissiveCache.set(key, material);
  }
  return material;
}

/** Additive sprite material used for cheap glow instead of a bloom pass. */
const glowCache = new Map<string, THREE.SpriteMaterial>();

export function stateGlow(state: AgentState, opacity: number): THREE.SpriteMaterial {
  const key = `${state}:${opacity}`;
  let material = glowCache.get(key);
  if (!material) {
    material = new THREE.SpriteMaterial({
      map: radialTexture(),
      color: new THREE.Color(STATE_COLOR[state]),
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    glowCache.set(key, material);
  }
  return material;
}

let radial: THREE.Texture | null = null;

/** A soft radial falloff, generated once and reused by every glow sprite. */
function radialTexture(): THREE.Texture {
  if (radial) return radial;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.35)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  radial = new THREE.CanvasTexture(canvas);
  radial.colorSpace = THREE.SRGBColorSpace;
  return radial;
}

/** Test/teardown helper. Not used in the running app. */
export function disposeSharedResources(): void {
  for (const geometry of Object.values(GEO)) geometry.dispose();
  for (const material of Object.values(MAT)) material.dispose();
  for (const material of emissiveCache.values()) material.dispose();
  for (const material of glowCache.values()) material.dispose();
  for (const material of floorGlowCache.values()) material.dispose();
  emissiveCache.clear();
  glowCache.clear();
  floorGlowCache.clear();
  radial?.dispose();
  radial = null;
}

const floorGlowCache = new Map<string, THREE.MeshBasicMaterial>();

/**
 * The floor pool under a workstation. A mesh material rather than a sprite,
 * because it lies flat on the ground instead of facing the camera.
 */
export function stateFloorGlow(state: AgentState, opacity: number): THREE.MeshBasicMaterial {
  const key = `${state}:${opacity}`;
  let material = floorGlowCache.get(key);
  if (!material) {
    material = new THREE.MeshBasicMaterial({
      map: radialTexture(),
      color: new THREE.Color(STATE_COLOR[state]),
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    floorGlowCache.set(key, material);
  }
  return material;
}

let halo: THREE.SpriteMaterial | null = null;

/** The warm halo shared by every lamp in the room. */
export function lampHalo(): THREE.SpriteMaterial {
  halo ??= new THREE.SpriteMaterial({
    map: radialTexture(),
    color: new THREE.Color(SCENE_COLOR.lampWarm),
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  return halo;
}

/**
 * The visor lens colour.
 *
 * A cyan visor is the character's identity, so an idle robot keeps it — dimmed
 * — rather than going the warm grey the idle accent uses everywhere else. A
 * grey-faced robot reads as switched off, not as resting.
 */
export function visorMaterial(state: AgentState): THREE.MeshStandardMaterial {
  if (state === "idle") return stateEmissive("reading", 0.55);
  return stateEmissive(state, 1.9);
}

/**
 * Which scene colour drives which shared material.
 *
 * Re-skinning mutates these in place rather than rebuilding them: the whole
 * office shares this handful of materials, so one pass over this table
 * re-colours every desk, wall and plant at once with no new GPU resources and
 * no React re-render.
 */
const SKIN: Array<[keyof typeof MAT, keyof SceneColors]> = [
  ["floor", "floor"],
  ["floorSheen", "floorSheen"],
  ["wall", "wall"],
  ["deskTop", "deskTop"],
  ["deskLeg", "deskLeg"],
  ["metal", "metal"],
  ["seat", "seat"],
  ["fabric", "fabric"],
  ["dark", "dark"],
  ["screenOff", "screenOff"],
  ["clay", "clay"],
  ["clayDark", "clayDark"],
  ["clayLight", "clayLight"],
  ["leaf", "leaf"],
  ["leafDark", "leafDark"],
  ["pot", "pot"],
  ["crate", "crate"],
  ["paper", "paper"],
  ["rug", "rug"],
  ["rugAlt", "rugAlt"],
  ["divider", "divider"],
  ["glass", "glass"],
  ["warmGlow", "lampWarm"],
  ["windowGlow", "window"],
];

let currentVibe: Vibe = VIBES[DEFAULT_VIBE];

export function applyVibe(vibe: Vibe): void {
  currentVibe = vibe;
  for (const [materialKey, colorKey] of SKIN) {
    const material = MAT[materialKey] as THREE.Material & { color?: THREE.Color };
    material.color?.set(vibe.scene[colorKey]);
  }
  halo?.color.set(vibe.scene.lampWarm);
  // A bright room needs darker contact shadows to read at all; a dark one
  // needs them lifted or objects look glued to the floor.
  const bright = vibe.id === "studio" || vibe.id === "atrium";
  MAT.shadow.opacity = bright ? 0.16 : 0.32;
  MAT.glass.opacity = bright ? 0.2 : 0.1;
}

export function activeVibe(): Vibe {
  return currentVibe;
}
