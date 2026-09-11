"use client";

import { memo } from "react";
import { Html } from "@react-three/drei";
import { OGEO, OMAT } from "@/materials/officeMaterials";

/** Small dressing shared by the three rooms of the social wing. */

/** A round meeting table on a disc foot. */
export const RoundTable = memo(function RoundTable({
  position,
  radius = 1,
}: {
  position: [number, number, number];
  radius?: number;
}) {
  const s = radius / 0.9;
  return (
    <group position={position}>
      <mesh geometry={OGEO.roundTop} material={OMAT.white} position={[0, 0.72, 0]} scale={[s, 1, s * 0.82]} />
      <mesh geometry={OGEO.roundStem} material={OMAT.metal} position={[0, 0.36, 0]} />
      <mesh geometry={OGEO.roundFoot} material={OMAT.charcoal} position={[0, 0.02, 0]} />
      <mesh
        geometry={OGEO.circle}
        material={OMAT.shadow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        scale={radius * 2.1}
      />
    </group>
  );
});

/** A potted plant. `scale` covers everything from desk pot to corner tree. */
export const PottedPlant = memo(function PottedPlant({
  position,
  scale = 1,
  tall = true,
}: {
  position: [number, number, number];
  scale?: number;
  tall?: boolean;
}) {
  const leaves = tall ? 6 : 4;
  return (
    <group position={position} scale={scale}>
      <mesh geometry={tall ? OGEO.potTall : OGEO.potSmall} material={OMAT.pot} position={[0, tall ? 0.17 : 0.075, 0]} />
      <mesh geometry={OGEO.soil} material={OMAT.soil} position={[0, tall ? 0.34 : 0.15, 0]} scale={tall ? 1 : 0.55} />
      {Array.from({ length: leaves }).map((_, index) => {
        const angle = (index / leaves) * Math.PI * 2;
        const lean = tall ? 0.34 : 0.16;
        const height = tall ? 0.62 : 0.28;
        return (
          <mesh
            key={index}
            geometry={OGEO.leafBlade}
            material={index % 2 === 0 ? OMAT.leaf : OMAT.leafDeep}
            position={[Math.sin(angle) * lean, height, Math.cos(angle) * lean]}
            scale={tall ? [1, 1.5, 1] : [0.6, 0.85, 0.6]}
          />
        );
      })}
    </group>
  );
});

/**
 * A wall-mounted whiteboard. The text is HTML held flat against the board, so
 * it stays crisp at any zoom and costs no font loading.
 */
export const Whiteboard = memo(function Whiteboard({
  position,
  rotation = 0,
  text,
}: {
  position: [number, number, number];
  rotation?: number;
  text: string;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={OGEO.whiteboard} material={OMAT.board} />
      <mesh geometry={OGEO.whiteboardTray} material={OMAT.metal} position={[0, -0.56, 0.05]} />
      <Html
        transform
        position={[0, 0.08, 0.03]}
        distanceFactor={3.2}
        zIndexRange={[8, 0]}
        style={{ pointerEvents: "none" }}
      >
        <span className="whitespace-nowrap text-[13px] font-semibold tracking-[0.08em] text-[#2b3138]">
          {text}
        </span>
      </Html>
    </group>
  );
});

/** A low storage cabinet, oak-topped. */
export const SideCabinet = memo(function SideCabinet({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={OGEO.cabinet} material={OMAT.white} position={[0, 0.35, 0]} />
      <mesh geometry={OGEO.counterTop} material={OMAT.wood} position={[0, 0.72, 0]} scale={[1.28, 1, 0.66]} />
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} geometry={OGEO.cabinetDoor} material={OMAT.offWhite} position={[x, 0.35, 0.215]} />
      ))}
    </group>
  );
});
