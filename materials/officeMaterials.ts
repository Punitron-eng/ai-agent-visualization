import * as THREE from "three";

/**
 * The premium-studio palette: one shared geometry pool and one shared material
 * pool for the whole architectural shell and its furniture.
 *
 * Same discipline as `components/office3d/resources.ts` — every repeated object
 * in the office points at the objects below, so a room with forty chairs is
 * still a couple of dozen GPU resources. Nothing here is ever disposed while
 * the page lives; `disposeOfficeResources` exists for tests.
 */

export const PALETTE = {
  /** Warm light concrete. */
  floor: "#d8d4cd",
  floorWarm: "#cfc9c0",
  carpet: "#c9c4bb",
  carpetDark: "#b9b3a9",
  /** Walls: white, with a slightly warmer shadow tone for returns and soffits. */
  wall: "#f2efea",
  wallWarm: "#e6e1d9",
  wallDark: "#2f3336",
  /** Natural oak. */
  wood: "#c8a077",
  woodDark: "#a8834f",
  /** Furniture. */
  white: "#f7f5f2",
  offWhite: "#e9e5df",
  grayDark: "#3b4045",
  charcoal: "#22262a",
  metal: "#8f9599",
  /** Brand accent. */
  blue: "#2f6fe0",
  blueDeep: "#1b4fb0",
  blueSoft: "#7fa8f0",
  /** Greenery. */
  leaf: "#4f9a63",
  leafDeep: "#3a7a4c",
  pot: "#efece6",
  /** Glass + screens. */
  glass: "#cfe3ef",
  screenOff: "#1a1d21",
  sky: "#cfe2f2",
  city: "#aebdc9",
  cityFar: "#c3d0da",
} as const;

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt: number, rb: number, h: number, seg = 12) =>
  new THREE.CylinderGeometry(rt, rb, h, seg);

