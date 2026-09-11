"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { ProjectId } from "@/lib/agent/agentTypes";
import { useAnyBusy, useVibeStore, useWorkflowSignals } from "@/store/agentStore";
import { assignDesks, buildPlan, deskSlot, SEATS_PER_ROW } from "@/components/office/layout";
import { StudioRoom } from "@/components/office3d/studio/StudioRoom";
import { Workstation3D } from "@/components/office3d/Workstation3D";
import { BenchClusters } from "@/components/office3d/studio/BenchCluster";
import { SocialWing } from "@/components/office3d/studio/social/SocialWing";
import { EmptyDesk3D } from "@/components/office3d/EmptyDesk3D";
import { OfficeAgents } from "@/components/office3d/OfficeAgents";
import { ProjectLabels, ZoneLabels } from "@/components/office3d/ProjectLabels";
import { VIBES, type Vibe } from "@/lib/agent/vibes";
import { applyVibe } from "@/components/office3d/resources";

export interface Office3DProps {
  ids: ProjectId[];
  animate: boolean;
  focusedId: ProjectId | null;
  onSelect(id: ProjectId): void;
}

/** Two full bench runs are always dressed, however few projects are open. */
const MIN_DESKS = SEATS_PER_ROW * 2;

/**
 * The office as a navigable 3D room.
 *
 * Performance shape, in rough order of impact:
 *  - shared geometry and materials (see `resources.ts`) — the scene is a fixed
 *    handful of GPU resources no matter how many projects are open;
 *  - no shadow maps anywhere: contact shadows are unlit discs, and screen
 *    spill is additive sprites rather than lights or a bloom pass;
 *  - three lights total, all of them cheap;
 *  - device pixel ratio clamped, so a 4K panel does not quadruple the fill cost;
 *  - the render loop stops entirely when nothing is moving (see `AdaptiveLoop`).
 */
