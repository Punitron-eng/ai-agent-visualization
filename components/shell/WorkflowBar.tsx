"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { useWorkflowSignals } from "@/store/agentStore";

const STEPS = [
  { key: "plan", label: "Plan" },
  { key: "build", label: "Build" },
  { key: "test", label: "Test" },
  { key: "push", label: "Push" },
  { key: "deploy", label: "Deploy" },
] as const;

/**
 * Where the floor is in the engineering cycle right now.
 *
 * Every step is read off live state — `thinking` lights Plan, an actual `git`
 * command lights Push, an actual build command lights Deploy. Steps behind the
 * furthest-active one read as done, so the bar tells the story of the current
 * pass without inventing progress.
 */
function WorkflowBarImpl() {
  const s = useWorkflowSignals();
  const active = [s.planning, s.building, s.testing, s.reviewing, s.deploying];
  const furthest = active.lastIndexOf(true);

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, index) => {
        const isActive = active[index];
        const isDone = !isActive && furthest > index;
        return (
          <div key={step.key} className="flex items-center gap-1">
            {index > 0 && (
              <span
                className="block h-px w-4"
                style={{
                  background: furthest >= index ? "var(--edge-bright)" : "var(--edge)",
                }}
              />
            )}
            <span className="flex items-center gap-1.5 rounded-full px-1.5 py-1">
              {isActive ? (
                <motion.span
                  className="block size-[7px] rounded-full"
                  style={{ background: "var(--ok)" }}
                  animate={{ opacity: [1, 0.35, 1], scale: [1, 0.82, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : isDone ? (
                <span
                  className="block size-[7px] rounded-full"
                  style={{ background: "var(--ok)", opacity: 0.45 }}
                />
              ) : (
                <span
                  className="block size-[7px] rounded-full border"
                  style={{ borderColor: "var(--edge-bright)" }}
                />
              )}
              <span
                className="text-[9.5px] font-medium uppercase tracking-[0.14em]"
                style={{
                  color: isActive ? "var(--ink)" : isDone ? "var(--ink-dim)" : "var(--ink-faint)",
                }}
              >
                {step.label}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export const WorkflowBar = memo(WorkflowBarImpl);
