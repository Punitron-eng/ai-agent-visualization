"use client";

import { memo } from "react";
import { OGEO, OMAT } from "@/materials/officeMaterials";

/**
 * The collaboration room's table: one long rectangular top on slim dark legs.
 *
 * A white worktop over a warm timber band, which is the same pairing the rest
 * of the fit-out uses — the benches downstairs, the counter in the chill room
 * — so the room reads as part of the office rather than an import. Four people
 * fit comfortably: two a side, nobody on the ends.
 */
export const CollaborationTable = memo(function CollaborationTable({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  const height = 0.74;
  // Legs are set in from the corners, the way a good table is: the end seats
  // stay clear and the frame reads lighter than the top it carries.
  const legs: Array<[number, number]> = [
    [-0.92, -0.4],
    [0.92, -0.4],
    [-0.92, 0.4],
    [0.92, 0.4],
  ];

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={OGEO.collabTop} material={OMAT.white} position={[0, height, 0]} />
      {/* The warm band under the top — the only wood on the table, and what
          keeps it from reading as a white slab. */}
      <mesh geometry={OGEO.collabBand} material={OMAT.timber} position={[0, height - 0.045, 0]} />

      {legs.map(([x, z]) => (
        <mesh
          key={`${x}:${z}`}
          geometry={OGEO.collabLeg}
          material={OMAT.frame}
          position={[x, (height - 0.07) / 2, z]}
        />
      ))}
      {/* A stretcher each side, tying the legs together under the top. */}
      {[-0.4, 0.4].map((z) => (
        <mesh
          key={z}
          geometry={OGEO.collabRail}
          material={OMAT.frame}
          position={[0, height - 0.22, z]}
        />
      ))}

      <mesh
        geometry={OGEO.plane}
        material={OMAT.shadow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.018, 0]}
        scale={[2.35, 1.3, 1]}
      />
    </group>
  );
});
