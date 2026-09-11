import type { ProjectId } from "@/lib/agent/agentTypes";

/**
 * Floor plan of the office, in world units.
 *
 * The plan is computed from the number of projects rather than fixed: the
 * development pods grow toward the viewer, and the front band of zones moves
 * with them. That keeps the diorama dense at four desks and at twenty, with no
 * empty floor opening up in between.
 */

export const PLAN_WIDTH = 15.6;

/**
 * Benching clusters, not islands.
 *
 * The development floor is laid out the way a real open-plan office is: long
 * shared benches, three workstations down each side, people working back to
 * back across a planted divider. A project is given a *seat* on one of those
 * benches rather than a desk of its own, so ten projects fill two clusters
 * instead of scattering ten tables across the floor.
 */

/** One workstation's share of a bench run. */
export const SEAT_WIDTH = 2.2;
/** Workstations along one side of a cluster. */
export const SEATS_PER_SIDE = 3;
/** Seats in a whole cluster: three a side, back to back. */
export const CLUSTER_SEATS = SEATS_PER_SIDE * 2;
/** Length of one bench run, along its long axis. */
export const CLUSTER_LENGTH = SEATS_PER_SIDE * SEAT_WIDTH;

/**
 * Orientation.
 *
 * A run's long axis is world z, so from the main camera the benches lie across
 * the scene rather than driving away from it, and the two rows of screens face
 * each other left and right across the planter. Clusters repeat along world x.
 *
 * Nothing downstream hard-codes that choice: a seat publishes `out` (the unit
 * vector from the bench centre line toward whoever sits there), `along` (the
 * run's own axis) and `face` (the rotation that points a prop back at the
 * occupant), and every desk prop is placed with those three.
 */

/** Near end of every run, and the centre line of the first one. */
const RUN_ORIGIN_Z = 5.6;
const RUN_ORIGIN_X = 4.0;
/** Centre line to centre line, cluster to cluster: the run plus both aisles. */
const RUN_STEP = 4.6;
/** Half the bench depth — the top is worked from both sides. */
const BENCH_HALF_DEPTH = 0.75;
/** How far an occupant sits from the centre line of the bench. */
const SEAT_OFFSET = 1.0;
/** The clear strip beside a run, where its occupants get in and out. */
const SEAT_AISLE = 2.0;

/** Seats on one run: fill it before starting another. */
export const SEATS_PER_ROW = CLUSTER_SEATS;

/** Desk footprint, in world units. Shared by both renderers. */
export const DESK_WIDTH = BENCH_HALF_DEPTH * 2;
export const DESK_DEPTH = SEAT_WIDTH;

/**
 * Walkable lanes.
 *
 * Agents commute between the lounge, the benches and the git station, so the
 * plan has to say where the floor is actually clear. Front-to-back travel
 * happens in the aisles beside the runs; left-to-right travel happens in the
 * open bands behind and in front of the whole desking block.
 */

/** The clear strip behind the benches, in front of the social wing. */
export function backAisle(): number {
  return RUN_ORIGIN_Z - 1.3;
}

/** The clear strip in front of the benches, behind the front zones. */
export function frontAisle(): number {
  return RUN_ORIGIN_Z + CLUSTER_LENGTH + 1.0;
}

/** The aisle a seat is entered from: beside its own chair, clear of the run. */
export function rowAisle(slot: number): number {
  const place = deskSlot(slot);
  return place.bench.x + place.side * SEAT_AISLE;
}

/** Where every bench run sits, for the renderers that draw the furniture. */
export interface BenchRun {
  /** Centre of the run. */
  x: number;
  z: number;
  /** Length along the run's long axis (world z). */
  width: number;
}

export function benchRuns(deskCount: number): BenchRun[] {
  const runs: BenchRun[] = [];
  for (let row = 0; row < podRows(deskCount); row += 1) {
    runs.push({
      x: RUN_ORIGIN_X + row * RUN_STEP,
      z: RUN_ORIGIN_Z + CLUSTER_LENGTH / 2,
      width: CLUSTER_LENGTH,
    });
  }
  return runs;
}

export interface DeskSlot {
  /** Cell origin, kept for callers that place things relative to the seat. */
  x: number;
  y: number;
  /** Centre of the seat's own half of the bench top. */
  desk: { x: number; z: number };
  /** Centre of the whole bench run this seat belongs to. */
  bench: { x: number; z: number; width: number };
  /** +1 for the right-hand side of the run, -1 for the left. */
  side: 1 | -1;
  /** Unit vector from the bench centre line out toward this seat. */
  out: { x: number; z: number };
  /** Unit vector along the run. */
  along: { x: number; z: number };
  /** Y-rotation that points a prop back at the occupant. */
  face: number;
  /** Where the robot sits. */
  robot: { x: number; y: number };
  /** Where the HUD tag is tethered. */
  hud: { x: number; y: number; z: number };
}

