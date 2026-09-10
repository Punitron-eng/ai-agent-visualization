"use client";

import { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Robot3D } from "@/components/office3d/Robot3D";
import type { OfficePlan } from "@/components/office/layout";

/**
 * Free agents walking the floor.
 *
 * They are not projects and never claim to be — they are the office's crowd,
 * the thing that makes the room feel occupied rather than staged. Each one
 * follows a fixed loop of waypoints at its own pace, pausing now and then as
 * though it had somewhere to be.
 *
 * Note this deliberately keeps the render loop running while the tab is
 * visible: continuous motion and an idle-parked loop cannot both be true.
 * The loop still parks completely when the tab is hidden.
 */

export interface RoamersProps {
  plan: OfficePlan;
  animate: boolean;
}

const SPEED = 0.62;
/** How long a roamer lingers at a waypoint, in seconds. */
const PAUSE = 1.8;

function RoamersImpl({ plan, animate }: RoamersProps) {
  const routes = useMemo(() => buildRoutes(plan), [plan]);
  return (
    <>
      {routes.map((route, index) => (
        <Roamer key={index} route={route} animate={animate} seed={index * 3.1} speed={SPEED * (0.8 + index * 0.12)} />
      ))}
    </>
  );
}

type Route = Array<[number, number]>;

/**
 * Corridor loops derived from the floor plan, so the crowd walks the aisles
 * rather than through the furniture.
 */
function buildRoutes(plan: OfficePlan): Route[] {
  const { width, depth, zones: Z } = plan;
  const frontAisle = Z.testing.y - 0.9;
  const backAisle = Z.pods.y - 1.0;
  const midAisle = (backAisle + frontAisle) / 2;

  return [
    // The long lap: fuel counter, up the left aisle, across the back, down to deploy.
    [
      [Z.fuel.x + 2.0, Z.fuel.y + 2.4],
      [width - 3.0, frontAisle],
      [width - 2.2, backAisle],
      [Z.planning.x + 3.0, Z.planning.y + Z.planning.d + 0.7],
      [1.6, backAisle],
      [1.4, frontAisle],
    ],
    // A shorter loop between the desks and the review area.
    [
      [width * 0.32, midAisle],
      [width * 0.7, midAisle],
      [width * 0.72, frontAisle],
      [width * 0.3, frontAisle],
    ],
    // Chill zone to the coffee counter and back.
    [
      [Z.chill.x + 2.2, Z.chill.y + Z.chill.d + 0.8],
      [Z.fuel.x + 1.6, Z.fuel.y + 2.3],
      [Z.fuel.x + 3.4, backAisle],
      [width - 1.8, Z.chill.y + Z.chill.d + 0.9],
    ],
    // Deploy bay shuttle, carrying something between the racks and the floor.
    [
      [Z.deploy.x + 1.2, depth - 0.9],
      [Z.deploy.x + 4.2, depth - 1.1],
      [Z.review.x + 1.0, depth - 0.8],
    ],
  ];
}

function Roamer({
  route,
  animate,
  seed,
  speed,
}: {
  route: Route;
  animate: boolean;
  seed: number;
  speed: number;
}) {
  const group = useRef<THREE.Group>(null);
  const leg = useRef(0);
  const progress = useRef({ index: 0, t: 0, waiting: 0 });
  const facing = useRef(0);

  useFrame((_, rawDelta) => {
    const node = group.current;
    if (!node || !animate) return;
    // Clamp so a backgrounded tab returning does not teleport anyone.
    const delta = Math.min(rawDelta, 0.1);
    const state = progress.current;

    if (state.waiting > 0) {
      state.waiting -= delta;
      leg.current = 0;
      return;
    }

    const from = route[state.index];
    const to = route[(state.index + 1) % route.length];
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const length = Math.hypot(dx, dz) || 1;

    state.t += (delta * speed) / length;
    if (state.t >= 1) {
      state.t = 0;
      state.index = (state.index + 1) % route.length;
      // Pause at roughly every other stop, so the crowd is not metronomic.
      if ((state.index + Math.round(seed)) % 2 === 0) state.waiting = PAUSE;
      return;
    }

    node.position.x = from[0] + dx * state.t;
    node.position.z = from[1] + dz * state.t;

    // Turn smoothly toward the direction of travel.
    const target = Math.atan2(dx, dz);
    let diff = target - facing.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    facing.current += diff * Math.min(1, delta * 6);
    node.rotation.y = facing.current;

    leg.current += delta * speed * 7;
  });

  const start = route[0];

  return (
    <group ref={group} position={[start[0], 0, start[1]]}>
      <Robot3D
        position={[0, 0, 0]}
        state="idle"
        pose="standing"
        animate={animate}
        scale={0.95}
        seed={seed}
        walkPhase={leg}
      />
    </group>
  );
}

export const Roamers = memo(RoamersImpl);
