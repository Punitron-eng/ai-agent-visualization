"use client";

import { memo } from "react";
import type { OfficePlan } from "@/components/office/layout";
import { OGEO, OMAT } from "@/materials/officeMaterials";
import { SHELL } from "@/config/officeLayout";

/**
 * Glazing: a ribbon window along the back wall and a full-height curtain wall
 * on the right, both built the same way — one glass pane plus a set of dark
 * mullions generated from a pitch, never hand-placed.
 *
 * The glass does not write depth, so the city outside and the planting on the
 * sill both read through it without any sorting work per frame.
 */

export interface WindowsProps {
  plan: OfficePlan;
}

function WindowsImpl({ plan }: WindowsProps) {
  const { sill, head } = SHELL.ribbon;
  const ribbonWidth = plan.width - 5.4;
  const ribbonX = 1.35 + 1.35 + ribbonWidth / 2 - 1.35;

  return (
    <group>
      {/* ── Back ribbon ─────────────────────────────────────────────── */}
      <Glazing
        center={[ribbonX, (sill + head) / 2, 0.02]}
        width={ribbonWidth}
        height={head - sill}
        vertical
        pitch={1.5}
      />
      {/* Sill, and the planting trough that sits on it. */}
      <mesh
        geometry={OGEO.unitBox}
        material={OMAT.offWhite}
        position={[ribbonX, sill - 0.04, 0.14]}
        scale={[ribbonWidth, 0.08, 0.32]}
      />
      <SillPlanting x={ribbonX} width={ribbonWidth} y={sill + 0.14} z={0.2} />

      {/* ── Right-hand curtain wall ─────────────────────────────────── */}
      <Glazing
        center={[plan.width - 0.02, (SHELL.curtain.sill + SHELL.curtain.head) / 2, plan.depth / 2]}
        width={plan.depth - 0.4}
        height={SHELL.curtain.head - SHELL.curtain.sill}
        vertical
        pitch={1.7}
        facing="x"
      />
    </group>
  );
}

/**
 * One glazed opening: a single pane with vertical mullions at a fixed pitch,
 * and a frame around the outside.
 */
function Glazing({
  center,
  width,
  height,
  pitch,
  facing = "z",
}: {
  center: [number, number, number];
  width: number;
  height: number;
  vertical?: boolean;
  pitch: number;
  facing?: "x" | "z";
}) {
  const bays = Math.max(1, Math.round(width / pitch));
  const step = width / bays;
  const rotation: [number, number, number] = facing === "z" ? [0, 0, 0] : [0, Math.PI / 2, 0];

  return (
    <group position={center} rotation={rotation}>
      <mesh geometry={OGEO.plane} material={OMAT.windowGlass} scale={[width, height, 1]} />

      {/* Head and sill rails. */}
      <mesh
        geometry={OGEO.unitBox}
        material={OMAT.charcoal}
        position={[0, height / 2, 0]}
        scale={[width + 0.12, 0.09, 0.09]}
      />
      <mesh
        geometry={OGEO.unitBox}
        material={OMAT.charcoal}
        position={[0, -height / 2, 0]}
        scale={[width + 0.12, 0.09, 0.09]}
      />

      {/* Mullions: bays - 1 interior posts, plus the two jambs. */}
      {Array.from({ length: bays + 1 }, (_, index) => (
        <mesh
          key={index}
          geometry={OGEO.mullion}
          material={OMAT.charcoal}
          position={[-width / 2 + index * step, 0, 0]}
          scale={[1, height, 1]}
        />
      ))}
    </group>
  );
}

/** The run of planting along the window sill, straight from the reference. */
function SillPlanting({
  x,
  width,
  y,
  z,
}: {
  x: number;
  width: number;
  y: number;
  z: number;
}) {
  const count = Math.max(2, Math.round(width / 2.4));
  const step = width / count;
  return (
    <group>
      {Array.from({ length: count }, (_, index) => {
        const cx = x - width / 2 + step * (index + 0.5);
        return (
          <group key={index} position={[cx, y, z]}>
            <mesh geometry={OGEO.unitBox} material={OMAT.white} scale={[step - 0.12, 0.2, 0.28]} />
            <mesh
              geometry={OGEO.hedge}
              material={OMAT.leaf}
              position={[0, 0.17, 0]}
              scale={[(step - 0.2) / 2.3, 1, 0.85]}
            />
            <mesh
              geometry={OGEO.leafBlade}
              material={OMAT.leafDeep}
              position={[step * 0.22, 0.24, 0.02]}
              scale={[1.1, 0.8, 1.1]}
            />
            <mesh
              geometry={OGEO.leafBlade}
              material={OMAT.leaf}
              position={[-step * 0.24, 0.22, 0.03]}
              scale={[0.9, 0.7, 0.9]}
            />
          </group>
        );
      })}
    </group>
  );
}

export const Windows = memo(WindowsImpl);
