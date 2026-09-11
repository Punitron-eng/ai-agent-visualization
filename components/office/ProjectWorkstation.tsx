"use client";

import { memo } from "react";
import { motion } from "motion/react";
import type { AgentState, ProjectId } from "@/lib/agent/agentTypes";
import { useProject } from "@/store/agentStore";
import { Chair, Desk, DeskKeyboard, DeskMonitor, LightPool, Mug, Plant } from "@/components/office/props";
import { deskSlot } from "@/components/office/layout";
import { project as iso } from "@/components/office/iso";

export interface ProjectWorkstationProps {
  id: ProjectId;
  slot: number;
  animate: boolean;
  hovered: boolean;
  dimmed: boolean;
  onHover(id: ProjectId | null): void;
  onSelect(id: ProjectId): void;
}

/**
 * One project as a physical desk, minus its occupant. Reads only its own store
 * slice, so activity in another repo never re-renders this workstation.
 */
function ProjectWorkstationImpl({
  id,
  slot,
  animate,
  hovered,
  dimmed,
  onHover,
  onSelect,
}: ProjectWorkstationProps) {
  const project = useProject(id);
  if (!project) return null;

  const place = deskSlot(slot);
  const state = project.state;
  // Second monitor appears for the states where the robot is genuinely
  // looking between things.
  const dualScreen = state === "searching" || state === "reading";

  return (
    <motion.g
      data-state={state}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(id)}
      className="cursor-pointer"
      animate={{ opacity: dimmed ? 0.35 : 1 }}
      transition={{ duration: 0.25 }}
      role="button"
      tabIndex={0}
      aria-label={`${project.name} — Claude is ${state}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect(id);
      }}
    >
      {/* Desk light pool, brighter on hover so the target is obvious. */}
      <LightPool
        x={place.x - 0.3}
        y={place.y - 0.2}
        w={3.3}
        d={2.9}
        color="var(--accent)"
        opacity={hovered ? 0.17 : state === "idle" ? 0.025 : 0.09}
      />

      <Desk x={place.x} y={place.y} w={2.7} d={1.5} />
      <DeskMonitor
        x={place.x + 0.5}
        y={place.y + 0.3}
        state={state}
        animate={animate}
        dense
      />
      {/* A second screen appears for the states where the agent is genuinely
          looking between two things. */}
      {dualScreen && (
        <DeskMonitor
          x={place.x + 1.68}
          y={place.y + 0.3}
          w={0.88}
          h={0.55}
          state={state === "searching" ? "reading" : "searching"}
          animate={animate}
          dense
        />
      )}
      <DeskKeyboard x={place.x + 0.82} y={place.y + 0.95} typing={animate && state === "coding"} />
      <Mug x={place.x + 2.3} y={place.y + 1.05} />

      {/* The chair sits on the near side of the desk, facing the screens. The
          agent is not drawn here — it belongs to the room and walks in from
          the lounge when its session has work. */}
      <Chair x={place.x + 1.05} y={place.y + 1.75} />

      {slot % 2 === 1 && <Plant x={place.x + 2.85} y={place.y + 0.05} scale={0.78} sway={animate} />}

      <StateBeacon x={place.x} y={place.y} state={state} animate={animate} />
    </motion.g>
  );
}

/**
 * A small floor beacon under the desk. At overview scale this is what lets you
 * read the whole office's state in one glance without reading any labels.
 */
function StateBeacon({
  x,
  y,
  state,
  animate,
}: {
  x: number;
  y: number;
  state: AgentState;
  animate: boolean;
}) {
  if (state === "idle") return null;
  const pulsing = animate && state !== "success";
  return (
    <motion.g
      animate={pulsing ? { opacity: [0.35, 0.9, 0.35] } : { opacity: 0.85 }}
      transition={{ duration: state === "coding" ? 0.9 : 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <ellipse
        cx={iso(x + 1.35, y + 2.4).sx}
        cy={iso(x + 1.35, y + 2.4).sy}
        rx={28}
        ry={14}
        fill="var(--accent)"
        opacity={0.35}
        style={{ filter: "blur(5px)" }}
      />
    </motion.g>
  );
}

export const ProjectWorkstation = memo(ProjectWorkstationImpl);
