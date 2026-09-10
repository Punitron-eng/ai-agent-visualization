"use client";

import { motion } from "motion/react";
import { useAgentStore } from "@/store/agentStore";

/** Whether the browser is attached to the bridge — not an agent state. */
export function ConnectionBadge() {
  const connected = useAgentStore((s) => s.connected);

  return (
    <span className="inline-flex items-center gap-1.5 text-[10.5px] tracking-wide text-ink-faint">
      <motion.span
        className="block size-1.5 rounded-full"
        style={{ background: connected ? "var(--ok)" : "var(--bad)" }}
        animate={connected ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
        transition={{ duration: 2.4, repeat: connected ? Infinity : 0, ease: "easeInOut" }}
      />
      {connected ? "bridge live" : "reconnecting"}
    </span>
  );
}
