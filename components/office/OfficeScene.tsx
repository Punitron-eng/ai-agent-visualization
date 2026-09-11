"use client";

import { memo, useMemo, useRef, useState } from "react";
import type { ProjectId } from "@/lib/agent/agentTypes";
import { useAgentStore, useWorkflowSignals } from "@/store/agentStore";
import { planBounds, project as iso } from "@/components/office/iso";
import { Dust, EmptyDesk, OfficeEnvironment } from "@/components/office/OfficeEnvironment";
import { ProjectWorkstation } from "@/components/office/ProjectWorkstation";
import { AgentCrew } from "@/components/office/AgentCrew";
import { ProjectHud } from "@/components/office/ProjectHud";
import { useSceneTransform } from "@/components/office/useSceneTransform";
import { assignDesks, buildPlan, deskSlot, SEATS_PER_ROW, type Zone } from "@/components/office/layout";
import type { SceneTransform } from "@/components/office/useSceneTransform";

export interface OfficeSceneProps {
  ids: ProjectId[];
  animate: boolean;
  onSelect(id: ProjectId): void;
}

/** Never fewer than one full row of desks, so the pods never look half-built. */
/** Three full bench runs are always dressed, however few projects are open. */
const MIN_DESKS = SEATS_PER_ROW * 3;

/**
 * The office. Draw order is back-to-front (painter's algorithm) because SVG has
 * no depth buffer: the environment is authored in order, and the dynamic
 * workstations are sorted by slot, which increases with depth.
 */
function OfficeSceneImpl({ ids, animate, onSelect }: OfficeSceneProps) {
  const [hovered, setHovered] = useState<ProjectId | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const desks = useStableDesks(ids);

  const deskCount = Math.max(MIN_DESKS, ids.length);
  const plan = useMemo(() => buildPlan(deskCount), [deskCount]);

  const viewBox = useMemo(() => {
    const bounds = planBounds(plan.width, plan.depth, 2.4);
    const pad = 30;
    return [
      bounds.minX - pad,
      bounds.minY - pad,
      bounds.maxX - bounds.minX + pad * 2,
      bounds.maxY - bounds.minY + pad * 2,
    ].join(" ");
  }, [plan]);

  const signals = useWorkflowSignals();

  // Slot order is depth order: higher slots are nearer the viewer.
  const ordered = useMemo(() => [...desks.entries()].sort((a, b) => a[1] - b[1]), [desks]);

  const emptySlots = useMemo(() => {
    const taken = new Set(desks.values());
    const slots: number[] = [];
    for (let index = 0; index < deskCount; index += 1) {
      if (!taken.has(index)) slots.push(index);
    }
    return slots;
  }, [desks, deskCount]);

  const transform = useSceneTransform(stageRef, viewBox);

  return (
    <div ref={stageRef} className="relative h-full w-full">
      <svg
        viewBox={viewBox}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        aria-label="Office overview of every Claude Code project"
      >
        <OfficeEnvironment plan={plan} animate={animate} signals={signals} />

        {emptySlots.map((slot) => {
          const place = deskSlot(slot);
          return <EmptyDesk key={`empty-${slot}`} x={place.x} y={place.y} />;
        })}

        {ordered.map(([id, slot]) => (
          <ProjectWorkstation
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

        {/* Agents draw above the furniture: they are the only things in the
            scene that leave their tile, so they cannot be depth-sorted into
            the static back-to-front pass. */}
        <AgentCrew
          ordered={ordered}
          plan={plan}
          animate={animate}
          hovered={hovered}
          onHover={setHovered}
          onSelect={onSelect}
        />

        <Dust animate={animate} />
      </svg>

      {/* Labels live in container pixels, so their type never scales with the
          diorama. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {transform.ready && (
          <>
            {Object.entries(plan.zones).map(([key, zone]) => (
              <ZoneLabel key={key} zone={zone} transform={transform} />
            ))}
            {ordered.map(([id, slot]) => (
              <ProjectHud
                key={id}
                id={id}
                slot={slot}
                transform={transform}
                hovered={hovered === id}
                dimmed={hovered !== null && hovered !== id}
                onHover={setHovered}
                onSelect={onSelect}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Zone signage sits just outside the room — back zones above the wall, front
 * zones below the floor edge — so it never lands on top of furniture.
 */
function ZoneLabel({ zone, transform }: { zone: Zone; transform: SceneTransform }) {
  const back = zone.anchor === "back";
  const world = back
    ? iso(zone.x + zone.w / 2, zone.y, 2.35)
    : iso(zone.x + zone.w / 2, zone.y + zone.d, 0);
  const pos = transform.toScreen(world.sx, world.sy);

  return (
    <div
      className="pointer-events-none absolute select-none"
      style={{
        left: pos.left,
        top: pos.top,
        transform: back ? "translate(-50%, -190%)" : "translate(-50%, 55%)",
      }}
    >
      {back && <span className="mx-auto mb-1.5 block h-px w-7 bg-[var(--edge-bright)] opacity-60" />}
      <p className="whitespace-nowrap text-center text-[10px] font-medium uppercase tracking-[0.18em] text-ink/40">
        {zone.label}
      </p>
      {!back && <span className="mx-auto mt-1.5 block h-px w-7 bg-[var(--edge-bright)] opacity-60" />}
    </div>
  );
}

/**
 * Desk assignment is carried across renders so nobody's desk moves when a
 * project's state changes and the sort order shifts.
 *
 * Recomputed during render rather than in an effect: an effect would paint one
 * frame with the old seating before correcting itself.
 */
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

export const OfficeScene = memo(OfficeSceneImpl);

/**
 * Header counters. Selected as a packed number rather than an object: a
 * selector returning a fresh object would re-render on every store write.
 */
export interface OfficeCounts {
  active: number;
  working: number;
  waiting: number;
  idle: number;
  error: number;
}

export function useOfficeCounts(): OfficeCounts {
  const packed = useAgentStore((s) => {
    let active = 0;
    let working = 0;
    let waiting = 0;
    let idle = 0;
    let error = 0;
    for (const id of s.order) {
      const p = s.projects[id];
      if (!p || p.seeded) continue;
      active += 1;
      if (p.state === "idle") idle += 1;
      else if (p.state === "error") error += 1;
      else if (p.state === "waiting") waiting += 1;
      else working += 1;
    }
    return ((active * 100 + working) * 100 + waiting) * 10_000 + idle * 100 + error;
  });
  return {
    active: Math.floor(packed / 100_000_000),
    working: Math.floor(packed / 1_000_000) % 100,
    waiting: Math.floor(packed / 10_000) % 100,
    idle: Math.floor(packed / 100) % 100,
    error: packed % 100,
  };
}
