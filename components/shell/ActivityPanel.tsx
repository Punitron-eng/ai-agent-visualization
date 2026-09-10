"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import type { MonitorLineKind } from "@/lib/agent/agentTypes";
import { useAgentStore } from "@/store/agentStore";
import { RelativeTime } from "@/components/ui/RelativeTime";

const TONE: Record<MonitorLineKind, string> = {
  read: "var(--visor)",
  search: "#5ab8f0",
  edit: "var(--clay-light)",
  run: "var(--amber)",
  info: "var(--ink-faint)",
  ok: "var(--ok)",
  fail: "var(--bad)",
};

/** Turns a raw terminal line into something that reads like a changelog entry. */
function phrase(kind: MonitorLineKind, text: string): string {
  if (kind === "edit") return text.replace(/^edit /, "Edited ");
  if (kind === "read") return text.replace(/^read /, "Read ");
  if (kind === "search") return text.replace(/^search /, "Searched ");
  if (kind === "run") return text.replace(/^\$ /, "Ran ");
  if (kind === "ok") return "Finished";
  if (kind === "fail") return text;
  return text.replace(/^> /, "Prompted: ");
}

/**
 * A compact timeline across every project. It sits under the office rather
 * than beside it, so it never competes with the scene for width.
 */
function ActivityPanelImpl() {
  const entries = useAgentStore(useShallow((s) => s.activity.slice(0, 4)));
  const focus = useAgentStore((s) => s.focus);

  return (
    <section
      className="mx-8 mb-5 rounded-xl border px-4 py-3 backdrop-blur-md"
      style={{
        borderColor: "var(--edge)",
        background: "color-mix(in oklab, var(--panel) 72%, transparent)",
      }}
    >
      <h2 className="mb-2 text-[9.5px] font-medium uppercase tracking-[0.16em] text-ink-faint">
        Activity
      </h2>

      {entries.length === 0 ? (
        <p className="py-1 text-[11.5px] text-ink-faint">
          Quiet. Entries appear the moment Claude Code touches a project.
        </p>
      ) : (
        <ol className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
          <AnimatePresence initial={false} mode="popLayout">
            {entries.map((entry) => (
              <motion.li
                key={entry.id}
                layout
                // Grid items default to min-width:auto, which lets a long
                // command push past its track instead of truncating.
                className="min-w-0"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  type="button"
                  onClick={() => focus(entry.projectId)}
                  className="group flex w-full cursor-pointer items-baseline gap-2.5 text-left"
                >
                  <span
                    className="mt-[1px] size-1.5 shrink-0 translate-y-[-1px] rounded-full"
                    style={{ background: TONE[entry.kind] }}
                  />
                  <span className="shrink-0 text-[11.5px] text-ink-dim transition-colors group-hover:text-ink">
                    {entry.projectName}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-ink-faint">
                    {phrase(entry.kind, entry.text)}
                  </span>
                  <span className="shrink-0 text-[10px] tabular-nums text-ink-faint">
                    <RelativeTime timestamp={entry.timestamp} />
                  </span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </section>
  );
}

export const ActivityPanel = memo(ActivityPanelImpl);
