"use client";

import { memo, useId } from "react";
import { motion } from "motion/react";
import type { AgentState, MonitorLine } from "@/lib/agent/agentTypes";
import { AgentCharacter } from "@/components/character/AgentCharacter";
import { glowVariants } from "@/components/character/motion/stateVariants";
import { Terminal } from "@/components/terminal/Terminal";

export interface WorkstationSceneProps {
  state: AgentState;
  lines: MonitorLine[];
  fidelity?: "compact" | "full";
  animate?: boolean;
  subagents?: number;
}

/**
 * The whole scene lives in one SVG coordinate space (360x196) so the robot,
 * desk, keyboard and monitor keep their proportions at every size — CSS layout
 * between separate elements would drift as the card resizes.
 *
 * The terminal is real HTML positioned over the screen cut-out, because text
 * rendered as HTML stays crisp and selectable where SVG text would not.
 */
const SCREEN = { left: 55.8, top: 20.9, width: 40, height: 44.9 } as const;

function WorkstationSceneImpl({
  state,
  lines,
  fidelity = "full",
  animate = true,
  subagents = 0,
}: WorkstationSceneProps) {
  const full = fidelity === "full";
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${name}-${uid}`;

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 360 196" className="h-full w-full" role="img" aria-label={`Claude is ${state}`}>
        <defs>
          <linearGradient id={id("cc-body")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--clay-light)" />
            <stop offset="55%" stopColor="var(--clay)" />
            <stop offset="100%" stopColor="var(--clay-dark)" />
          </linearGradient>
          <linearGradient id={id("cc-head")} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="var(--clay-light)" />
            <stop offset="70%" stopColor="var(--clay)" />
            <stop offset="100%" stopColor="var(--clay-dark)" />
          </linearGradient>
          <radialGradient id={id("cc-visor-glow")} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id("desk")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--edge-bright)" />
            <stop offset="18%" stopColor="var(--edge)" />
            <stop offset="100%" stopColor="#0d0b0a" />
          </linearGradient>
          <linearGradient id={id("falloff")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d0b0a" />
            <stop offset="100%" stopColor="#0d0b0a" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={id("spill")} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Monitor spill: the key light of the scene. */}
        <motion.ellipse
          cx="215"
          cy="105"
          rx="170"
          ry="98"
          fill={`url(#${id("spill")})`}
          variants={glowVariants}
          animate={animate ? state : "idle"}
          initial={false}
        />

        {/* Robot, drawn before the desk so the desk crops its lower body. */}
        <g transform="translate(14 30) scale(0.85)">
          <AgentCharacter
            state={state}
            fidelity={fidelity}
            animate={animate}
            ids={{ body: id("cc-body"), head: id("cc-head"), glow: id("cc-visor-glow") }}
          />
        </g>

        {/* Monitor */}
        <MonitorFrame state={state} animate={animate} full={full} />

        {/* Desk: far edge, then the front face that occludes the robot's lower body. */}
        <rect x="0" y="166" width="360" height="18" fill={`url(#${id("desk")})`} />
        <rect x="0" y="166" width="360" height="1" fill="var(--edge-bright)" opacity="0.9" />
        <rect x="0" y="184" width="360" height="12" fill={`url(#${id("falloff")})`} />

        {/* Contact shadows under the things resting on the desk. */}
        <ellipse cx="273" cy="166.5" rx="40" ry="2.6" fill="#000" opacity="0.6" />
        <ellipse cx="100" cy="167" rx="62" ry="3" fill="#000" opacity="0.45" />

        <Keyboard state={state} animate={animate} />

        {/* Helper bots, one per live subagent. */}
        {subagents > 0 &&
          Array.from({ length: Math.min(subagents, 3) }).map((_, index) => (
            <motion.g
              key={index}
              animate={animate ? { y: [0, -3, 0] } : { y: 0 }}
              transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut", delay: index * 0.32 }}
            >
              <circle cx={172 + index * 17} cy={152} r="8" fill="var(--clay-dark)" />
              <rect x={166 + index * 17} y={148.5} width="12" height="5.5" rx="2.7" fill="var(--accent)" />
            </motion.g>
          ))}
      </svg>

      {/* Terminal, aligned to the screen cut-out in the SVG above. */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: `${SCREEN.left}%`,
          top: `${SCREEN.top}%`,
          width: `${SCREEN.width}%`,
          height: `${SCREEN.height}%`,
          containerType: "size",
        }}
      >
        <Terminal lines={lines} state={state} compact={!full} animate={animate} />
      </div>
    </div>
  );
}

function MonitorFrame({
  state,
  animate,
  full,
}: {
  state: AgentState;
  animate: boolean;
  full: boolean;
}) {
  return (
    <motion.g
      animate={animate && state === "error" ? { x: [0, -2.5, 2.5, -1, 0] } : { x: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* Stand, behind the panel so the joint is hidden. */}
      <path d="M265 128 h16 l5 33 h-26 z" fill="var(--edge)" />
      <rect x="248" y="160" width="50" height="6" rx="3" fill="var(--edge-bright)" />
      <rect x="248" y="160" width="50" height="1.4" rx="0.7" fill="#fff" opacity="0.07" />

      {/* Bezel */}
      <rect x="196" y="36" width="154" height="98" rx="6" fill="#141110" />
      <rect
        x="196"
        y="36"
        width="154"
        height="98"
        rx="6"
        fill="none"
        stroke={state === "error" ? "var(--bad)" : "var(--edge-bright)"}
        strokeWidth="1.3"
      />
      {/* Screen well */}
      <rect x="201" y="41" width="144" height="88" rx="2.5" fill="#07090a" />
      {full && <path d="M201 41 L246 41 L209 129 L201 129 Z" fill="#fff" opacity="0.04" />}
    </motion.g>
  );
}

/** Keys light up under the robot's hands while it types. */
function Keyboard({ state, animate }: { state: AgentState; animate: boolean }) {
  const typing = animate && state === "coding";
  return (
    <g>
      <rect x="44" y="157" width="116" height="11" rx="2.5" fill="#1b1614" />
      <rect x="44" y="157" width="116" height="1" rx="0.5" fill="#fff" opacity="0.09" />
      {Array.from({ length: 14 }).map((_, index) => (
        <motion.rect
          key={index}
          x={48 + index * 7.9}
          y={159.6}
          width="5.6"
          height="3.6"
          rx="1"
          fill="#8b7a70"
          animate={
            typing
              ? { y: [159.6, 160.9, 159.6], fill: ["#8b7a70", "var(--accent)", "#8b7a70"] }
              : { y: 159.6, fill: "#8b7a70" }
          }
          transition={
            typing
              ? { duration: 0.34, repeat: Infinity, ease: "easeInOut", delay: (index % 5) * 0.07 }
              : { duration: 0.3 }
          }
        />
      ))}
    </g>
  );
}

export const WorkstationScene = memo(WorkstationSceneImpl);
