"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GEO, MAT, lampHalo } from "@/components/office3d/resources";
import { tvFrames } from "@/components/office3d/tvTexture";

/**
 * Wall-mounted TV in the lounge, playing a looping sunset.
 *
 * "Playing" is a texture pointer swapped ~7 times a second, not a redraw — the
 * frames are rasterised once at startup. The screen is unlit so it reads as a
 * source rather than a lit surface.
 */
function TelevisionImpl({
  position,
  rotation = 0,
  width = 1.9,
  animate = true,
}: {
  position: [number, number, number];
  rotation?: number;
  width?: number;
  animate?: boolean;
}) {
  const height = (width * 9) / 16;
  const screen = useRef<THREE.Mesh>(null);
  const cursor = useRef(0);
  const elapsed = useRef(0);

  const frames = useMemo(() => tvFrames(), []);
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ map: frames[0], toneMapped: false }),
    [frames],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, delta) => {
    if (!animate) return;
    elapsed.current += delta;
    if (elapsed.current < 0.14) return;
    elapsed.current = 0;
    cursor.current = (cursor.current + 1) % frames.length;
    const mesh = screen.current;
    if (!mesh) return;
    const map = (mesh.material as THREE.MeshBasicMaterial);
    map.map = frames[cursor.current];
    map.needsUpdate = true;
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Bezel */}
      <mesh
        geometry={GEO.unitBox}
        material={MAT.dark}
        scale={[width + 0.07, height + 0.07, 0.05]}
      />
      <mesh ref={screen} geometry={GEO.plane} material={material} position={[0, 0, 0.032]} scale={[width, height, 1]} />
      {/* Wall mount */}
      <mesh geometry={GEO.unitBox} material={MAT.metal} position={[0, -height / 2 - 0.06, -0.02]} scale={[0.26, 0.05, 0.08]} />
      {/* Screen spill into the room. */}
      <sprite scale={[width * 2.1, height * 2.6, 1]} position={[0, 0, 0.3]} material={lampHalo()} />
    </group>
  );
}

export const Television = memo(TelevisionImpl);
