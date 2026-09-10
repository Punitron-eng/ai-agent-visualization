"use client";

import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AgentState } from "@/lib/agent/agentTypes";
import { GEO, MAT, stateEmissive, visorMaterial } from "@/components/office3d/resources";

export interface Robot3DProps {
  position: [number, number, number];
  state: AgentState;
  /** Standing robots get legs; seated ones are cropped by the desk. */
  pose?: "seated" | "standing";
  /** Y-rotation in radians. */
  facing?: number;
  scale?: number;
  /** Off-screen, hidden-tab or idle robots stop animating entirely. */
  animate?: boolean;
  /** Deterministic offset so a room full of robots does not move in lockstep. */
  seed?: number;
  /**
   * Walk cycle phase, advanced by whoever is moving this robot. A ref rather
   * than a prop value so a walking robot never re-renders as it moves.
   */
  walkPhase?: { current: number };
}

/**
 * The office worker, same family as the 2D rig: squashed sphere head, glowing
 * visor, capsule torso and limbs.
 *
 * All geometry and all materials are shared module-level singletons, so a
 * robot costs a handful of draw calls and zero new GPU resources. Animation is
 * done by mutating transforms in `useFrame` rather than through React state —
 * nothing here re-renders while it moves.
 */
function Robot3DImpl({
  position,
  state,
  pose = "seated",
  facing = 0,
  scale = 1,
  animate = true,
  seed = 0,
  walkPhase,
}: Robot3DProps) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const visor = useRef<THREE.Mesh>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);

  const emissive = visorMaterial(state);
  // The antenna is a small tell, not the focal point; the visor carries the
  // expression, so it is the brighter of the two.
  const tell = stateEmissive(state, state === "idle" ? 0.25 : 0.7);

  useFrame((frame) => {
    if (!animate) return;
    const group = root.current;
    if (!group) return;

    // R3F's own clock: one timebase shared by every robot, so nothing drifts
    // and the seed is all that decorrelates them.
    const t = frame.clock.elapsedTime + seed * 1.7;

    // Breathing, common to every state.
    group.position.y = position[1] + Math.sin(t * 1.5) * 0.012;

    // Walking overrides the idle pose: legs swing, arms counter-swing, and the
    // body bobs on each step.
    const phase = walkPhase?.current ?? 0;
    const walking = phase > 0;
    if (walking) {
      const swing = Math.sin(phase);
      if (legL.current) legL.current.rotation.x = swing * 0.55;
      if (legR.current) legR.current.rotation.x = -swing * 0.55;
      if (armL.current) armL.current.rotation.x = -swing * 0.4;
      if (armR.current) armR.current.rotation.x = swing * 0.4;
      if (head.current) head.current.rotation.y = Math.sin(phase * 0.35) * 0.16;
      group.position.y += Math.abs(Math.sin(phase)) * 0.035;
    } else {
      if (legL.current) legL.current.rotation.x = 0;
      if (legR.current) legR.current.rotation.x = 0;
    }

    const h = walking ? null : head.current;
    const l = walking ? null : armL.current;
    const r = walking ? null : armR.current;
    const v = visor.current;

    switch (state) {
      case "coding": {
        const strike = Math.sin(t * 18);
        if (l) l.rotation.x = -0.55 + strike * 0.16;
        if (r) r.rotation.x = -0.55 + Math.sin(t * 18 + 1.9) * 0.16;
        if (h) {
          h.rotation.x = 0.16;
          h.rotation.y = Math.sin(t * 0.9) * 0.05;
        }
        group.position.y += Math.abs(strike) * 0.006;
        break;
      }
      case "reading":
        if (h) {
          h.rotation.x = 0.2 + Math.sin(t * 1.1) * 0.05;
          h.rotation.y = Math.sin(t * 0.5) * 0.06;
        }
        if (l) l.rotation.x = -0.2;
        if (r) r.rotation.x = -0.2;
        break;
      case "searching":
        if (h) {
          h.rotation.y = Math.sin(t * 1.9) * 0.42;
          h.rotation.x = 0.08;
        }
        if (l) l.rotation.x = -0.3;
        if (r) r.rotation.x = -0.3;
        break;
      case "thinking":
        if (h) {
          h.rotation.x = -0.14;
          h.rotation.z = 0.16 + Math.sin(t * 0.8) * 0.03;
        }
        // Hand up to the chin.
        if (r) {
          r.rotation.x = -1.5;
          r.rotation.z = -0.5;
        }
        if (l) l.rotation.x = -0.15;
        break;
      case "running":
        if (h) {
          h.rotation.x = 0.13;
          h.rotation.y = 0.22;
        }
        if (l) l.rotation.x = -0.28;
        if (r) r.rotation.x = -0.28;
        break;
      case "waiting":
        if (h) h.rotation.y = Math.sin(t * 0.35) * 0.12;
        if (l) l.rotation.x = -0.05;
        if (r) r.rotation.x = -0.05;
        break;
      case "success": {
        const bounce = Math.max(0, Math.sin(t * 6));
        group.position.y = position[1] + bounce * 0.14;
        if (l) l.rotation.x = -2.2;
        if (r) r.rotation.x = -2.2;
        if (h) h.rotation.x = -0.18;
        break;
      }
      case "error":
        if (!walking) group.rotation.y = facing + Math.sin(t * 22) * 0.06;
        if (h) h.rotation.x = 0.3;
        if (l) l.rotation.x = -0.1;
        if (r) r.rotation.x = -0.1;
        break;
      default:
        if (h) {
          h.rotation.x = Math.sin(t * 0.6) * 0.04;
          h.rotation.y = Math.sin(t * 0.4) * 0.09;
          h.rotation.z = 0;
        }
        if (l) l.rotation.x = -0.1;
        if (r) r.rotation.x = -0.1;
    }

    // Visor pulse carries most of the expression, as it does in 2D.
    if (v) {
      const pulse =
        state === "thinking"
          ? 0.7 + Math.sin(t * 4) * 0.3
          : state === "waiting"
            ? 0.45 + Math.sin(t * 2.2) * 0.35
            : state === "error"
              ? 0.6 + Math.sin(t * 12) * 0.4
              : state === "idle"
                ? 0.6 + Math.sin(t * 1.2) * 0.12
                : 1;
      v.scale.setScalar(pulse * 0.5 + 0.75);
    }
  });

  const standing = pose === "standing";

  return (
    <group ref={root} position={position} rotation={[0, facing, 0]} scale={scale}>
      {/* Cheap contact shadow: one unlit disc, no shadow map anywhere. */}
      <mesh
        geometry={GEO.circle}
        material={MAT.shadow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.006, 0]}
        scale={standing ? 0.62 : 0.72}
      />

      <group position={[0, standing ? 0.62 : 0.42, 0]}>
        <mesh geometry={GEO.torso} material={MAT.clay} />
        {/* Chest light */}
        <mesh geometry={GEO.bulb} material={tell} position={[0, 0.02, 0.2]} scale={0.4} />

        <group ref={armL} position={[-0.24, 0.1, 0]}>
          <mesh geometry={GEO.limb} material={MAT.clayDark} position={[0, -0.12, 0.02]} />
          <mesh geometry={GEO.bulb} material={MAT.clayLight} position={[0, -0.25, 0.05]} scale={0.9} />
        </group>
        <group ref={armR} position={[0.24, 0.1, 0]}>
          <mesh geometry={GEO.limb} material={MAT.clayDark} position={[0, -0.12, 0.02]} />
          <mesh geometry={GEO.bulb} material={MAT.clayLight} position={[0, -0.25, 0.05]} scale={0.9} />
        </group>

        <group ref={head} position={[0, 0.35, 0]}>
          <mesh geometry={GEO.head} material={MAT.clay} scale={[1.06, 0.92, 0.95]} />
          <mesh geometry={GEO.ear} material={MAT.clayDark} position={[-0.28, 0, 0]} />
          <mesh geometry={GEO.ear} material={MAT.clayDark} position={[0.28, 0, 0]} />
          {/* Dark visor well, then the glowing lens inside it. */}
          <mesh
            geometry={GEO.visor}
            material={MAT.visorGlass}
            position={[0, 0.015, 0.17]}
            scale={[1.3, 0.7, 0.3]}
          />
          <mesh
            ref={visor}
            geometry={GEO.visor}
            material={emissive}
            position={[0, 0.015, 0.205]}
            scale={[1.16, 0.58, 0.2]}
          />
          <mesh geometry={GEO.antenna} material={MAT.clayDark} position={[0, 0.34, 0]} />
          <mesh geometry={GEO.bulb} material={tell} position={[0, 0.44, 0]} scale={0.62} />
        </group>
      </group>

      {standing && (
        <>
          {/* The pivot is the hip group, so rotating it reads as a stride. */}
          <group ref={legL} position={[-0.11, 0.38, 0]}>
            <mesh
              geometry={GEO.limb}
              material={MAT.clayDark}
              position={[0, -0.18, 0]}
              scale={[1, 1.15, 1]}
            />
          </group>
          <group ref={legR} position={[0.11, 0.38, 0]}>
            <mesh
              geometry={GEO.limb}
              material={MAT.clayDark}
              position={[0, -0.18, 0]}
              scale={[1, 1.15, 1]}
            />
          </group>
        </>
      )}
    </group>
  );
}

export const Robot3D = memo(Robot3DImpl);
