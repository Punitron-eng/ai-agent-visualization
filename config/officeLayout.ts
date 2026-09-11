import type { OfficePlan, Zone } from "@/components/office/layout";

/**
 * Architectural configuration for the studio office.
 *
 * The floor plan itself still comes from `components/office/layout.ts` — that
 * is what the agents, desks and stations all read, so it stays the single
 * source of truth for *where things are*. This file describes how the shell is
 * built around it: wall heights, window bands, the city outside, and the
 * furniture arrays each zone is dressed with.
 *
 * Everything repeated lives in an array here rather than as duplicated JSX, so
 * adding a plant or a desk lamp is a data edit, not a new mesh by hand.
 */

export const SHELL = {
  /** Interior clear height, floor to ceiling soffit. */
  height: 3.5,
  /** Thickness of the perimeter wall and the slab edge below the floor. */
  wallThickness: 0.18,
  slab: 0.34,
  /** How far the floor plate oversails the walls, as in the reference render. */
  overhang: 0.55,
  /** Window band on the back wall: sill height and head height. */
  ribbon: { sill: 1.25, head: 2.75 },
  /** Full-height glazing on the right-hand wall. */
  curtain: { sill: 0.35, head: 3.1 },
} as const;

export interface CityBlock {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  far: boolean;
}

/**
 * A skyline, not a city. Deterministic so the view never shimmers between
 * renders, and deliberately coarse: it sits behind glass, tens of units away.
 */
export function cityBlocks(plan: OfficePlan): CityBlock[] {
  const blocks: CityBlock[] = [];
  let seed = 7;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  // Behind the back wall, spread wider than the room so the band never ends.
  for (let index = 0; index < 22; index += 1) {
    const far = index % 3 === 0;
    const width = 1.6 + rand() * 2.6;
    blocks.push({
      x: -6 + index * 1.35 + rand() * 0.6,
      z: far ? -26 - rand() * 9 : -13 - rand() * 5,
      width,
      depth: width * 0.9,
      height: (far ? 5 : 8) + rand() * (far ? 7 : 12),
      far,
    });
  }

  // Off the right-hand glazing.
  for (let index = 0; index < 14; index += 1) {
    const far = index % 3 === 1;
    const width = 1.8 + rand() * 2.4;
    blocks.push({
      x: plan.width + (far ? 34 + rand() * 12 : 21 + rand() * 7),
      z: -8 + index * 2.6 + rand() * 1.2,
      width,
      depth: width * 0.9,
      height: (far ? 5 : 9) + rand() * (far ? 6 : 11),
      far,
    });
  }

  return blocks;
}

export interface PlantSpot {
  x: number;
  z: number;
  /** 1 = a floor palm about 1.6 units tall. */
  scale: number;
  /** Small desk succulents sit on furniture rather than the floor. */
  y?: number;
}

/** Greenery, placed by hand: corners, window lines, and beside seating. */
export function plantSpots(plan: OfficePlan): PlantSpot[] {
  const { planning, meeting, chill, testing, review, deploy } = plan.zones;
  return [
    // Corners and the entrance.
    { x: 0.75, z: plan.depth - 0.9, scale: 1.15 },
    { x: 0.8, z: 0.95, scale: 1.0 },
    { x: plan.width - 0.8, z: 0.95, scale: 1.05 },
    { x: plan.width - 0.75, z: plan.depth - 1.0, scale: 1.2 },
    // Zone dressing.
    { x: planning.x + planning.w - 0.55, z: planning.y + 0.7, scale: 0.85 },
    { x: chill.x - 0.5, z: chill.y + 1.2, scale: 0.95 },
    { x: chill.x + chill.w + 0.35, z: chill.y + 2.7, scale: 0.8 },
    { x: meeting.x + meeting.w + 0.3, z: meeting.y + 2.6, scale: 0.9 },
    { x: testing.x + testing.w - 0.4, z: testing.y + 1.9, scale: 0.85 },
    { x: review.x - 0.35, z: review.y + 2.0, scale: 0.8 },
    { x: deploy.x - 0.4, z: deploy.y + 0.6, scale: 1.0 },
  ];
}

/** A pendant: where it hangs, and which way the tube points. */
export type LightRun = [x: number, z: number, rotation: number];

/**
 * Ceiling light runs — two over every bench, turned to lie along it — plus a
 * ring over each back zone.
 */
export function ceilingLights(plan: OfficePlan, benchX: number[]): LightRun[] {
  const runs: LightRun[] = [];
  const podsZ = plan.zones.pods.y;
  const podsD = plan.zones.pods.d;
  for (const x of benchX) {
    runs.push([x, podsZ + podsD * 0.28, Math.PI / 2]);
    runs.push([x, podsZ + podsD * 0.72, Math.PI / 2]);
  }
  runs.push([plan.zones.planning.x + plan.zones.planning.w / 2, plan.zones.planning.y + 1.7, 0]);
  runs.push([plan.zones.chill.x + plan.zones.chill.w / 2, plan.zones.chill.y + 1.9, 0]);
  runs.push([plan.zones.meeting.x + plan.zones.meeting.w / 2, plan.zones.meeting.y + 1.8, 0]);
  return runs;
}

/** Centre point of a zone, which is what hover labels and camera focus use. */
export function zoneCenter(zone: Zone): [number, number] {
  return [zone.x + zone.w / 2, zone.y + zone.d / 2];
}
