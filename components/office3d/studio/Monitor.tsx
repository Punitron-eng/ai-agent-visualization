"use client";

import { memo } from "react";
import type { AgentState } from "@/lib/agent/agentTypes";
import { OGEO, OMAT } from "@/materials/officeMaterials";
import { stateGlow } from "@/components/office3d/resources";
import { screenMaterial } from "@/components/office3d/screenTexture";

/**
 * A slim desktop monitor on a flat foot.
 *
 * The panel shows the interface its agent would actually be looking at: the
 * texture is cached per state upstream, so twenty screens on "coding" share one
 * material and one texture between them.
 */
export const StudioMonitor = memo(function StudioMonitor({
  position,
  state,
  rotation = 0,
  scale = 1,
  off = false,
}: {
  position: [number, number, number];
  state: AgentState;
  rotation?: number;
  scale?: number;
  off?: boolean;
}) {
  const material = off ? OMAT.screenOff : screenMaterial(state);
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh geometry={OGEO.monitorFoot} material={OMAT.charcoal} position={[0, 0.01, 0.03]} />
      <mesh geometry={OGEO.monitorNeck} material={OMAT.charcoal} position={[0, 0.11, 0.02]} />
      <mesh geometry={OGEO.monitorPanel} material={OMAT.charcoal} position={[0, 0.52, 0]} />
      <mesh geometry={OGEO.monitorScreen} material={material} position={[0, 0.52, 0.021]} />
      {!off && (
        <sprite
          scale={[1.7, 1.1, 1]}
          position={[0, 0.54, 0.2]}
          material={stateGlow(state, state === "idle" ? 0.04 : 0.14)}
        />
      )}
    </group>
  );
});

/** A closed-lid laptop beside the main screen. */
export const Laptop = memo(function Laptop({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={OGEO.laptopBase} material={OMAT.metal} position={[0, 0.011, 0]} />
      <mesh
        geometry={OGEO.laptopLid}
        material={OMAT.charcoal}
        position={[0, 0.14, -0.14]}
        rotation={[-0.22, 0, 0]}
      />
    </group>
  );
});

/**
 * Keyboard, mouse and mug: the small evidence that a desk is occupied.
 *
 * The keyboard picks up a faint wash of the agent's state colour while a
 * session is actually running, which is the only motion on the desk surface.
 */
export const DeskProps = memo(function DeskProps({
  position,
  rotation = 0,
  mug = true,
  state = "idle",
  animate = true,
}: {
  position: [number, number, number];
  rotation?: number;
  mug?: boolean;
  state?: AgentState;
  animate?: boolean;
}) {
  const typing = animate && state !== "idle";
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={OGEO.keyboard} material={OMAT.offWhite} position={[0, 0.009, 0]} />
      {typing && (
        <sprite scale={[0.7, 0.3, 1]} position={[0, 0.05, 0]} material={stateGlow(state, 0.1)} />
      )}
      <mesh geometry={OGEO.mouse} material={OMAT.offWhite} position={[0.36, 0.012, 0.01]} />
      {mug && <mesh geometry={OGEO.mug} material={OMAT.white} position={[-0.42, 0.042, -0.04]} />}
    </group>
  );
});

/** A folded task lamp clamped to the desk edge. */
export const DeskLamp = memo(function DeskLamp({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={OGEO.potSmall} material={OMAT.charcoal} position={[0, 0.02, 0]} scale={[0.5, 0.2, 0.5]} />
      <mesh
        geometry={OGEO.lampArm}
        material={OMAT.charcoal}
        position={[0, 0.23, 0.04]}
        rotation={[0.22, 0, 0]}
      />
      <mesh
        geometry={OGEO.lampHead}
        material={OMAT.charcoal}
        position={[0, 0.43, 0.13]}
        rotation={[Math.PI - 0.5, 0, 0]}
      />
    </group>
  );
});