/** Geometry shared by every instance of a given prop. */
export const OGEO = {
  unitBox: box(1, 1, 1),
  plane: new THREE.PlaneGeometry(1, 1),
  circle: new THREE.CircleGeometry(0.5, 24),
  ring: new THREE.RingGeometry(0.46, 0.5, 32),

  // Architecture
  slabEdge: box(1, 0.34, 1),
  mullion: box(0.05, 1, 0.05),
  trim: box(1, 0.07, 0.06),

  // Desking
  benchTop: box(2.7, 0.055, 1.5),
  benchRail: box(2.66, 0.16, 0.08),
  benchLeg: box(0.07, 0.72, 0.62),
  planterBox: box(2.4, 0.22, 0.34),
  privacyPanel: box(2.4, 0.42, 0.03),
  drawer: box(0.42, 0.58, 0.5),

  // Seating
  taskSeat: box(0.52, 0.08, 0.5),
  taskBack: box(0.48, 0.56, 0.07),
  taskArm: box(0.06, 0.05, 0.34),
  chairStar: cyl(0.03, 0.03, 0.34, 8),
  chairBase: cyl(0.26, 0.24, 0.035, 12),
  castor: new THREE.SphereGeometry(0.035, 8, 6),
  loungeShell: new THREE.SphereGeometry(0.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
  loungeSeat: cyl(0.44, 0.4, 0.2, 16),
  sofaBase: box(2.2, 0.3, 0.85),
  sofaBack: box(2.2, 0.52, 0.16),
  sofaArm: box(0.16, 0.34, 0.85),

  // Tables
  roundTop: cyl(0.9, 0.9, 0.06, 28),
  roundStem: cyl(0.07, 0.09, 0.68, 10),
  roundFoot: cyl(0.42, 0.44, 0.04, 16),
  coffeeTop: cyl(0.42, 0.42, 0.05, 20),
  coffeeStem: cyl(0.05, 0.06, 0.36, 8),

  // Desk props
  monitorPanel: box(1.06, 0.62, 0.035),
  monitorScreen: new THREE.PlaneGeometry(0.98, 0.55),
  monitorNeck: box(0.07, 0.2, 0.07),
  monitorFoot: box(0.34, 0.02, 0.18),
  laptopBase: box(0.42, 0.022, 0.3),
  laptopLid: box(0.42, 0.28, 0.018),
  keyboard: box(0.5, 0.018, 0.18),
  mouse: box(0.07, 0.025, 0.11),
  mug: cyl(0.045, 0.038, 0.085, 12),
  book: box(0.19, 0.04, 0.26),
  lampArm: box(0.03, 0.42, 0.03),
  lampHead: new THREE.ConeGeometry(0.09, 0.12, 10, 1, true),

  // Kitchen / storage
  counter: box(1, 0.9, 0.62),
  counterTop: box(1, 0.06, 0.66),
  cabinetDoor: box(0.46, 0.62, 0.02),
  fridge: box(0.72, 1.72, 0.66),
  coffeeMachine: box(0.34, 0.4, 0.32),
  shelfBoard: box(1.6, 0.05, 0.3),

  // Server
  rackBody: box(0.68, 1.85, 0.78),
  rackVent: box(0.56, 0.022, 0.02),
  rackLed: box(0.05, 0.03, 0.02),

  // Greenery
  potTall: cyl(0.21, 0.16, 0.34, 14),
  potSmall: cyl(0.11, 0.09, 0.15, 12),
  soil: cyl(0.19, 0.19, 0.03, 14),
  stem: cyl(0.012, 0.016, 0.5, 5),
  leafBlade: new THREE.SphereGeometry(0.15, 8, 6),
  hedge: box(2.3, 0.26, 0.3),

  // Social wing: glazing, whiteboards, storage
  glassPane: new THREE.PlaneGeometry(1, 1),
  frameBar: box(1, 0.06, 0.06),
  doorHandle: cyl(0.015, 0.015, 0.28, 8),
  whiteboard: box(1.9, 1.05, 0.035),
  whiteboardTray: box(1.9, 0.04, 0.09),
  cabinet: box(1.25, 0.7, 0.42),
  bookshelf: box(0.95, 1.15, 0.3),
  rug: cyl(1, 1, 0.012, 28),

  // Collaboration room: rectangular table and the coding station on it
  collabTop: box(2.1, 0.05, 1.02),
  collabBand: box(2.02, 0.05, 0.94),
  collabLeg: box(0.05, 0.71, 0.05),
  collabRail: box(1.72, 0.04, 0.05),
  macBase: box(0.56, 0.016, 0.38),
  macLid: box(0.56, 0.355, 0.011),
  macDisplay: new THREE.PlaneGeometry(0.525, 0.325),
  macKeys: box(0.44, 0.005, 0.155),
  macPad: box(0.15, 0.004, 0.1),
  macFoot: box(0.5, 0.006, 0.3),

  // Carrom
  carromBed: box(0.78, 0.03, 0.78),
  carromFrame: box(0.96, 0.11, 0.09),
  carromLeg: box(0.09, 0.42, 0.09),
  carromApron: box(0.96, 0.1, 0.96),
  coin: cyl(0.026, 0.026, 0.008, 10),
  striker: cyl(0.034, 0.034, 0.009, 12),
  pocket: new THREE.CircleGeometry(0.05, 12),

  // Lighting
  tubeLight: box(2.2, 0.05, 0.12),
  discLight: new THREE.CircleGeometry(0.16, 16),
  pendantCone: new THREE.ConeGeometry(0.16, 0.2, 12, 1, true),
  cord: cyl(0.006, 0.006, 0.6, 5),
} as const;

const std = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.8, ...extra });

const basic = (color: string, extra: THREE.MeshBasicMaterialParameters = {}) =>
  new THREE.MeshBasicMaterial({ color: new THREE.Color(color), toneMapped: false, ...extra });