function Office3DImpl({ ids, animate, focusedId, onSelect }: Office3DProps) {
  const [hovered, setHovered] = useState<ProjectId | null>(null);
  // A point the camera has been asked to visit that is not a desk — currently
  // only the carrom game, when the chill room is clicked.
  const [focusPoint, setFocusPoint] = useState<[number, number, number] | null>(null);
  const desks = useStableDesks(ids);
  const signals = useWorkflowSignals();
  const anyBusy = useAnyBusy();
  const vibeId = useVibeStore((s) => s.vibe);
  const vibe = VIBES[vibeId];


  const deskCount = Math.max(MIN_DESKS, ids.length);
  const plan = useMemo(() => buildPlan(deskCount), [deskCount]);
  const center = useMemo(
    () => new THREE.Vector3(plan.width / 2, 0.9, plan.depth / 2),
    [plan.width, plan.depth],
  );

  /**
   * The opening shot, derived from the plan rather than hard-coded: an
   * architectural three-quarter view from the open front-right corner, high
   * enough to read the whole floor plate at any project count.
   */
  const view = useMemo(() => {
    const span = Math.max(plan.width, plan.depth);
    return {
      // Direction is a fixed architectural three-quarter (about 37° above
      // the floor, off the open front-right corner); only the distance scales
      // with the plan, so the framing is identical at 4 desks and at 40.
      eye: [
        plan.width * 0.5 + span * 0.98,
        span * 0.95,
        plan.depth / 2 + span * 0.82,
      ] as [number, number, number],
      span,
    };
  }, [plan.width, plan.depth]);

  const ordered = useMemo(() => [...desks.entries()].sort((a, b) => a[1] - b[1]), [desks]);
  const emptySlots = useMemo(() => {
    const taken = new Set(desks.values());
    const slots: number[] = [];
    for (let index = 0; index < deskCount; index += 1) if (!taken.has(index)) slots.push(index);
    return slots;
  }, [desks, deskCount]);

  // Anything moving in the room? Drives the adaptive render loop.
  // Roamers walk continuously, so the room is never completely still while
  // visible. Rather than give up on-demand rendering, the loop runs full rate
  // when there is real work to watch and drops to a throttled rate otherwise.
  const busy = animate && (hovered !== null || anyBusy || focusedId !== null);

  return (
    <div className="relative h-full w-full">
      <Canvas
        // Clamped so a high-DPI panel does not multiply the fill cost.
        dpr={[1, 1.6]}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
        camera={{ position: view.eye, fov: 38, near: 0.5, far: 240 }}
        onPointerMissed={() => setHovered(null)}
      >
        <AdaptiveLoop busy={busy} visible={animate} />

        {/*
          Lighting budget, no shadow maps anywhere:
          a hemisphere for the ambient bounce (warm ceiling, warmer floor),
          a warm key through the windows, a cool fill from the screens' side,
          and exactly two real point lights for the lamps that most need to
          feel like sources. Everything else is emissive geometry and additive
          sprites, which cost nothing per fragment.
        */}
        {/* Declarative, so a vibe change re-renders instead of mutating the
            scene object behind React's back. */}
        <color attach="background" args={[vibe.scene.ground]} />
        <fog attach="fog" args={[vibe.scene.ground, 70, 190]} />
        <VibeSkin vibe={vibe} />
        <hemisphereLight
          args={[vibe.light.hemiSky, vibe.light.hemiGround, vibe.light.hemiIntensity]}
        />
        <ambientLight intensity={vibe.light.ambientIntensity} color={vibe.light.ambient} />
        <directionalLight position={[-10, 15, 8]} intensity={vibe.light.keyIntensity} color={vibe.light.keyColor} />
        <directionalLight position={[14, 8, 16]} intensity={vibe.light.fillIntensity} color={vibe.light.fillColor} />
        <pointLight position={[plan.width * 0.32, 3.1, plan.depth * 0.42]} intensity={vibe.light.lampIntensity * 1.1} distance={13} decay={2} color={vibe.light.lampColor} />
        <pointLight position={[plan.width * 0.78, 2.6, plan.depth * 0.16]} intensity={vibe.light.lampIntensity * 0.8} distance={11} decay={2} color={vibe.light.lampColor} />
        <pointLight position={[plan.width * 0.42, 2.6, plan.depth * 0.9]} intensity={vibe.light.lampIntensity * 0.9} distance={13} decay={2} color={vibe.light.lampColor} />

        <StudioRoom plan={plan} deskCount={deskCount} animate={animate} signals={signals} />

        {/* The bench runs: six workstations each, three a side. */}
        <BenchClusters deskCount={deskCount} />

        {/* Two glass meeting rooms and the recreation room, across the back. */}
        <SocialWing plan={plan} animate={animate} onFocus={setFocusPoint} />

        {/* One agent per project, and nobody else on the floor: they walk
            between the lounge, their desk and the git station. */}
        <OfficeAgents
          ordered={ordered}
          plan={plan}
          animate={animate}
          onHover={setHovered}
          onSelect={onSelect}
        />

        {emptySlots.map((slot) => (
          <EmptyDesk3D key={`empty-${slot}`} slot={slot} />
        ))}

        {ordered.map(([id, slot]) => (
          <Workstation3D
            key={id}
            id={id}
            slot={slot}
            animate={animate}
            hovered={hovered === id}
            dimmed={hovered !== null && hovered !== id}
            onHover={setHovered}
            onSelect={onSelect}
          />
        ))}

        <ZoneLabels zones={Object.values(plan.zones)} />

        <ProjectLabels
          ordered={ordered}
          hovered={hovered}
          onHover={setHovered}
          onSelect={onSelect}
        />

        <CameraRig
          focusedSlot={focusedId ? desks.get(focusedId) : undefined}
          // A selected project supersedes a room focus, so the two never fight
          // over the camera.
          focusPoint={focusedId === null ? focusPoint : null}
        />

        <OrbitControls
          makeDefault
          target={center}
          enableDamping
          dampingFactor={0.08}
          // Kept above the floor and inside a sane distance band so the room
          // cannot be lost or turned upside down.
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI / 2 - 0.06}
          minDistance={6}
          maxDistance={view.span * 2.6}
          panSpeed={0.7}
          rotateSpeed={0.55}
          zoomSpeed={0.8}
        />
      </Canvas>

      <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] tracking-wide text-ink-faint/70">
        drag to orbit · right-drag to pan · scroll to zoom
      </p>
    </div>
  );
}

/** Frames per second the office runs at when nobody is actively working. */
const QUIET_FPS = 20;

