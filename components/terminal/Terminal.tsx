"use client";

import { memo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { AgentState, MonitorLine } from "@/lib/agent/agentTypes";
import { TerminalLine } from "@/components/terminal/TerminalLine";

export interface TerminalProps {
  lines: MonitorLine[];
  state: AgentState;
  compact?: boolean;
  animate?: boolean;
}

/**
 * Everything shown here comes from a real event. Nothing is scripted, so an
 * empty session shows an empty prompt rather than invented activity.
 */
function TerminalImpl({ lines, state, compact = false, animate = true }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Only the tail is rendered: a card does not need 60 lines of DOM.
  const visible = lines.slice(compact ? -4 : -14);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lines.length]);

  return (
    <div
      ref={scrollRef}
      className="thin-scroll absolute inset-0 overflow-hidden px-[5%] py-[4.5%] font-mono"
      style={{ fontSize: compact ? "clamp(4px, 2.1cqw, 8px)" : "clamp(7px, 1.55cqw, 12px)" }}
    >
      <div className="flex items-center gap-1.5 pb-[3%] opacity-45">
        <span className="inline-block size-[0.55em] rounded-full" style={{ background: "var(--bad)" }} />
        <span className="inline-block size-[0.55em] rounded-full" style={{ background: "var(--amber)" }} />
        <span className="inline-block size-[0.55em] rounded-full" style={{ background: "var(--ok)" }} />
        <span className="ml-1 text-[0.85em] tracking-wide" style={{ color: "var(--ink-faint)" }}>
          claude
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="leading-[1.7]" style={{ color: "var(--ink-faint)" }}>
          <span style={{ color: "var(--accent)" }}>$</span> claude
          <Caret animate={animate} />
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {visible.map((line) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, x: -3 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <TerminalLine line={line} />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {visible.length > 0 && state !== "idle" && (
        <div className="leading-[1.7]" style={{ color: "var(--accent)" }}>
          <Caret animate={animate} />
        </div>
      )}
    </div>
  );
}

function Caret({ animate }: { animate: boolean }) {
  return (
    <motion.span
      className="ml-[0.35em] inline-block h-[1em] w-[0.5em] align-[-0.15em]"
      style={{ background: "var(--accent)" }}
      animate={animate ? { opacity: [1, 1, 0, 0] } : { opacity: 1 }}
      transition={{ duration: 1.05, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
    />
  );
}

export const Terminal = memo(TerminalImpl);
