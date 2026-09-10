"use client";

import { memo, useCallback } from "react";
import type { ProjectId } from "@/lib/agent/agentTypes";
import { useProject } from "@/store/agentStore";
import { deskSlot } from "@/components/office/layout";
import { Chair, Desk, Keyboard, Monitor, Mug, Plant } from "@/components/office3d/Props3D";
import { Robot3D } from "@/components/office3d/Robot3D";
import { GEO, stateFloorGlow } from "@/components/office3d/resources";

export interface Workstation3DProps {
  id: ProjectId;
  slot: number;
  animate: boolean;
  hovered: boolean;
  dimmed: boolean;
  onHover(id: ProjectId | null): void;
  onSelect(id: ProjectId): void;
}

/**
 * One project as a physical desk in the room.
 *
 * Subscribes to a single store slice, so activity in another repo never
 * re-renders this workstation — the same guarantee the 2D renderer had.
 */
function Workstation3DImpl({
  id,
  slot,
  animate,
  hovered,
  dimmed,
  onHover,
  onSelect,
}: Workstation3DProps) {
  const project = useProject(id);

  const enter = useCallback(() => onHover(id), [onHover, id]);
  const leave = useCallback(() => onHover(null), [onHover]);
  const click = useCallback(() => onSelect(id), [onSelect, id]);

  if (!project) return null;

  const place = deskSlot(slot);
  const state = project.state;
  const busy = state !== "idle";
  // A second screen appears for the states where the agent is genuinely
  // looking between two things.
  const dual = state === "searching" || state === "reading";

  const x = place.x + 1.35;
  const z = place.y + 0.75;

  return (
    <group
      onPointerOver={(event) => {
        event.stopPropagation();
        enter();
      }}
      onPointerOut={leave}
      onClick={(event) => {
        event.stopPropagation();
        click();
      }}
    >
      {/*
        The agent sits on the far side of the desk facing the camera, and the
        monitors are angled toward the camera too. Strictly the robot is then
        looking at the back of its screen — the same cheat every isometric
        office illustration uses, because the alternative is a room full of
        robots seen from behind.
      */}
      <Chair position={[x - 0.3, 0, z - 1.28]} rotation={0.28} />
      <Robot3D
        position={[x - 0.3, 0.42, z - 0.95]}
        state={state}
        facing={0.28}
        animate={animate}
        scale={hovered ? 1.1 : 1}
        seed={slot}
      />

      <Desk position={[x, 0, z]} width={2.7} />
      <Monitor position={[x + 0.5, 0.83, z + 0.1]} state={state} rotation={0.22} />
      {dual && (
        <Monitor
          position={[x - 0.75, 0.83, z + 0.15]}
          state={state === "searching" ? "reading" : "searching"}
          rotation={0.55}
          scale={0.82}
        />
      )}
      <Keyboard position={[x + 0.35, 0.84, z + 0.55]} state={state} animate={animate} />
      <Mug position={[x + 1.15, 0.84, z + 0.5]} />

      {slot % 2 === 1 && <Plant position={[x + 1.75, 0, z - 0.5]} scale={0.85} />}

      {/*
        A pool of state colour on the floor. At overview distance this is what
        makes the whole room readable without reading a single label.
      */}
      <mesh
        geometry={GEO.circle}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[x, 0.012, z - 0.2]}
        scale={hovered ? 4.6 : 3.8}
        material={stateFloorGlow(state, hovered ? 0.3 : busy ? 0.16 : 0.04)}
        visible={!dimmed}
      />
    </group>
  );
}

export const Workstation3D = memo(Workstation3DImpl);
