import { polygon } from "@/components/office/iso";

/**
 * Helpers for drawing on the camera-facing plane of a box (its +y side).
 *
 * Screen content is authored in flat 0..1 UV space and projected onto that
 * plane, so a monitor's interface can be laid out like a normal rectangle and
 * still land correctly in the isometric scene.
 */

export interface ScreenFace {
  /** Left/right bounds in world x. */
  x0: number;
  x1: number;
  /** The plane's y. */
  y: number;
  /** Bottom/top bounds in world z. */
  z0: number;
  z1: number;
}

export function facePoly(x0: number, x1: number, y: number, z0: number, z1: number): string {
  return polygon([
    { x: x0, y, z: z1 },
    { x: x1, y, z: z1 },
    { x: x1, y, z: z0 },
    { x: x0, y, z: z0 },
  ]);
}

/**
 * Maps a rectangle in screen UV space (u across, v down from the top) onto the
 * face. Depth is nudged forward so content never z-fights the panel behind it.
 */
export function uvRect(
  face: ScreenFace,
  u0: number,
  v0: number,
  u1: number,
  v1: number,
  depth = 0.002,
): string {
  const w = face.x1 - face.x0;
  const h = face.z1 - face.z0;
  return facePoly(
    face.x0 + u0 * w,
    face.x0 + u1 * w,
    face.y + depth,
    face.z1 - v1 * h,
    face.z1 - v0 * h,
  );
}
