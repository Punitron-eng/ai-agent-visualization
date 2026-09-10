"use client";

import { memo } from "react";
import { motion } from "motion/react";
import type { AgentState } from "@/lib/agent/agentTypes";
import { STATE_LABEL, STATE_SHORT } from "@/components/character/motion/stateVariants";

export interface AgentStatusProps {
  state: AgentState;
  compact?: boolean;
}

/** The small "● Claude is coding" tell. Deliberately quiet next to the robot. */
function AgentStatusImpl({ state, compact = false }: AgentStatusProps) {
  const pulsing = state !== "idle" && state !== "success";

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5"
      style={{
        borderColor: "color-mix(in oklab, var(--accent) 40%, transparent)",
        background: "color-mix(in oklab, var(--accent) 12%, transparent)",
      }}
    >
      <motion.span
        className="block size-1.5 rounded-full"
        style={{ background: "var(--accent)" }}
        animate={pulsing ? { opacity: [1, 0.35, 1], scale: [1, 0.85, 1] } : { opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, repeat: pulsing ? Infinity : 0, ease: "easeInOut" }}
      />
      <span
        className={
          compact
            ? "text-[9.5px] font-semibold tracking-[0.09em]"
            : "text-[11px] font-medium tracking-wide"
        }
        style={{ color: "var(--accent)" }}
      >
        {compact ? STATE_SHORT[state] : `Claude is ${STATE_LABEL[state]}`}
      </span>
    </span>
  );
}

export const AgentStatus = memo(AgentStatusImpl);
