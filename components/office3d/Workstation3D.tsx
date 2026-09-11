"use client";

import { memo, useCallback } from "react";
import type { ProjectId } from "@/lib/agent/agentTypes";
import { useProject } from "@/store/agentStore";
import { deskSlot } from "@/components/office/layout";
import { TaskChair } from "@/components/office3d/studio/Chair";
import { DeskLamp, DeskProps, Laptop, StudioMonitor } from "@/components/office3d/studio/Monitor";
import { deskSpot } from "@/lib/agent/stations";
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

  const seat = deskSpot(slot);
  const { side, out, along, face } = place;
  // A few degrees of per-seat rotation, so a run of screens reads as occupied
  // rather than as a showroom.
  const tilt = ((slot % 3) - 1) * 0.09;
  /**
   * Desk-top coordinates: `a` runs along the bench, `o` out toward the
   * occupant. Everything on the desk is placed this way, so the run can lie
   * either way in the room without a single position being rewritten.
   */
  const top = (a: number, o: number): [number, number, number] => [
    place.desk.x + along.x * a + out.x * o,
    0.78,
    place.desk.z + along.z * a + out.z * o,
  ];

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
        The chair is on the occupant's side of the bench, so whoever sits in it
        is looking at the front of the monitor rather than at its back. The
        agent itself is not drawn here: it belongs to the room, not to the
        seat, and walks in from the lounge when there is work.
      */}
      <TaskChair
        position={[seat.x + out.x * 0.12, 0, seat.z + out.z * 0.12]}
        rotation={face + Math.PI}
      />

      <StudioMonitor position={top(0, 0)} state={state} rotation={face + tilt} scale={0.82} />
      {dual && (
        <StudioMonitor
          position={top(0.95, 0.06)}
          state={state === "searching" ? "reading" : "searching"}
          rotation={face + side * 0.45}
          scale={0.7}
        />
      )}
      {!dual && <Laptop position={top(0.78, 0.3)} rotation={face - side * 0.3} />}
      <DeskProps
        position={top(-0.06, 0.45)}
        rotation={face + side * 0.1}
        mug={slot % 3 !== 2}
        state={state}
        animate={animate}
      />
      {slot % 2 === 0 && <DeskLamp position={top(-0.78, 0.1)} rotation={face - side * 0.5} />}

      {/*
        A pool of state colour on the floor. At overview distance this is what
        makes the whole room readable without reading a single label.
      */}
      <mesh
        geometry={GEO.circle}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[place.robot.x, 0.012, place.robot.y]}
        scale={hovered ? 4.6 : 3.8}
        material={stateFloorGlow(state, hovered ? 0.3 : busy ? 0.16 : 0.04)}
        visible={!dimmed}
      />
    </group>
  );
}

export const Workstation3D = memo(Workstation3DImpl);