export function deskSlot(index: number): DeskSlot {
  const row = Math.floor(index / CLUSTER_SEATS);
  const seat = index % CLUSTER_SEATS;
  // Seats fill one side of a run first, then the other, so a small team sits
  // shoulder to shoulder rather than shouting across the planter.
  const side: 1 | -1 = seat < SEATS_PER_SIDE ? 1 : -1;
  const column = seat % SEATS_PER_SIDE;

  const benchX = RUN_ORIGIN_X + row * RUN_STEP;
  const benchZ = RUN_ORIGIN_Z + CLUSTER_LENGTH / 2;
  // The far side is numbered back to front, so seat 3 sits back to back with
  // seat 0 rather than diagonally across the run.
  const seatZ =
    RUN_ORIGIN_Z +
    (side === 1 ? column : SEATS_PER_SIDE - 1 - column) * SEAT_WIDTH +
    SEAT_WIDTH / 2;
  const deskX = benchX + (side * BENCH_HALF_DEPTH) / 2;
  // A monitor with no rotation faces +z, so a quarter turn points it back
  // across the bench at whoever is sitting on this side.
  const face = (side * Math.PI) / 2;

  return {
    x: benchX - BENCH_HALF_DEPTH,
    y: seatZ - SEAT_WIDTH / 2,
    desk: { x: deskX, z: seatZ },
    bench: { x: benchX, z: benchZ, width: CLUSTER_LENGTH },
    side,
    out: { x: side, z: 0 },
    along: { x: 0, z: side },
    face,
    robot: { x: benchX + side * SEAT_OFFSET, y: seatZ },
    hud: { x: benchX + side * 0.2, y: seatZ, z: 1.85 },
  };
}

export function podRows(count: number): number {
  return Math.max(1, Math.ceil(count / CLUSTER_SEATS));
}

/** Centre line of each bench run, for the ceiling pendants above them. */
export function runCenters(deskCount: number): number[] {
  return benchRuns(deskCount).map((run) => run.x);
}

export type ZoneAnchor = "back" | "front";

export interface Zone {
  x: number;
  y: number;
  w: number;
  d: number;
  label: string;
  anchor: ZoneAnchor;
}

export interface OfficePlan {
  width: number;
  depth: number;
  zones: Record<ZoneKey, Zone>;
}

export type ZoneKey =
  | "planning"
  | "meeting"
  | "chill"
  | "pods"
  | "testing"
  | "review"
  | "deploy";

/** Zone geometry for a given number of desks. */
export function buildPlan(deskCount: number): OfficePlan {
  const rows = podRows(deskCount);
  // The desking block is a fixed depth now — a run is as deep as it is long —
  // and grows sideways instead, so the plate widens as clusters are added.
  const podsWidth = (rows - 1) * RUN_STEP + BENCH_HALF_DEPTH * 2 + 2.6;
  const width = Math.max(PLAN_WIDTH, RUN_ORIGIN_X + (rows - 1) * RUN_STEP + 4.2);
  const frontY = frontAisle() + 0.55;
  const depth = frontY + 2.9;

  return {
    width,
    depth,
    zones: {
      // Back: the social wing — two glass meeting rooms and the recreation
      // room, side by side across the top of the floor plate, so the room
      // reads desks → meetings → chill from the main camera.
      planning: { x: 0.4, y: 0.3, w: 4.5, d: 3.9, label: "Meeting 01", anchor: "back" },
      meeting: { x: 5.1, y: 0.3, w: 4.5, d: 3.9, label: "Meeting 02", anchor: "back" },
      chill: { x: 9.8, y: 0.3, w: width - 10.2, d: 3.9, label: "Chill", anchor: "back" },

      // Middle: the development floor, one seat per project.
      pods: {
        x: RUN_ORIGIN_X - BENCH_HALF_DEPTH - 1.3,
        y: RUN_ORIGIN_Z - 0.35,
        w: podsWidth,
        d: CLUSTER_LENGTH + 0.7,
        label: "Development",
        anchor: "back",
      },

      // Front: what happens to code once it is written.
      testing: { x: 0.4, y: frontY, w: 4.6, d: 2.6, label: "Test & Debug", anchor: "front" },
      review: { x: 5.4, y: frontY, w: 4.6, d: 2.6, label: "Git & Review", anchor: "front" },
      deploy: { x: 10.4, y: frontY, w: width - 10.8, d: 2.6, label: "Deploy", anchor: "front" },
    },
  };
}

/** Stable desk assignment: first seen, first served, and it never reshuffles. */
export function assignDesks(
  ids: ProjectId[],
  previous: Map<ProjectId, number>,
): Map<ProjectId, number> {
  const next = new Map<ProjectId, number>();
  const taken = new Set<number>();

  for (const id of ids) {
    const existing = previous.get(id);
    if (existing !== undefined && !taken.has(existing)) {
      next.set(id, existing);
      taken.add(existing);
    }
  }
  let cursor = 0;
  for (const id of ids) {
    if (next.has(id)) continue;
    while (taken.has(cursor)) cursor += 1;
    next.set(id, cursor);
    taken.add(cursor);
  }
  return next;
}
