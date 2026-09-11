"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GEO, MAT } from "@/components/office3d/resources";
import type { ProjectId } from "@/lib/agent/agentTypes";
import { useProject } from "@/store/agentStore";
import type { OfficePlan } from "@/components/office/layout";
import {
  routeBetween,
  spotFor,
  stationFor,
  type Spot,
  type Station,
  type Waypoint,
} from "@/lib/agent/stations";
import { Robot3D } from "@/components/office3d/Robot3D";

/**
 * The office staff: exactly one agent per project, and nobody else.
 *
 * The room used to be padded out with ambient robots and a wandering crowd.
 * That looked busy but lied — you could not count the agents and learn
 * anything. Now the headcount is the project count, and where each agent is
 * standing tells you what its session is doing:
 *
 *  - nothing running → lounging in the chill room;
 *  - working → at its own desk;
 *  - running a git command → down at the git station.
 *
 * Agents walk between those places rather than teleporting, along the aisles
 * defined in `lib/agent/stations`.
 */

export interface OfficeAgentsProps {
  /** [projectId, desk slot] pairs, in desk order. */
  ordered: Array<[ProjectId, number]>;
  plan: OfficePlan;
  animate: boolean;
  onHover(id: ProjectId | null): void;
  onSelect(id: ProjectId): void;
}

function OfficeAgentsImpl({ ordered, plan, animate, onHover, onSelect }: OfficeAgentsProps) {
  // Position within a shared station (which sofa seat, which spot at the git
  // table) is the agent's index in desk order, so two agents never stack.
  return (
    <>
      {ordered.map(([id, slot], index) => (
        <OfficeAgent
          key={id}
          id={id}
          slot={slot}
          index={index}
          plan={plan}
          animate={animate}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

/** Metres per second on foot. Brisk, but not a jog. */
const WALK_SPEED = 1.5;
/** How fast the body settles into its seat once it arrives. */
const SETTLE = 0.12;

function OfficeAgent({
  id,
  slot,
  index,
  plan,
  animate,
  onHover,
  onSelect,
}: {
  id: ProjectId;
  slot: number;
  index: number;
  plan: OfficePlan;
  animate: boolean;
  onHover(id: ProjectId | null): void;
  onSelect(id: ProjectId): void;
}) {
  const project = useProject(id);
  const invalidate = useThree((state) => state.invalidate);

  const state = project?.state ?? "idle";
  const station = stationFor(state, project?.command);
  const spot = spotFor(station, slot, index, plan);

  const group = useRef<THREE.Group>(null);
  const lift = useRef<THREE.Group>(null);
  const walkPhase = useRef(0);
  const here = useRef<Waypoint>([spot.x, spot.z]);
  const height = useRef(spot.y);
  const facing = useRef(spot.facing);
  const route = useRef<Waypoint[] | null>(null);
  const from = useRef<Station>(station);
  const target = useRef<Spot>(spot);

  // Re-rendering on arrival only: a walking agent is pure ref mutation.
  const [walking, setWalking] = useState(false);

  // Position is owned entirely by the frame loop, never by props: a re-render
  // that re-applied a stale position would snap a walking agent backwards.
  useLayoutEffect(() => {
    group.current?.position.set(here.current[0], 0, here.current[1]);
    if (group.current) group.current.rotation.y = facing.current;
    if (lift.current) lift.current.position.y = height.current;
  });

  useEffect(() => {
    if (target.current.x === spot.x && target.current.z === spot.z) return;
    route.current = routeBetween(here.current, spot, from.current, station, slot, plan);
    // Drop the first waypoint — it is where we already are.
    route.current.shift();
    target.current = spot;
    from.current = station;
    setWalking(true);
    invalidate();
  }, [spot, station, slot, plan, invalidate]);

  useFrame((_, rawDelta) => {
    const node = group.current;
    if (!node || !animate) return;
    // Clamp so a backgrounded tab returning does not teleport anyone.
    const delta = Math.min(rawDelta, 0.1);

    const path = route.current;
    if (path && path.length > 0) {
      const [tx, tz] = path[0];
      const dx = tx - here.current[0];
      const dz = tz - here.current[1];
      const distance = Math.hypot(dx, dz);
      const step = WALK_SPEED * delta;

      if (distance <= step) {
        here.current = [tx, tz];
        path.shift();
        if (path.length === 0) {
          route.current = null;
          walkPhase.current = 0;
          setWalking(false);
        }
      } else {
        here.current = [here.current[0] + (dx / distance) * step, here.current[1] + (dz / distance) * step];
        walkPhase.current += delta * WALK_SPEED * 5.2;
        turnToward(facing, Math.atan2(dx, dz), delta);
      }

      // Stand up out of the seat as soon as the walk starts.
      height.current += (0 - height.current) * SETTLE;
    } else {
      // Arrived: settle into the seat and turn to face the right way.
      height.current += (target.current.y - height.current) * SETTLE;
      turnToward(facing, target.current.facing, delta);
    }

    node.position.set(here.current[0], 0, here.current[1]);
    node.rotation.y = facing.current;
    // The body rises into a seat; the contact shadow stays on the floor.
    if (lift.current) lift.current.position.y = height.current;
    if (route.current) invalidate();
  });

  if (!project) return null;

  return (
    <group
      ref={group}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(id);
      }}
      onPointerOut={() => onHover(null)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(id);
      }}
    >
      <mesh
        geometry={GEO.circle}
        material={MAT.shadow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.007, walking ? 0 : 0.12]}
        scale={walking ? 0.66 : 0.8}
      />
      <group ref={lift}>
        <Robot3D
          position={[0, 0, 0]}
          state={walking ? "idle" : state}
          pose={walking ? "standing" : spot.posture}
          animate={animate}
          contactShadow={false}
          seed={slot * 1.3 + 0.4}
          walkPhase={walkPhase}
        />
      </group>
    </group>
  );
}

/** Turn smoothly toward a heading, by the short way round. */
function turnToward(facing: { current: number }, want: number, delta: number): void {
  let diff = want - facing.current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  facing.current += diff * Math.min(1, delta * 6);
}

export const OfficeAgents = memo(OfficeAgentsImpl);
