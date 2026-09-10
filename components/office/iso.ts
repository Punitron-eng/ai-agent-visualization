/**
 * Isometric projection for the office diorama.
 *
 * A classic 2:1 isometric: one world unit is TILE wide and TILE/2 tall on
 * screen, and height (z) lifts straight up. Everything in the office is
 * authored in world units so furniture, robots and zones stay in proportion no
 * matter how the scene is scaled.
 */

export const TILE = 56;
export const HALF_W = TILE / 2;
export const HALF_H = TILE / 4;
/** Screen pixels per unit of height. */
export const Z_UNIT = TILE / 2;

export interface Vec3 {
  x: number;
  y: number;
  z?: number;
}

export interface Point {
  sx: number;
  sy: number;
}

export function project(x: number, y: number, z = 0): Point {
  return {
    sx: (x - y) * HALF_W,
    sy: (x + y) * HALF_H - z * Z_UNIT,
  };
}

export function pointString(x: number, y: number, z = 0): string {
  const { sx, sy } = project(x, y, z);
  return `${round(sx)},${round(sy)}`;
}

export function polygon(points: Vec3[]): string {
  return points.map((p) => pointString(p.x, p.y, p.z ?? 0)).join(" ");
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Painter's-algorithm sort key. Larger draws later (in front). Ties are broken
 * by height so something standing on a surface never sinks into it.
 */
export function depthKey(x: number, y: number, z = 0, w = 0, d = 0): number {
  return (x + w / 2 + (y + d / 2)) * 1000 + z;
}

export interface Placed<T> {
  key: string;
  depth: number;
  value: T;
}

export function sortByDepth<T>(items: Placed<T>[]): Placed<T>[] {
  return [...items].sort((a, b) => a.depth - b.depth);
}

/** Face shading: one light source, so every box reads the same way. */
export const SHADE = {
  top: 1,
  left: 0.62,
  right: 0.8,
} as const;

/**
 * Multiplies an #rrggbb colour by a factor. Faces are shaded from a single base
 * colour so the whole diorama stays lit consistently.
 */
export function shade(hex: string, factor: number): string {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  const r = clamp(Math.round(parseInt(full.slice(0, 2), 16) * factor));
  const g = clamp(Math.round(parseInt(full.slice(2, 4), 16) * factor));
  const b = clamp(Math.round(parseInt(full.slice(4, 6), 16) * factor));
  return `rgb(${r},${g},${b})`;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, value));
}

/** Bounding box of the whole floor plan, used to size the SVG viewBox. */
export function planBounds(width: number, depth: number, height: number) {
  const corners = [
    project(0, 0, height),
    project(width, 0, height),
    project(0, depth, height),
    project(width, depth, 0),
    project(0, 0, 0),
    project(width, depth, height),
  ];
  const xs = corners.map((c) => c.sx);
  const ys = corners.map((c) => c.sy);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}
