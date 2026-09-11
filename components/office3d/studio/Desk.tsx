"use client";

import { memo } from "react";
import { OGEO, OMAT } from "@/materials/officeMaterials";

/**
 * A benching cluster in the reference's style: one shared white top on slim
 * grey frames, worked back-to-back from both sides, with a cable tray slung
 * underneath and a planted divider running down the centre line.
 *
 * The central planter is what makes a run of these read as one piece of office
 * furniture rather than as separate tables, and it screens the two facing rows
 * from each other exactly the way a real benching system does.
 */
export const BenchDesk = memo(function BenchDesk({
  position,
  width = 2.7,
  rotation = 0,
  spine = true,
}: {
  position: [number, number, number];
  /** Desk width in metres; the pooled top is 2.7 and is scaled to fit. */
  width?: number;
  /** Y-rotation of the whole run, so a bench can lie either way in the room. */
  rotation?: number;
  /** Draw the planter + privacy panel along the back edge. */
  spine?: boolean;
}) {
  const sx = width / 2.7;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={OGEO.benchTop} material={OMAT.white} position={[0, 0.75, 0]} scale={[sx, 1, 1]} />
      <mesh geometry={OGEO.benchRail} material={OMAT.gray} position={[0, 0.6, 0]} scale={[sx, 1, 1]} />
      {[-width / 2 + 0.12, 0, width / 2 - 0.12].map((x) => (
        <mesh key={x} geometry={OGEO.benchLeg} material={OMAT.gray} position={[x, 0.36, 0]} />
      ))}

      {/* Cable management: a tray under the centre of the top, where the two
          facing rows' leads actually meet. */}
      <mesh
        geometry={OGEO.benchRail}
        material={OMAT.metal}
        position={[0, 0.66, 0]}
        scale={[sx * 0.95, 0.5, 1.6]}
      />

      {/* Drawer pedestal under one end — the asymmetry keeps a run of benches
          from looking stamped out. */}
      <mesh geometry={OGEO.drawer} material={OMAT.offWhite} position={[-width / 2 + 0.45, 0.3, -0.34]} />

      {spine && (
        <>
          <mesh geometry={OGEO.privacyPanel} material={OMAT.offWhite} position={[0, 0.96, 0]} scale={[sx, 1, 1]} />
          <mesh geometry={OGEO.planterBox} material={OMAT.white} position={[0, 0.89, 0]} scale={[sx, 1, 1]} />
          <mesh
            geometry={OGEO.hedge}
            material={OMAT.leaf}
            position={[0, 1.06, 0]}
            scale={[(sx * 2.4) / 2.3, 0.8, 0.95]}
          />
        </>
      )}

      <mesh
        geometry={OGEO.circle}
        material={OMAT.shadow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.003, 0]}
        scale={[width * 0.9, 1.6, 1]}
      />
    </group>
  );
});
