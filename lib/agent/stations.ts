import type { AgentState } from "@/lib/agent/agentTypes";
import { classifyCommand, STEP_BITS } from "@/store/agentStore";
import {
  backAisle,
  deskSlot,
  rowAisle,
  type OfficePlan,
} from "@/components/office/layout";

/**
 * Where an agent physically is, and how it gets there.
 *
 * The office has exactly one agent per project, and that agent is never in two
 * places at once: it lounges in the chill room until its session does
 * something, walks to its desk to work, and walks down to the git station when
 * the session actually runs a git command. Both renderers read these positions,
 * so the 3D room and the isometric diorama always agree on who is where.
 */

export type Station = "chill" | "desk" | "git";

export type Posture = "seated" | "standing" | "lounging";

export interface Spot {
  /** Plan coordinates: x across the room, z into it. */
  x: number;
  z: number;
  /** Height of the agent's base — a sofa and a beanbag sit at different heights. */
  y: number;
  /** Facing, in radians, where 0 looks toward the camera (+z). */
  facing: number;
  posture: Posture;
}

/** Which station a project's agent belongs at, given what its session is doing. */
export function stationFor(state: AgentState, command?: string): Station {
  if (state === "idle") return "chill";
  if (command && classifyCommand(command) === STEP_BITS.push) return "git";
  return "desk";
}

/** The seat behind a project's own desk. */
export function deskSpot(slot: number): Spot {
  const place = deskSlot(slot);
  return {
    x: place.robot.x - place.out.x * 0.22,
    z: place.robot.y - place.out.z * 0.22,
    y: 0.42,
    // Turned to face the bench, tipped slightly so the visor still catches the
    // camera in three-quarter view rather than presenting a flat back. The far
    // row faces the other way across the planter.
    facing: place.face + Math.PI - place.side * 0.34,
    posture: "seated",
  };
}

/**
 * A place in the lounge. The good seats go first — sofa, then beanbags — and
 * anyone after that stands around the coffee table, which is exactly how a
 * break room fills up.
 */
export function chillSpot(index: number, plan: OfficePlan): Spot {
  const Z = plan.zones.chill;
  // The lounge half of the recreation room only: the right-hand half belongs
  // to the carrom board and its four free agents, so project agents taking a
  // break keep to the sofa end and never walk through the game.
  const seats: Spot[] = [
    // Two on the sofa, facing the coffee table.
    { x: Z.x + 0.85, z: Z.y + 0.9, y: 0.4, facing: 0.12, posture: "seated" },
    { x: Z.x + 1.75, z: Z.y + 0.9, y: 0.4, facing: -0.12, posture: "seated" },
    // The blue tub chair and the bean bag, both turned in on the table.
    { x: Z.x + 0.45, z: Z.y + 2.5, y: 0.32, facing: 1.05, posture: "lounging" },
    { x: Z.x + 2.3, z: Z.y + 2.6, y: 0.22, facing: -1.0, posture: "lounging" },
  ];
  if (index < seats.length) return seats[index];

  // Latecomers stand between the lounge and the coffee station, still short of
  // the board, so the group closes into a circle rather than crowding the game.
  const spare = index - seats.length;
  const column = spare % 3;
  const row = Math.floor(spare / 3);
  return {
    x: Z.x + 0.7 + column * 0.78,
    z: Z.y + 3.4 + row * 0.6,
    y: 0,
    facing: Math.PI - 0.25 + column * 0.2,
    posture: "standing",
  };
}

/** A place at the git station, standing at the review table. */
export function gitSpot(index: number, plan: OfficePlan): Spot {
  const Z = plan.zones.review;
  const column = index % 4;
  const row = Math.floor(index / 4);
  return {
    x: Z.x + 0.8 + column * 0.95,
    z: Z.y + 1.75 + row * 0.6,
    y: 0,
    facing: Math.PI,
    posture: "standing",
  };
}

export function spotFor(station: Station, slot: number, index: number, plan: OfficePlan): Spot {
  if (station === "desk") return deskSpot(slot);
  if (station === "git") return gitSpot(index, plan);
  return chillSpot(index, plan);
}

/**
 * The open band an agent crosses the room in.
 *
 * The benches run front to back, so left-to-right travel has to happen either
 * behind them (the strip in front of the social wing) or in front of them (the
 * strip behind the git station). Whichever end of the journey is not a desk
 * decides which.
 */
function crossLane(from: Station, to: Station, plan: OfficePlan): number {
  if (from === "git" || to === "git") return plan.zones.review.y - 0.85;
  return backAisle();
}

export type Waypoint = [x: number, z: number];

/**
 * A walkable route between two stations.
 *
 * Four legs at most: sideways out of your seat into the aisle beside the run,
 * down that aisle to an open band, across the room in that band, then back in
 * at the other end. It is the path a person would take through a room of
 * benches, and — more practically — it is the only one that never walks
 * anybody through a monitor.
 */
export function routeBetween(
  from: Waypoint,
  to: Spot,
  fromStation: Station,
  toStation: Station,
  slot: number,
  plan: OfficePlan,
): Waypoint[] {
  // Already there: no route, so nobody takes a lap around the aisle on mount.
  if (fromStation === toStation && Math.hypot(from[0] - to.x, from[1] - to.z) < 0.06) {
    return [[to.x, to.z]];
  }

  const cross = crossLane(fromStation, toStation, plan);
  // A desk is left and entered sideways, through the aisle beside its run.
  const aisle = rowAisle(slot);
  const outX = fromStation === "desk" ? aisle : from[0];
  const inX = toStation === "desk" ? aisle : to.x;

  const points: Waypoint[] = [from];
  if (fromStation === "desk") points.push([outX, from[1]]);
  points.push([outX, cross], [inX, cross]);
  if (toStation === "desk") points.push([inX, to.z]);
  points.push([to.x, to.z]);

  // Drop points that are effectively where we already are, so a short hop
  // does not stutter through a pile of identical waypoints.
  const route: Waypoint[] = [];
  for (const point of points) {
    const last = route[route.length - 1];
    if (last && Math.hypot(point[0] - last[0], point[1] - last[1]) < 0.06) continue;
    route.push(point);
  }
  return route;
}
