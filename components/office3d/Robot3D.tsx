"use client";

import { memo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AgentState } from "@/lib/agent/agentTypes";
import type { Posture } from "@/lib/agent/stations";
import { GEO, MAT, stateEmissive, visorMaterial } from "@/components/office3d/resources";

export interface Robot3DProps {
  position: [number, number, number];
  state: AgentState;
  /** How the body is arranged: on its feet, on a chair, or sunk into a beanbag. */
  pose?: Posture;
  /** Y-rotation in radians. */
  facing?: number;
  scale?: number;
  /** Off-screen, hidden-tab or idle robots stop animating entirely. */
  animate?: boolean;
  /**
   * Draw the contact disc. Off for agents that are moved by a parent group,
   * which owns the shadow so it stays on the floor while the body rises into
   * a chair.
   */
  contactShadow?: boolean;
  /** Deterministic offset so a room full of robots does not move in lockstep. */
  seed?: number;
  /**
   * Walk cycle phase, advanced by whoever is moving this robot. A ref rather
   * than a prop value so a walking robot never re-renders as it moves.
   */
  walkPhase?: { current: number };
}

interface Rest {
  hip: number;
  torso: number;
  thigh: number;
  shin: number;
  lean: number;
}

/**
 * Rest pose per posture, in local units above the group origin.
 *
 * The origin is whatever the agent is standing or sitting on, so a chair seat
 * at 0.42 and a beanbag at 0.2 both put feet on the floor without the caller
 * doing any arithmetic.
 */
const POSE: Record<Posture, Rest> = {
  standing: { hip: 0.6, torso: 0.72, thigh: 0, shin: 0, lean: 0 },
  seated: { hip: 0.06, torso: 0.42, thigh: -1.35, shin: 1.45, lean: 0.04 },
  lounging: { hip: 0.03, torso: 0.36, thigh: -1.12, shin: 0.72, lean: -0.26 },
};

/**
 * The office worker: squashed-sphere head with a glowing visor, a panelled
 * torso, and jointed arms and legs.
 *
 * Everything is built from shared module-level geometry and materials, so one
 * more agent on the floor costs draw calls and nothing else. Animation mutates
 * transforms in `useFrame`; nothing here re-renders while it moves.
 */
