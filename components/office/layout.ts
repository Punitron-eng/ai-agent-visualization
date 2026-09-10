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

const POD_ORIGIN = { x: 0.7, y: 4.5 };
const POD_STEP = { x: 3.6, y: 3.15 };
export const POD_COLUMNS = 4;

export interface DeskSlot {
  x: number;
  y: number;
  /** Where the robot sits, behind the desk. */
  robot: { x: number; y: number };
  /** Where the HUD tag is tethered. */
  hud: { x: number; y: number; z: number };
}

export function deskSlot(index: number): DeskSlot {
  const column = index % POD_COLUMNS;
  const row = Math.floor(index / POD_COLUMNS);
  const x = POD_ORIGIN.x + column * POD_STEP.x;
  const y = POD_ORIGIN.y + row * POD_STEP.y;
  return {
    x,
    y,
    robot: { x: x + 1.35, y: y + 1.9 },
    hud: { x: x + 1.35, y: y + 0.2, z: 1.85 },
  };
}

export function podRows(count: number): number {
  return Math.max(1, Math.ceil(count / POD_COLUMNS));
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

export type ZoneKey = "planning" | "chill" | "fuel" | "pods" | "testing" | "review" | "deploy";

/** Zone geometry for a given number of desks. */
export function buildPlan(deskCount: number): OfficePlan {
  const rows = podRows(deskCount);
  const podsDepth = rows * POD_STEP.y;
  const frontY = POD_ORIGIN.y + podsDepth + 0.35;
  const depth = frontY + 2.9;

  return {
    width: PLAN_WIDTH,
    depth,
    zones: {
      // Back: where work is decided, and where agents recover.
      planning: { x: 0.4, y: 0.3, w: 6.0, d: 3.6, label: "Planning", anchor: "back" },
      chill: { x: 7.0, y: 0.3, w: 4.2, d: 3.6, label: "Chill", anchor: "back" },
      fuel: { x: 11.8, y: 0.3, w: 3.4, d: 3.6, label: "Fuel", anchor: "back" },

      // Middle: the development floor, one desk per project.
      pods: {
        x: 0.5,
        y: POD_ORIGIN.y - 0.35,
        w: PLAN_WIDTH - 1,
        d: podsDepth,
        label: "Development",
        anchor: "back",
      },

      // Front: what happens to code once it is written.
      testing: { x: 0.4, y: frontY, w: 4.6, d: 2.6, label: "Test & Debug", anchor: "front" },
      review: { x: 5.4, y: frontY, w: 4.6, d: 2.6, label: "Git & Review", anchor: "front" },
      deploy: { x: 10.4, y: frontY, w: 4.8, d: 2.6, label: "Deploy", anchor: "front" },
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
