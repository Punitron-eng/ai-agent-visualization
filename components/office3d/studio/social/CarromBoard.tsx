"use client";

import { memo } from "react";
import { Html } from "@react-three/drei";
import { OGEO, OMAT } from "@/materials/officeMaterials";

/**
 * A carrom board on its own low stand: timber frame, dark polished bed, four
 * corner pockets, a ring of coins around the red queen, and a striker parked
 * on the near baseline.
 *
 * Height of play is 0.55 m, which is what puts a standing robot's hands at the
 * right place when it leans in to take a shot.
 */

/** Top surface of the bed, in metres. */
export const CARROM_HEIGHT = 0.55;

const HALF = 0.39;

export const CarromBoard = memo(function CarromBoard({
  position,
  hovered,
  onHover,
}: {
  position: [number, number, number];
  hovered: boolean;
  onHover(hovered: boolean): void;
}) {
  return (
    <group
      position={position}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(true);
      }}
      onPointerOut={() => onHover(false)}
    >
      {/* Stand */}
      {[
        [-0.42, -0.42],
        [0.42, -0.42],
        [-0.42, 0.42],
        [0.42, 0.42],
      ].map(([x, z]) => (
        <mesh key={`${x}:${z}`} geometry={OGEO.carromLeg} material={OMAT.woodDark} position={[x, 0.21, z]} />
      ))}
      <mesh geometry={OGEO.carromApron} material={OMAT.woodDark} position={[0, 0.47, 0]} />

      {/* Bed and frame */}
      <mesh geometry={OGEO.carromBed} material={OMAT.playSurface} position={[0, CARROM_HEIGHT, 0]} />
      {[
        { p: [0, CARROM_HEIGHT - 0.02, -HALF] as const, r: 0 },
        { p: [0, CARROM_HEIGHT - 0.02, HALF] as const, r: 0 },
        { p: [-HALF, CARROM_HEIGHT - 0.02, 0] as const, r: Math.PI / 2 },
        { p: [HALF, CARROM_HEIGHT - 0.02, 0] as const, r: Math.PI / 2 },
      ].map((bar, index) => (
        <mesh
          key={index}
          geometry={OGEO.carromFrame}
          material={OMAT.timber}
          position={[bar.p[0], bar.p[1], bar.p[2]]}
          rotation={[0, bar.r, 0]}
        />
      ))}

      {/* Four corner pockets. */}
      {[
        [-0.3, -0.3],
        [0.3, -0.3],
        [-0.3, 0.3],
        [0.3, 0.3],
      ].map(([x, z]) => (
        <mesh
          key={`pocket-${x}:${z}`}
          geometry={OGEO.pocket}
          material={OMAT.charcoal}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, CARROM_HEIGHT + 0.016, z]}
        />
      ))}

      {/* The centre ring: alternating coins around the queen. */}
      <mesh geometry={OGEO.coin} material={OMAT.queenRed} position={[0, CARROM_HEIGHT + 0.02, 0]} />
      {Array.from({ length: 12 }).map((_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        const ring = index % 4 === 0 ? 0.055 : 0.1;
        return (
          <mesh
            key={index}
            geometry={OGEO.coin}
            material={index % 2 === 0 ? OMAT.coinWhite : OMAT.coinBlack}
            position={[Math.sin(angle) * ring, CARROM_HEIGHT + 0.02, Math.cos(angle) * ring]}
          />
        );
      })}
      {/* A couple of pocketed-side strays, and the striker on the baseline. */}
      <mesh geometry={OGEO.coin} material={OMAT.coinWhite} position={[0.22, CARROM_HEIGHT + 0.02, -0.18]} />
      <mesh geometry={OGEO.coin} material={OMAT.coinBlack} position={[-0.25, CARROM_HEIGHT + 0.02, 0.12]} />
      <mesh geometry={OGEO.striker} material={OMAT.white} position={[0.05, CARROM_HEIGHT + 0.022, 0.28]} />

      <mesh
        geometry={OGEO.circle}
        material={OMAT.shadow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.018, 0]}
        scale={1.5}
      />

      {hovered && (
        <Html position={[0, 1.15, 0]} center zIndexRange={[14, 0]} style={{ pointerEvents: "none" }}>
          <span className="whitespace-nowrap rounded-[6px] border border-white/10 bg-[rgba(20,16,14,0.9)] px-[7px] py-[4px] text-[9px] font-semibold uppercase tracking-[0.18em] text-ink/80 backdrop-blur-[6px]">
            BREAK TIME
          </span>
        </Html>
      )}
    </group>
  );
});