/**
 * Three render regimes rather than two.
 *
 *  - **Working** (an agent busy, or hover, or focus): full rate.
 *  - **Quiet** (everyone idle, tab visible): throttled to QUIET_FPS. The
 *    roamers still walk — they integrate delta, so a lower rate costs less
 *    without slowing anyone down — at roughly a third of the GPU time.
 *  - **Hidden tab**: the loop parks completely and draws nothing at all.
 */
function AdaptiveLoop({ busy, visible }: { busy: boolean; visible: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  const setFrameloop = useThree((state) => state.setFrameloop);

  useEffect(() => {
    const mode = busy && visible ? "always" : "demand";
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __ccLoop?: string }).__ccLoop = visible
        ? busy
          ? "always"
          : "quiet"
        : "parked";
    }
    setFrameloop(mode);
    if (mode === "demand") invalidate();
  }, [busy, visible, setFrameloop, invalidate]);

  // The quiet-rate pump. Nothing runs while the tab is hidden or at full rate.
  useEffect(() => {
    if (busy || !visible) return;
    const timer = setInterval(invalidate, 1000 / QUIET_FPS);
    return () => clearInterval(timer);
  }, [busy, visible, invalidate]);

  useFrame(() => {
    // useFrame only runs on a rendered frame, so this doubles as the render
    // counter the perf check reads.
    if (process.env.NODE_ENV !== "production") {
      const w = window as unknown as { __ccFrames?: number };
      w.__ccFrames = (w.__ccFrames ?? 0) + 1;
    }
  });

  return null;
}

/**
 * Eases the camera toward whatever is focused: a desk when a project is
 * selected, or an arbitrary point in the room when something like the carrom
 * game is clicked.
 *
 * The move ends by simply stopping — orbit control is never taken away, so the
 * user can grab the camera mid-flight or immediately after it lands.
 */
function CameraRig({
  focusedSlot,
  focusPoint,
}: {
  focusedSlot: number | undefined;
  focusPoint: [number, number, number] | null;
}) {
  const { camera, controls, invalidate } = useThree();
  const target = useRef(new THREE.Vector3());
  const eye = useRef(new THREE.Vector3());
  const active = useRef(false);

  useEffect(() => {
    if (focusedSlot !== undefined) {
      const place = deskSlot(focusedSlot);
      // Approached from the seat's own side of the run, so the focused screen
      // is facing the camera rather than edge-on to it.
      const seatX = place.robot.x;
      const seatZ = place.robot.y;
      target.current.set(seatX, 1.0, seatZ);
      eye.current.set(seatX + place.out.x * 4.6 + 1.6, 3.4, seatZ + place.out.z * 4.6 + 4.4);
    } else if (focusPoint) {
      // Low and close, from the open side of the room: a person's eye level at
      // the table rather than a plan view of it.
      const [x, y, z] = focusPoint;
      target.current.set(x, y, z);
      eye.current.set(x + 2.6, y + 2.3, z + 5.4);
    } else {
      active.current = false;
      return;
    }
    active.current = true;
    invalidate();
  }, [focusedSlot, focusPoint, invalidate]);

  useFrame(() => {
    if (!active.current) return;
    const orbit = controls as unknown as { target: THREE.Vector3; update(): void } | null;
    camera.position.lerp(eye.current, 0.06);
    if (orbit?.target) {
      orbit.target.lerp(target.current, 0.06);
      orbit.update();
    }
    invalidate();
    if (camera.position.distanceTo(eye.current) < 0.05) active.current = false;
  });

  return null;
}

/**
 * Re-skins the shared materials when the vibe changes.
 *
 * This mutates module-level materials rather than rebuilding them — the whole
 * point of sharing them — so it also has to ask for a frame, since nothing in
 * React's tree changed and the loop may be parked.
 */
function VibeSkin({ vibe }: { vibe: Vibe }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    applyVibe(vibe);
    invalidate();
  }, [vibe, invalidate]);
  return null;
}

/** Desk assignment is carried across renders so nobody's desk moves. */
function useStableDesks(ids: ProjectId[]): Map<ProjectId, number> {
  const key = ids.join("|");
  const [snapshot, setSnapshot] = useState(() => ({
    key,
    desks: assignDesks(ids, new Map<ProjectId, number>()),
  }));

  let current = snapshot;
  if (snapshot.key !== key) {
    current = { key, desks: assignDesks(ids, snapshot.desks) };
    setSnapshot(current);
  }
  return current.desks;
}

export const Office3D = memo(Office3DImpl);
