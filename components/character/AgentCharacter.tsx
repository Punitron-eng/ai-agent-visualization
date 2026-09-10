"use client";

import { memo, useEffect, useState } from "react";
import { motion } from "motion/react";
import type { AgentState } from "@/lib/agent/agentTypes";
import {
  antennaVariants,
  bodyVariants,
  handLeftVariants,
  handRightVariants,
  headVariants,
  visorVariants,
} from "@/components/character/motion/stateVariants";

export interface AgentCharacterProps {
  state: AgentState;
  /** Per-scene gradient id prefix; ids must be unique across cards. */
  ids: { body: string; head: string; glow: string };
  /** Compact cards animate fewer layers; the focused scene runs everything. */
  fidelity?: "compact" | "full";
  /** Off-screen or hidden cards freeze entirely. */
  animate?: boolean;
}

/**
 * A layered SVG rig rather than a sprite or a 3D model: each part animates
 * independently, it stays crisp at any card size, and a dozen of them on one
 * screen still composite cheaply.
 *
 * Renders a bare <g> in a local 200x170 space so the scene owns the coordinate
 * system and can place the robot behind the desk exactly.
 */
function AgentCharacterImpl({ state, ids, fidelity = "full", animate = true }: AgentCharacterProps) {
  const blinking = useBlink(animate && fidelity === "full");
  const active = animate ? state : "idle";
  const full = fidelity === "full";

  return (
    <motion.g variants={bodyVariants} animate={active} initial={false} style={{ originY: 1 }}>
      {/* Shoulders / torso. The desk crops this, which is what sells "sitting". */}
      <path d="M62 168 Q60 112 80 100 L120 100 Q140 112 138 168 Z" fill={`url(#${ids.body})`} />
      <path d="M62 168 Q60 124 68 108 L78 112 Q71 130 74 168 Z" fill="#000" opacity="0.18" />

      {/* Chest light */}
      <rect x="86" y="118" width="28" height="19" rx="6" fill="#0d0b0a" opacity="0.9" />
      <motion.circle
        cx="100"
        cy="127.5"
        r="3.4"
        fill="var(--accent)"
        animate={animate ? { opacity: [0.45, 1, 0.45] } : { opacity: 0.7 }}
        transition={{
          duration: state === "coding" ? 0.62 : 2.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Arms reach forward onto the keyboard. */}
      <motion.g variants={handLeftVariants} animate={active} initial={false}>
        <path
          d="M70 118 Q52 130 50 146"
          stroke="var(--clay-dark)"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="50" cy="148" r="7" fill="var(--clay-light)" />
      </motion.g>
      <motion.g variants={handRightVariants} animate={active} initial={false}>
        <path
          d="M130 118 Q148 130 150 146"
          stroke="var(--clay-dark)"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="150" cy="148" r="7" fill="var(--clay-light)" />
      </motion.g>

      <motion.g variants={headVariants} animate={active} initial={false} style={{ originY: 1 }}>
        <rect x="93" y="92" width="14" height="14" rx="5" fill="var(--clay-dark)" />

        <motion.g
          variants={antennaVariants}
          animate={active}
          initial={false}
          style={{ originX: 0.5, originY: 1 }}
        >
          <line
            x1="100"
            y1="44"
            x2="100"
            y2="30"
            stroke="var(--clay-dark)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <circle cx="100" cy="27" r="5" fill="var(--accent)" />
          {full && <circle cx="100" cy="27" r="11" fill={`url(#${ids.glow})`} />}
        </motion.g>

        {/* Head shell */}
        <rect x="62" y="42" width="76" height="56" rx="21" fill={`url(#${ids.head})`} />
        <rect
          x="62"
          y="42"
          width="76"
          height="56"
          rx="21"
          fill="none"
          stroke="var(--clay-light)"
          strokeOpacity="0.4"
        />
        <rect x="56" y="62" width="8" height="18" rx="4" fill="var(--clay-dark)" />
        <rect x="136" y="62" width="8" height="18" rx="4" fill="var(--clay-dark)" />

        {/* Visor */}
        <rect x="71" y="55" width="58" height="29" rx="14.5" fill="#080706" />
        <motion.g
          variants={visorVariants}
          animate={active}
          initial={false}
          style={{ originX: 0.5, originY: 0.5 }}
        >
          <rect
            x="74"
            y="58"
            width="52"
            height="23"
            rx="11.5"
            fill="var(--accent)"
            opacity={blinking ? 0.07 : 1}
          />
          {full && !blinking && (
            <>
              <rect x="79" y="61" width="16" height="8" rx="4" fill="#fff" opacity="0.3" />
              <rect x="104" y="71" width="10" height="4.5" rx="2.2" fill="#fff" opacity="0.15" />
            </>
          )}
        </motion.g>
        {full && (
          <ellipse cx="100" cy="69" rx="44" ry="23" fill={`url(#${ids.glow})`} opacity="0.4" />
        )}
      </motion.g>
    </motion.g>
  );
}

/** Irregular blink so it reads as alive rather than metronomic. */
function useBlink(enabled: boolean): boolean {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let openTimer: ReturnType<typeof setTimeout>;
    const schedule = (): ReturnType<typeof setTimeout> =>
      setTimeout(
        () => {
          setBlinking(true);
          openTimer = setTimeout(() => {
            setBlinking(false);
            nextTimer = schedule();
          }, 120);
        },
        2600 + Math.random() * 4200,
      );

    let nextTimer = schedule();
    return () => {
      clearTimeout(nextTimer);
      clearTimeout(openTimer);
    };
  }, [enabled]);

  // Gated on `enabled` at the point of use rather than reset in the effect, so
  // a paused character never leaves a stale blink behind.
  return enabled && blinking;
}

export const AgentCharacter = memo(AgentCharacterImpl);
