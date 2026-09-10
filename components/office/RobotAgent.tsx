"use client";

import { memo, useId } from "react";
import { motion } from "motion/react";
import type { AgentState } from "@/lib/agent/agentTypes";
import { AgentCharacter } from "@/components/character/AgentCharacter";
import { project } from "@/components/office/iso";

export type RobotPose = "seated" | "standing";

export interface RobotAgentProps {
  /** World position; the robot's base lands here. */
  x: number;
  y: number;
  z?: number;
  state: AgentState;
  pose?: RobotPose;
  /** Overview robots animate cheaply; the focused one runs everything. */
  fidelity?: "compact" | "full";
  animate?: boolean;
  scale?: number;
  /** Mirrors the robot so a pair can face each other. */
  flip?: boolean;
}

/**
 * The office worker. Billboarded — always facing the camera — which is the
 * standard technique for characters in an isometric scene and keeps one robot
 * design working from every angle, exactly as the brief requires.
 */
function RobotAgentImpl({
  x,
  y,
  z = 0,
  state,
  pose = "seated",
  fidelity = "compact",
  animate = true,
  scale = 0.34,
  flip = false,
}: RobotAgentProps) {
  const uid = useId().replace(/:/g, "");
  const ids = {
    body: `rb-body-${uid}`,
    head: `rb-head-${uid}`,
    glow: `rb-glow-${uid}`,
  };
  const base = project(x, y, z);
  // Local rig is 200 wide; a seated robot is cropped at its torso (y=168) while
  // a standing one rests on its feet (y=190).
  const baseline = pose === "standing" ? 190 : 168;
  const originX = base.sx - 100 * scale;
  const originY = base.sy - baseline * scale;

  return (
    <g>
      <ellipse
        cx={base.sx}
        cy={base.sy + 2}
        rx={46 * scale}
        ry={17 * scale}
        fill="#000"
        opacity="0.45"
        style={{ filter: "blur(3px)" }}
      />
      <g transform={`translate(${originX} ${originY}) scale(${scale})${flip ? " translate(200 0) scale(-1 1)" : ""}`}>
        <defs>
          <linearGradient id={ids.body} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--clay-light)" />
            <stop offset="55%" stopColor="var(--clay)" />
            <stop offset="100%" stopColor="var(--clay-dark)" />
          </linearGradient>
          <linearGradient id={ids.head} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="var(--clay-light)" />
            <stop offset="70%" stopColor="var(--clay)" />
            <stop offset="100%" stopColor="var(--clay-dark)" />
          </linearGradient>
          <radialGradient id={ids.glow} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {pose === "standing" && <Legs state={state} animate={animate} />}
        <AgentCharacter state={state} fidelity={fidelity} animate={animate} ids={ids} />
      </g>
    </g>
  );
}

/** Standing robots need something below the torso; seated ones are desk-cropped. */
function Legs({ state, animate }: { state: AgentState; animate: boolean }) {
  const shifting = animate && (state === "thinking" || state === "waiting");
  return (
    <motion.g
      animate={shifting ? { y: [0, -1.5, 0] } : { y: 0 }}
      transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <rect x="78" y="160" width="17" height="26" rx="8" fill="var(--clay-dark)" />
      <rect x="105" y="160" width="17" height="26" rx="8" fill="var(--clay-dark)" />
      <ellipse cx="86" cy="188" rx="11" ry="5" fill="#2b201c" />
      <ellipse cx="113" cy="188" rx="11" ry="5" fill="#2b201c" />
    </motion.g>
  );
}

export const RobotAgent = memo(RobotAgentImpl);
