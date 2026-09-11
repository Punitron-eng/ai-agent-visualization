"use client";

import { memo } from "react";
import { OGEO, OMAT } from "@/materials/officeMaterials";

/**
 * A black ergonomic task chair.
 *
 * Every mesh points at the shared pool in `materials/officeMaterials`, so a
 * floor of forty chairs is still one seat geometry and one dark material. The
 * backrest sits at -z, behind an occupant facing +z, which is what keeps a
 * seated robot in front of its chair rather than through it.
 */
export const TaskChair = memo(function TaskChair({
  position,
  rotation = 0,
  scale = 1,
}: {
  position: [number, number, number];
  rotation?: number;
  scale?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Five-star base, drawn as a disc with castors — cheaper than five arms
          and indistinguishable at architectural distance. */}
      <mesh geometry={OGEO.chairBase} material={OMAT.charcoal} position={[0, 0.03, 0]} />
      {[0, 1, 2, 3, 4].map((index) => {
        const angle = (index / 5) * Math.PI * 2;
        return (
          <mesh
            key={index}
            geometry={OGEO.castor}
            material={OMAT.charcoal}
            position={[Math.sin(angle) * 0.25, 0.035, Math.cos(angle) * 0.25]}
          />
        );
      })}
      <mesh geometry={OGEO.chairStar} material={OMAT.metal} position={[0, 0.22, 0]} />
      <mesh geometry={OGEO.taskSeat} material={OMAT.gray} position={[0, 0.43, 0]} />
      <mesh
        geometry={OGEO.taskBack}
        material={OMAT.gray}
        position={[0, 0.72, -0.21]}
        rotation={[-0.12, 0, 0]}
      />
      <mesh geometry={OGEO.taskArm} material={OMAT.charcoal} position={[-0.27, 0.58, -0.02]} />
      <mesh geometry={OGEO.taskArm} material={OMAT.charcoal} position={[0.27, 0.58, -0.02]} />
      <mesh
        geometry={OGEO.circle}
        material={OMAT.shadow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.004, 0]}
        scale={0.85}
      />
    </group>
  );
});
