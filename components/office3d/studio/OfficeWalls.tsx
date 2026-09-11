"use client";

import { memo } from "react";
import type { OfficePlan } from "@/components/office/layout";
import { OGEO, OMAT } from "@/materials/officeMaterials";
import { SHELL } from "@/config/officeLayout";

/**
 * The perimeter shell: three walls and no ceiling.
 *
 * The front of the room is deliberately open — this is a dollhouse view, and a
 * closed fourth wall would either hide the office or have to be faded per
 * frame. The back wall is built as two bands with a gap between them, which is
 * what leaves room for the ribbon window; the right-hand wall is little more
 * than a frame around full-height glazing.
 */

export interface OfficeWallsProps {
  plan: OfficePlan;
}

function OfficeWallsImpl({ plan }: OfficeWallsProps) {
  const t = SHELL.wallThickness;
  const h = SHELL.height;
  const { sill, head } = SHELL.ribbon;

  return (
    <group>
      {/* ── Back wall (z = 0), split around the ribbon window ─────────── */}
      <Wall x={plan.width / 2} z={-t / 2} w={plan.width + t * 2} h={sill} d={t} y={sill / 2} />
      <Wall
        x={plan.width / 2}
        z={-t / 2}
        w={plan.width + t * 2}
        h={h - head}
        d={t}
        y={head + (h - head) / 2}
      />
      {/* Solid returns at each end of the ribbon, so the glazing reads as a
          band set into the wall rather than a hole cut to the corners. */}
      <Wall x={1.35} z={-t / 2} w={2.7} h={head - sill} d={t} y={(sill + head) / 2} />
      <Wall
        x={plan.width - 1.9}
        z={-t / 2}
        w={3.8}
        h={head - sill}
        d={t}
        y={(sill + head) / 2}
      />

      {/* ── Left wall (x = 0): solid, the branding wall ────────────────── */}
      <Wall x={-t / 2} z={plan.depth / 2} w={t} h={h} d={plan.depth + t} y={h / 2} />
      {/* A wood-panelled section behind reception, as in the reference. */}
      <mesh
        geometry={OGEO.unitBox}
        material={OMAT.wood}
        position={[0.02, h / 2 - 0.2, plan.depth - 3.2]}
        scale={[0.06, h - 0.4, 4.2]}
      />

      {/* ── Right wall (x = width): frame only; Windows fills the rest ── */}
      <Wall x={plan.width + t / 2} z={plan.depth / 2} w={t} h={0.35} d={plan.depth + t} y={0.175} />
      <Wall
        x={plan.width + t / 2}
        z={plan.depth / 2}
        w={t}
        h={h - SHELL.curtain.head}
        d={plan.depth + t}
        y={SHELL.curtain.head + (h - SHELL.curtain.head) / 2}
      />

      {/* ── Soffit: a shallow band around the top of every wall. It catches
          the key light and gives the shell a machined edge from above. ── */}
      <Soffit plan={plan} />

      {/* Skirting, the detail that stops walls from floating. */}
      <Skirting plan={plan} />
    </group>
  );
}

function Wall({
  x,
  y,
  z,
  w,
  h,
  d,
  warm = false,
}: {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  warm?: boolean;
}) {
  return (
    <mesh
      geometry={OGEO.unitBox}
      material={warm ? OMAT.wallWarm : OMAT.wall}
      position={[x, y, z]}
      scale={[w, h, d]}
    />
  );
}

function Soffit({ plan }: { plan: OfficePlan }) {
  const y = SHELL.height + 0.09;
  return (
    <group>
      <mesh
        geometry={OGEO.unitBox}
        material={OMAT.wallWarm}
        position={[plan.width / 2, y, -0.16]}
        scale={[plan.width + 0.9, 0.18, 0.42]}
      />
      <mesh
        geometry={OGEO.unitBox}
        material={OMAT.wallWarm}
        position={[-0.16, y, plan.depth / 2]}
        scale={[0.42, 0.18, plan.depth + 0.6]}
      />
      <mesh
        geometry={OGEO.unitBox}
        material={OMAT.wallWarm}
        position={[plan.width + 0.16, y, plan.depth / 2]}
        scale={[0.42, 0.18, plan.depth + 0.6]}
      />
    </group>
  );
}

function Skirting({ plan }: { plan: OfficePlan }) {
  return (
    <group>
      <mesh
        geometry={OGEO.unitBox}
        material={OMAT.offWhite}
        position={[plan.width / 2, 0.05, 0.045]}
        scale={[plan.width, 0.1, 0.05]}
      />
      <mesh
        geometry={OGEO.unitBox}
        material={OMAT.offWhite}
        position={[0.045, 0.05, plan.depth / 2]}
        scale={[0.05, 0.1, plan.depth]}
      />
    </group>
  );
}

export const OfficeWalls = memo(OfficeWallsImpl);
