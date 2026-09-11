"use client";

import { memo } from "react";
import { runCenters, type OfficePlan } from "@/components/office/layout";
import { ceilingLights, SHELL } from "@/config/officeLayout";
import { OGEO, OMAT } from "@/materials/officeMaterials";

/**
 * Linear pendants over the desks and a spill disc under each one.
 *
 * These are geometry, not lights: the scene's real light budget is three
 * directional/hemisphere sources plus a couple of point lamps, and adding a
 * dozen more would cost a shader recompile and a per-fragment loop for no
 * visible gain. An emissive tube plus an unlit disc on the ceiling plane reads
 * identically from an architectural camera.
 */

export interface CeilingLightsProps {
  plan: OfficePlan;
  deskCount: number;
}

function CeilingLightsImpl({ plan, deskCount }: CeilingLightsProps) {
  const runs = ceilingLights(
    plan,
    runCenters(deskCount).filter((x) => x < plan.width - 0.8),
  );

  return (
    <group>
      {runs.map(([x, z, rotation], index) => (
        <group key={index} position={[x, SHELL.height - 0.28, z]} rotation={[0, rotation, 0]}>
          <mesh geometry={OGEO.cord} material={OMAT.charcoal} position={[0, 0.3, 0]} scale={[1, 0.5, 1]} />
          <mesh geometry={OGEO.unitBox} material={OMAT.white} scale={[2.2, 0.07, 0.16]} />
          <mesh
            geometry={OGEO.tubeLight}
            material={OMAT.lightTube}
            position={[0, -0.045, 0]}
            scale={[0.98, 1, 0.8]}
          />
        </group>
      ))}
    </group>
  );
}

export const CeilingLights = memo(CeilingLightsImpl);
