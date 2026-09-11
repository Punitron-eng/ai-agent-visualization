"use client";

import { memo } from "react";
import type { OfficePlan } from "@/components/office/layout";
import { OGEO, OMAT } from "@/materials/officeMaterials";
import { SHELL } from "@/config/officeLayout";

/**
 * The floor plate: a thick slab that oversails the walls, exactly the way the
 * reference render presents the office as a model sitting on a table.
 *
 * Drawn as three boxes rather than a modelled plate — top surface, slab edge,
 * and the carpet inlays that separate one zone from the next — because a box
 * with a shared geometry costs nothing and the silhouette is all that matters
 * from an architectural camera.
 */

export interface OfficeFloorProps {
  plan: OfficePlan;
}

function OfficeFloorImpl({ plan }: OfficeFloorProps) {
  const over = SHELL.overhang;
  const width = plan.width + over * 2;
  const depth = plan.depth + over * 2;
  const cx = plan.width / 2;
  const cz = plan.depth / 2;

  return (
    <group>
      {/* Structural slab, seen from outside as the model's base. */}
      <mesh
        geometry={OGEO.unitBox}
        material={OMAT.gray}
        position={[cx, -SHELL.slab / 2, cz]}
        scale={[width, SHELL.slab, depth]}
      />

      {/* Finished floor. */}
      <mesh
        geometry={OGEO.plane}
        material={OMAT.floor}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[cx, 0.002, cz]}
        scale={[width, depth, 1]}
      />

      {/* Carpet tiles under the development floor, a shade warmer than the
          concrete so the desk area reads as its own room. */}
      <ZoneCarpet plan={plan} />

      {/* The entrance mat, by the deploy bay. */}
      <mesh
        geometry={OGEO.plane}
        material={OMAT.carpetDark}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[plan.zones.deploy.x + 2.4, 0.006, plan.depth - 0.75]}
        scale={[3.4, 1.2, 1]}
      />
    </group>
  );
}

function ZoneCarpet({ plan }: { plan: OfficePlan }) {
  const pods = plan.zones.pods;
  return (
    <>
      <mesh
        geometry={OGEO.plane}
        material={OMAT.carpet}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[pods.x + pods.w / 2, 0.004, pods.y + pods.d / 2]}
        scale={[pods.w + 0.6, pods.d + 0.9, 1]}
      />
      {(["planning", "meeting", "chill"] as const).map((key) => {
        const zone = plan.zones[key];
        return (
          <mesh
            key={key}
            geometry={OGEO.plane}
            material={OMAT.floorWarm}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[zone.x + zone.w / 2, 0.003, zone.y + zone.d / 2]}
            scale={[zone.w, zone.d, 1]}
          />
        );
      })}
    </>
  );
}

export const OfficeFloor = memo(OfficeFloorImpl);