export const OMAT = {
  floor: std(PALETTE.floor, { roughness: 0.72, metalness: 0.02 }),
  floorWarm: std(PALETTE.floorWarm, { roughness: 0.78 }),
  carpet: std(PALETTE.carpet, { roughness: 1 }),
  carpetDark: std(PALETTE.carpetDark, { roughness: 1 }),
  wall: std(PALETTE.wall, { roughness: 0.95 }),
  wallWarm: std(PALETTE.wallWarm, { roughness: 0.95 }),
  wallDark: std(PALETTE.wallDark, { roughness: 0.85 }),
  wood: std(PALETTE.wood, { roughness: 0.72 }),
  woodDark: std(PALETTE.woodDark, { roughness: 0.72 }),
  white: std(PALETTE.white, { roughness: 0.6 }),
  offWhite: std(PALETTE.offWhite, { roughness: 0.8 }),
  gray: std(PALETTE.grayDark, { roughness: 0.7 }),
  charcoal: std(PALETTE.charcoal, { roughness: 0.6, metalness: 0.2 }),
  metal: std(PALETTE.metal, { roughness: 0.35, metalness: 0.7 }),
  blue: std(PALETTE.blue, { roughness: 0.65 }),
  blueDeep: std(PALETTE.blueDeep, { roughness: 0.6 }),
  fabricBlue: std(PALETTE.blue, { roughness: 1 }),
  leaf: std(PALETTE.leaf, { roughness: 0.95 }),
  leafDeep: std(PALETTE.leafDeep, { roughness: 0.95 }),
  pot: std(PALETTE.pot, { roughness: 0.85 }),
  soil: std("#4a3a2e", { roughness: 1 }),
  screenOff: std(PALETTE.screenOff, { roughness: 0.3, metalness: 0.1 }),

  /** Interior glazing: barely-there, never writes depth so it cannot occlude. */
  glass: new THREE.MeshStandardMaterial({
    color: new THREE.Color(PALETTE.glass),
    transparent: true,
    opacity: 0.12,
    roughness: 0.08,
    metalness: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  /** Window glazing, a touch brighter so the city reads through it. */
  windowGlass: new THREE.MeshStandardMaterial({
    color: new THREE.Color("#e8f4fb"),
    transparent: true,
    opacity: 0.18,
    roughness: 0.05,
    metalness: 0.1,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  /** Sky and city, unlit so they stay flat and recede. */
  sky: basic(PALETTE.sky),
  /**
   * The skyline is unlit on purpose. Lit boxes behind the back wall face away
   * from the key light and read as a black barricade through the glass; flat
   * colour gives the hazy, receding city the reference has, and costs nothing.
   */
  city: basic(PALETTE.city),
  cityFar: basic(PALETTE.cityFar),

  /** Warm timber for the carrom bed and the chill room's softer surfaces. */
  timber: std("#d8b183", { roughness: 0.65 }),
  playSurface: std("#8b5e34", { roughness: 0.5 }),
  coinWhite: std("#f4ead8", { roughness: 0.55 }),
  coinBlack: std("#2b2723", { roughness: 0.55 }),
  queenRed: std("#c0392b", { roughness: 0.5 }),
  board: std("#f8f7f4", { roughness: 0.4 }),
  beige: std("#ded3c2", { roughness: 0.95 }),
  rug: std("#cfc6b8", { roughness: 1 }),
  /** Anodised aluminium: the MacBook body in the collaboration room. */
  aluminium: std("#c3c8cc", { roughness: 0.28, metalness: 0.82 }),
  keycap: std("#17191c", { roughness: 0.85 }),
  /** Slim dark framing, shared by every glass partition in the social wing. */
  frame: std("#2a2e31", { roughness: 0.45, metalness: 0.55 }),
  warmGlow: basic("#ffd9a8"),

  lightTube: basic("#fff6e8"),
  blueGlow: basic("#4f8cff"),
  shadow: new THREE.MeshBasicMaterial({
    color: "#000000",
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
  }),
} as const;

export function disposeOfficeResources(): void {
  for (const geometry of Object.values(OGEO)) geometry.dispose();
  for (const material of Object.values(OMAT)) material.dispose();
}
