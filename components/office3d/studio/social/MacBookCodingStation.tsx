"use client";

import { memo, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OGEO, OMAT } from "@/materials/officeMaterials";
import { claudeScreen } from "@/components/office3d/claudeScreen";

/**
 * The coding station: one large aluminium laptop, open about 105°, with Claude
 * Code running on it.
 *
 * This is the focal point of the collaboration room, so it is built a size up
 * from the laptops on the benches and turned a few degrees toward the main
 * camera. The display is a live canvas texture — code landing line by line, a
 * scrolling terminal, a blinking caret, the agent's progress bar filling —
 * redrawn a handful of times a second rather than every frame: fast enough to
 * read as a working machine, cheap enough to be free.
 */

/** Redraws per second. Above this the screen reads as noise, not as work. */
const SCREEN_FPS = 7;

export const MacBookCodingStation = memo(function MacBookCodingStation({
  position,
  rotation = 0,
  animate = true,
}: {
  position: [number, number, number];
  rotation?: number;
  animate?: boolean;
}) {
  const screen = useMemo(() => claudeScreen(), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: screen.texture,
        // Unlit: a display emits its own light, and a lit one would go grey
        // under the room's soft key.
        toneMapped: false,
      }),
    [screen],
  );

  const clock = useRef(0);
  const next = useRef(0);
  const invalidate = useThree((state) => state.invalidate);

  useFrame((_, rawDelta) => {
    if (!animate) return;
    clock.current += Math.min(rawDelta, 0.1);
    if (clock.current < next.current) return;
    next.current = clock.current + 1 / SCREEN_FPS;
    screen.update(clock.current);
    invalidate();
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Body: a slim wedge with rubber feet, keyboard well and trackpad. */}
      <mesh geometry={OGEO.macBase} material={OMAT.aluminium} position={[0, 0.008, 0]} />
      <mesh geometry={OGEO.macFoot} material={OMAT.charcoal} position={[0, 0.001, 0]} />
      <mesh geometry={OGEO.macKeys} material={OMAT.keycap} position={[0, 0.018, -0.04]} />
      <mesh geometry={OGEO.macPad} material={OMAT.metal} position={[0, 0.018, 0.11]} />

      {/* Lid, hinged at the back edge and leaned 15° past upright. */}
      <group position={[0, 0.016, -0.19]} rotation={[-0.26, 0, 0]}>
        <mesh geometry={OGEO.macLid} material={OMAT.aluminium} position={[0, 0.178, 0]} />
        {/* Thin bezel: the display sits proud of the lid, almost to its edge. */}
        <mesh
          geometry={OGEO.macDisplay}
          material={material}
          position={[0, 0.178, 0.007]}
        />
      </group>

      <mesh
        geometry={OGEO.plane}
        material={OMAT.shadow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.002, 0.02]}
        scale={[0.68, 0.5, 1]}
      />
    </group>
  );
});
