"use client";

import { memo, useState } from "react";
import { motion } from "motion/react";
import type { ProjectId } from "@/lib/agent/agentTypes";
import { useProject } from "@/store/agentStore";
import { project as iso } from "@/components/office/iso";
import { RobotAgent } from "@/components/office/RobotAgent";
import type { OfficePlan } from "@/components/office/layout";
import {
  routeBetween,
  spotFor,
  stationFor,
  type Spot,
  type Station,
  type Waypoint,
} from "@/lib/agent/stations";

/**
 * The staff of the isometric office: one agent per project, and nobody else.
 *
 * Same rules as the 3D room, from the same station table — idle agents wait in
 * the lounge, working ones sit at their own desk, and an agent whose session is
 * running a git command walks down to the git station. Drawing them as a layer
 * above the furniture rather than inside each workstation is what lets them
 * leave their desks at all.
 */

export interface AgentCrewProps {
  /** [projectId, desk slot] pairs, in desk order. */
  ordered: Array<[ProjectId, number]>;
  plan: OfficePlan;
  animate: boolean;
  hovered: ProjectId | null;
  onHover(id: ProjectId | null): void;
  onSelect(id: ProjectId): void;
}

/** Units per second on foot, matching the 3D room. */
const WALK_SPEED = 1.5;

function AgentCrewImpl({ ordered, plan, animate, hovered, onHover, onSelect }: AgentCrewProps) {
  return (
    <g>
      {ordered.map(([id, slot], index) => (
        <Agent
          key={id}
          id={id}
          slot={slot}
          index={index}
          plan={plan}
          animate={animate}
          hovered={hovered === id}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </g>
  );
}

function Agent({
  id,
  slot,
  index,
  plan,
  animate,
  hovered,
  onHover,
  onSelect,
}: {
  id: ProjectId;
  slot: number;
  index: number;
  plan: OfficePlan;
  animate: boolean;
  hovered: boolean;
  onHover(id: ProjectId | null): void;
  onSelect(id: ProjectId): void;
}) {
  const project = useProject(id);
  const state = project?.state ?? "idle";
  const station = stationFor(state, project?.command);
  const spot = spotFor(station, slot, index, plan);

  // The current trip, carried across renders so a walk starts from where the
  // agent actually is. Recomputed during render rather than in an effect: an
  // effect would paint one frame with the agent already teleported.
  const key = `${station}:${spot.x.toFixed(2)}:${spot.z.toFixed(2)}`;
  const [trip, setTrip] = useState<Trip>(() => ({
    key,
    spot,
    station,
    walk: toKeyframes([[spot.x, spot.z]]),
  }));

  let current = trip;
  if (trip.key !== key) {
    current = {
      key,
      spot,
      station,
      walk: toKeyframes(
        routeBetween([trip.spot.x, trip.spot.z], spot, trip.station, station, slot, plan),
      ),
    };
    setTrip(current);
  }
  const walk = current.walk;

  if (!project) return null;

  const seated = spot.posture !== "standing";

  return (
    <motion.g
      className="cursor-pointer"
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(id)}
      role="button"
      tabIndex={0}
      aria-label={`${project.name} — Claude is ${state}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect(id);
      }}
      initial={false}
      animate={{ x: walk.x, y: walk.y }}
      transition={{
        duration: animate ? walk.duration : 0,
        ease: "linear",
        times: walk.times,
      }}
    >
      <RobotAgent
        x={0}
        y={0}
        z={seated ? spot.y : 0}
        state={state}
        pose={seated ? "seated" : "standing"}
        animate={animate}
        fidelity="compact"
        scale={hovered ? 0.37 : 0.34}
        flip={spot.facing < Math.PI}
      />
    </motion.g>
  );
}

interface Trip {
  /** Destination identity: a new key means a new walk. */
  key: string;
  spot: Spot;
  station: Station;
  walk: Walk;
}

interface Walk {
  x: number[];
  y: number[];
  times: number[];
  duration: number;
}

/**
 * A route in plan coordinates, projected to screen keyframes.
 *
 * Interpolating in screen space between the aisle waypoints — rather than
 * straight from desk to lounge — is what keeps an agent walking around the
 * pods instead of through them. Keyframe times are proportional to leg length,
 * so the pace stays constant through the turns.
 */
function toKeyframes(route: Waypoint[]): Walk {
  const points = route.map(([x, z]) => iso(x, z));
  const lengths: number[] = [];
  let total = 0;
  for (let index = 1; index < route.length; index += 1) {
    const length = Math.hypot(route[index][0] - route[index - 1][0], route[index][1] - route[index - 1][1]);
    lengths.push(length);
    total += length;
  }

  const times = [0];
  let walked = 0;
  for (const length of lengths) {
    walked += length;
    times.push(total > 0 ? walked / total : 1);
  }

  return {
    x: points.map((point) => point.sx),
    y: points.map((point) => point.sy),
    times: points.length > 1 ? times : [0],
    duration: total / WALK_SPEED,
  };
}

export const AgentCrew = memo(AgentCrewImpl);
