"use client";

import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Robot3D } from "@/components/office3d/Robot3D";

/**
 * A free agent: an office character who belongs to the room rather than to a
 * project, standing around the carrom board.
 *
 * The body is the same stylized robot the project agents use — no second
 * character rig — with a small motion layer on top so nobody looks frozen:
 * everyone breathes and shifts their weight, watchers lean in toward the
 * board, and players periodically dip down to take a shot.
 */

export type FreeAgentRole = "player" | "observer";

export interface FreeAgentConfig {
  id: string;
  role: FreeAgentRole;
  /** Position around the board, in plan coordinates. */
  x: number;
  z: number;
  /** Facing, in radians; 0 looks toward +z. */
  facing: number;
  /** Seconds between shots, for players. */
  period: number;
  /** Phase offset so four agents never move in lockstep. */
  offset: number;
}

export const FreeAgent = memo(function FreeAgent({
  config,
  animate,
}: {
  config: FreeAgentConfig;
  animate: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const clock = useRef(config.offset);

  useFrame((_, rawDelta) => {
    const node = group.current;
    if (!node || !animate) return;
    clock.current += Math.min(rawDelta, 0.1);
    const t = clock.current;

    // Weight shift and breathing: tiny, but it is the difference between a
    // person standing and a prop standing.
    const sway = Math.sin(t * 0.9) * 0.035;
    node.rotation.y = config.facing + sway;
    node.position.y = Math.sin(t * 1.7) * 0.012;

    if (config.role === "player") {
      // A shot: crouch in over the board, hold, come back up.
      const phase = (t % config.period) / config.period;
      const shot = phase < 0.18 ? Math.sin((phase / 0.18) * Math.PI) : 0;
      node.rotation.x = shot * 0.42;
      node.position.z = shot * 0.16;
    } else {
      // Watchers lean in and out, following the play.
      node.rotation.x = 0.06 + Math.sin(t * 0.55 + config.offset) * 0.07;
    }
  });

  return (
    <group ref={group} position={[config.x, 0, config.z]} rotation={[0, config.facing, 0]}>
      <Robot3D
        position={[0, 0, 0]}
        state="idle"
        pose="standing"
        animate={animate}
        seed={config.offset}
      />
    </group>
  );
});
