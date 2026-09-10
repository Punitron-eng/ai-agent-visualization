"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { ProjectId } from "@/lib/agent/agentTypes";
import { useAnyBusy, useVibeStore, useWorkflowSignals } from "@/store/agentStore";
import { assignDesks, buildPlan, deskSlot, POD_COLUMNS } from "@/components/office/layout";
import { Room3D } from "@/components/office3d/Room3D";
import { Workstation3D } from "@/components/office3d/Workstation3D";
import { EmptyDesk3D } from "@/components/office3d/EmptyDesk3D";
import { Roamers } from "@/components/office3d/Roamers";
import { ProjectLabels, ZoneLabels } from "@/components/office3d/ProjectLabels";
import { VIBES, type Vibe } from "@/lib/agent/vibes";
import { applyVibe } from "@/components/office3d/resources";

export interface Office3DProps {
  ids: ProjectId[];
  animate: boolean;
  focusedId: ProjectId | null;
  onSelect(id: ProjectId): void;
}

const MIN_DESKS = POD_COLUMNS;

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
  const desks = useStableDesks(ids);
  const signals = useWorkflowSignals();
  const anyBusy = useAnyBusy();
  const vibeId = useVibeStore((s) => s.vibe);
  const vibe = VIBES[vibeId];


  const deskCount = Math.max(MIN_DESKS, ids.length);
  const plan = useMemo(() => buildPlan(deskCount), [deskCount]);
  const center = useMemo(
    () => new THREE.Vector3(plan.width / 2, 0.6, plan.depth / 2),
    [plan.width, plan.depth],
  );

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
        camera={{ position: [plan.width * 1.15, 13, plan.depth * 1.5], fov: 32, near: 0.5, far: 90 }}
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
        <fog attach="fog" args={[vibe.scene.ground, 44, 96]} />
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

        <Room3D plan={plan} animate={animate} signals={signals} />
        <Roamers plan={plan} animate={animate} />

        {emptySlots.map((slot) => {
          const place = deskSlot(slot);
          return <EmptyDesk3D key={`empty-${slot}`} x={place.x + 1.35} z={place.y + 0.75} />;
        })}

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

        <CameraRig focusedSlot={focusedId ? desks.get(focusedId) : undefined} />

        <OrbitControls
          makeDefault
          target={center}
          enableDamping
          dampingFactor={0.08}
          // Kept above the floor and inside a sane distance band so the room
          // cannot be lost or turned upside down.
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI / 2 - 0.06}
          minDistance={5}
          maxDistance={46}
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

/** Eases the camera toward a desk when a project is focused. */
function CameraRig({ focusedSlot }: { focusedSlot: number | undefined }) {
  const { camera, controls, invalidate } = useThree();
  const target = useRef(new THREE.Vector3());
  const eye = useRef(new THREE.Vector3());
  const active = useRef(false);

  useEffect(() => {
    if (focusedSlot === undefined) {
      active.current = false;
      return;
    }
    const place = deskSlot(focusedSlot);
    target.current.set(place.x + 1.35, 1.0, place.y + 0.9);
    eye.current.set(place.x + 1.35, 3.6, place.y + 6.2);
    active.current = true;
    invalidate();
  }, [focusedSlot, invalidate]);

  useFrame(() => {
    if (!active.current) return;
    const orbit = controls as unknown as { target: THREE.Vector3; update(): void } | null;
    camera.position.lerp(eye.current, 0.08);
    if (orbit?.target) {
      orbit.target.lerp(target.current, 0.08);
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
