"use client";

import { memo } from "react";
import type { OfficePlan } from "@/components/office/layout";
import { cityBlocks } from "@/config/officeLayout";
import { OGEO, OMAT } from "@/materials/officeMaterials";

/**
 * What you see through the glass: a skyline, kept deliberately dumb.
 *
 * Two backdrop planes for sky and a band of boxes for buildings, all sharing
 * two materials. Distant blocks use a paler material so the skyline has depth
 * without a fog pass or a second light. This is scenery — it must never cost
 * more than the room it frames.
 */

export interface CityViewProps {
  plan: OfficePlan;
}

function CityViewImpl({ plan }: CityViewProps) {
  const blocks = cityBlocks(plan);

  return (
    <group>
      {/* Sky backdrops, one behind each glazed elevation. */}
      <mesh
        geometry={OGEO.plane}
        material={OMAT.sky}
        position={[plan.width / 2, 14, -42]}
        scale={[120, 60, 1]}
      />
      <mesh
        geometry={OGEO.plane}
        material={OMAT.sky}
        rotation={[0, -Math.PI / 2, 0]}
        position={[plan.width + 42, 14, plan.depth / 2]}
        scale={[120, 60, 1]}
      />

      {blocks.map((block, index) => (
        <mesh
          key={index}
          geometry={OGEO.unitBox}
          material={block.far ? OMAT.cityFar : OMAT.city}
          position={[block.x, block.height / 2 - 1.4, block.z]}
          scale={[block.width, block.height, block.depth]}
        />
      ))}
    </group>
  );
}

export const CityView = memo(CityViewImpl);