function Robot3DImpl({
  position,
  state,
  pose = "seated",
  facing = 0,
  scale = 1,
  animate = true,
  contactShadow = true,
  seed = 0,
  walkPhase,
}: Robot3DProps) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const visor = useRef<THREE.Mesh>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const kneeL = useRef<THREE.Group>(null);
  const kneeR = useRef<THREE.Group>(null);

  const emissive = visorMaterial(state);
  // The antenna and chest light are small tells, not the focal point; the visor
  // carries the expression, so it is the brightest of the three.
  const tell = stateEmissive(state, state === "idle" ? 0.25 : 0.7);
  const rest = POSE[pose];

  useFrame((frame) => {
    if (!animate) return;
    const group = root.current;
    if (!group) return;

    // R3F's own clock: one timebase shared by every robot, so nothing drifts
    // and the seed is all that decorrelates them.
    const t = frame.clock.elapsedTime + seed * 1.7;

    // Breathing, common to every state.
    group.position.y = position[1] + Math.sin(t * 1.5) * 0.012;

    // Walking overrides the rest pose: thighs swing from the hip, knees bend on
    // the back stroke, arms counter-swing, and the body bobs on each step.
    const phase = walkPhase?.current ?? 0;
    const walking = phase > 0;
    if (walking) {
      const swing = Math.sin(phase);
      if (legL.current) legL.current.rotation.x = swing * 0.62;
      if (legR.current) legR.current.rotation.x = -swing * 0.62;
      if (kneeL.current) kneeL.current.rotation.x = Math.max(0, -swing) * 0.7;
      if (kneeR.current) kneeR.current.rotation.x = Math.max(0, swing) * 0.7;
      if (armL.current) armL.current.rotation.x = -swing * 0.45;
      if (armR.current) armR.current.rotation.x = swing * 0.45;
      if (head.current) head.current.rotation.y = Math.sin(phase * 0.35) * 0.16;
      if (body.current) body.current.rotation.z = Math.sin(phase) * 0.03;
      group.position.y += Math.abs(Math.sin(phase)) * 0.035;
    } else {
      if (legL.current) legL.current.rotation.x = rest.thigh;
      if (legR.current) legR.current.rotation.x = rest.thigh;
      if (kneeL.current) kneeL.current.rotation.x = rest.shin;
      if (kneeR.current) kneeR.current.rotation.x = rest.shin;
      if (body.current) body.current.rotation.z = 0;
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
      {/* Cheap contact shadow: one unlit disc, no shadow map anywhere. It sits
          on the floor, not on the seat, so it tracks the base height. */}
      {contactShadow && (
        <mesh
          geometry={GEO.circle}
          material={MAT.shadow}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.006 - position[1], standing ? 0 : 0.12]}
          scale={standing ? 0.66 : 0.8}
        />
      )}

      <group ref={body} position={[0, rest.torso, 0]} rotation={[rest.lean, 0, 0]}>
        <mesh geometry={GEO.torso} material={MAT.clay} />
        {/* Chest plate and pack: the two silhouette details that keep the robot
            readable from behind as well as from the front. */}
        <mesh geometry={GEO.chestPlate} material={MAT.clayLight} position={[0, 0.01, 0.19]} />
        <mesh geometry={GEO.bulb} material={tell} position={[0, 0.02, 0.235]} scale={0.5} />
        <mesh geometry={GEO.backpack} material={MAT.clayDark} position={[0, 0.02, -0.21]} />
        <mesh
          geometry={GEO.rackLed}
          material={tell}
          position={[0, 0.08, -0.267]}
          scale={[0.42, 0.7, 1]}
        />

        <mesh geometry={GEO.shoulder} material={MAT.clayDark} position={[-0.24, 0.16, 0]} />
        <mesh geometry={GEO.shoulder} material={MAT.clayDark} position={[0.24, 0.16, 0]} />

        <group ref={armL} position={[-0.25, 0.12, 0]}>
          <mesh geometry={GEO.limb} material={MAT.clayDark} position={[0, -0.12, 0.02]} />
          <mesh geometry={GEO.hand} material={MAT.clayLight} position={[0, -0.26, 0.05]} />
        </group>
        <group ref={armR} position={[0.25, 0.12, 0]}>
          <mesh geometry={GEO.limb} material={MAT.clayDark} position={[0, -0.12, 0.02]} />
          <mesh geometry={GEO.hand} material={MAT.clayLight} position={[0, -0.26, 0.05]} />
        </group>

        <mesh geometry={GEO.neck} material={MAT.clayDark} position={[0, 0.24, 0]} />

        <group ref={head} position={[0, 0.36, 0]}>
          <mesh geometry={GEO.head} material={MAT.clay} scale={[1.06, 0.92, 0.95]} />
          {/* A brighter cap catches the ceiling light and gives the head a top. */}
          <mesh
            geometry={GEO.crown}
            material={MAT.clayLight}
            position={[0, 0.005, 0]}
            scale={[1.02, 0.9, 0.92]}
          />
          <mesh geometry={GEO.ear} material={MAT.clayDark} position={[-0.28, 0, 0]} />
          <mesh geometry={GEO.ear} material={MAT.clayDark} position={[0.28, 0, 0]} />
          {/* Dark visor well, a brow above it, then the glowing lens inside. */}
          <mesh
            geometry={GEO.visor}
            material={MAT.visorGlass}
            position={[0, 0.015, 0.17]}
            scale={[1.3, 0.72, 0.3]}
          />
          <mesh geometry={GEO.brow} material={MAT.clayDark} position={[0, 0.135, 0.2]} />
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

      {/*
        Hips and legs exist in every pose now, not only standing: an agent that
        walks to its desk and sits down has to have something to sit with, and
        the seated pose is in full view from the near side of the desk.
      */}
      <mesh geometry={GEO.pelvis} material={MAT.clayDark} position={[0, rest.hip + 0.05, 0]} />
      <Leg hip={legL} knee={kneeL} x={-0.12} y={rest.hip} />
      <Leg hip={legR} knee={kneeR} x={0.12} y={rest.hip} />
    </group>
  );
}

/** One jointed leg: hip pivot, thigh, knee pivot, shin and foot. */
function Leg({
  hip,
  knee,
  x,
  y,
}: {
  hip: RefObject<THREE.Group | null>;
  knee: RefObject<THREE.Group | null>;
  x: number;
  y: number;
}) {
  return (
    <group ref={hip} position={[x, y, 0]}>
      <mesh geometry={GEO.thigh} material={MAT.clayDark} position={[0, -0.14, 0]} />
      <group ref={knee} position={[0, -0.28, 0]}>
        <mesh geometry={GEO.shin} material={MAT.clay} position={[0, -0.14, 0]} />
        <mesh geometry={GEO.foot} material={MAT.dark} position={[0, -0.29, 0.04]} />
      </group>
    </group>
  );
}

export const Robot3D = memo(Robot3DImpl);
