"use client";

import { memo, type ReactNode } from "react";
import { polygon, project, shade, SHADE } from "@/components/office/iso";

/**
 * The three shapes the whole office is built from. Keeping the vocabulary this
 * small is what makes a diorama of this size maintainable — and it means a
 * single lighting change re-lights every object at once.
 */

export interface IsoBoxProps {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  color: string;
  /** Overrides the shaded top, e.g. a glowing desk surface. */
  topColor?: string;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
}

function IsoBoxImpl({
  x,
  y,
  z = 0,
  w,
  d,
  h,
  color,
  topColor,
  opacity = 1,
  stroke,
  strokeWidth = 0.75,
}: IsoBoxProps) {
  const top = z + h;
  return (
    <g opacity={opacity}>
      {/* Left face (−x side, toward the viewer's left) */}
      <polygon
        points={polygon([
          { x, y, z: top },
          { x, y: y + d, z: top },
          { x, y: y + d, z },
          { x, y, z },
        ])}
        fill={shade(color, SHADE.left)}
        stroke={stroke}
        strokeWidth={stroke ? strokeWidth : undefined}
      />
      {/* Right face */}
      <polygon
        points={polygon([
          { x, y: y + d, z: top },
          { x: x + w, y: y + d, z: top },
          { x: x + w, y: y + d, z },
          { x, y: y + d, z },
        ])}
        fill={shade(color, SHADE.right)}
        stroke={stroke}
        strokeWidth={stroke ? strokeWidth : undefined}
      />
      {/* Top face */}
      <polygon
        points={polygon([
          { x, y, z: top },
          { x: x + w, y, z: top },
          { x: x + w, y: y + d, z: top },
          { x, y: y + d, z: top },
        ])}
        fill={topColor ?? shade(color, SHADE.top)}
        stroke={stroke}
        strokeWidth={stroke ? strokeWidth : undefined}
      />
    </g>
  );
}

export const IsoBox = memo(IsoBoxImpl);

export interface IsoPlaneProps {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  fill: string;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
}

/** A flat quad on the ground: floor slabs, rugs, light pools. */
function IsoPlaneImpl({
  x,
  y,
  z = 0,
  w,
  d,
  fill,
  opacity = 1,
  stroke,
  strokeWidth = 0.75,
}: IsoPlaneProps) {
  return (
    <polygon
      points={polygon([
        { x, y, z },
        { x: x + w, y, z },
        { x: x + w, y: y + d, z },
        { x, y: y + d, z },
      ])}
      fill={fill}
      opacity={opacity}
      stroke={stroke}
      strokeWidth={stroke ? strokeWidth : undefined}
    />
  );
}

export const IsoPlane = memo(IsoPlaneImpl);

/** Soft contact shadow so objects sit on the floor instead of hovering. */
export function IsoShadow({
  x,
  y,
  w,
  d,
  opacity = 0.4,
}: {
  x: number;
  y: number;
  w: number;
  d: number;
  opacity?: number;
}) {
  const c = project(x + w / 2, y + d / 2, 0);
  return (
    <ellipse
      cx={c.sx}
      cy={c.sy}
      rx={(w + d) * 12}
      ry={(w + d) * 6}
      fill="#000"
      opacity={opacity}
      style={{ filter: "blur(6px)" }}
    />
  );
}

/** Anchors HTML (a HUD label) to a world position. */
export function useAnchor(x: number, y: number, z = 0) {
  return project(x, y, z);
}

export function IsoGroup({ children }: { children: ReactNode }) {
  return <g>{children}</g>;
}
