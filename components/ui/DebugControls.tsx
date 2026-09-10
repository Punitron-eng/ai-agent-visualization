"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AGENT_STATES, type AgentState } from "@/lib/agent/agentTypes";
import { useAgentStore, useProject, useProjectIds } from "@/store/agentStore";

/**
 * Drives states without running Claude Code. The buttons POST to the real
 * /api/hook endpoint rather than writing to the store, so pressing one
 * exercises the whole pipeline: transport, normalizer, registry, SSE, render.
 */
export function DebugControls() {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<string>("");
  const ids = useProjectIds();
  const firstPath = useAgentStore((s) => (ids[0] ? s.projects[ids[0]]?.path : undefined));

  const selected = target || firstPath || "";

  const send = async (state: AgentState) => {
    if (!selected) return;
    await fetch("/api/hook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ __debug: true, projectPath: selected, state }),
    }).catch(() => {
      // The panel is a dev aid; a failed POST should not raise anything.
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="w-[268px] rounded-xl border p-3 backdrop-blur"
            style={{
              borderColor: "var(--edge-bright)",
              background: "color-mix(in oklab, var(--panel) 92%, transparent)",
              boxShadow: "0 20px 50px -20px rgba(0,0,0,1)",
            }}
          >
            <label className="mb-2 block text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              target project
            </label>
            <select
              value={selected}
              onChange={(event) => setTarget(event.target.value)}
              className="mb-3 w-full cursor-pointer rounded-md border px-2 py-1.5 text-[11px] text-ink outline-none"
              style={{ borderColor: "var(--edge-bright)", background: "var(--ground)" }}
            >
              {ids.map((id) => (
                <ProjectOption key={id} id={id} />
              ))}
            </select>

            <div className="grid grid-cols-3 gap-1.5">
              {AGENT_STATES.map((state) => (
                <button
                  key={state}
                  type="button"
                  data-state={state}
                  onClick={() => void send(state)}
                  className="cursor-pointer rounded-md border px-1.5 py-1.5 text-[10px] font-medium capitalize transition-colors"
                  style={{
                    borderColor: "color-mix(in oklab, var(--accent) 45%, transparent)",
                    color: "var(--accent)",
                    background: "color-mix(in oklab, var(--accent) 10%, transparent)",
                  }}
                >
                  {state}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[9.5px] leading-snug text-ink-faint">
              Posts to <span className="font-mono">/api/hook</span> — the same endpoint Claude Code
              uses.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="cursor-pointer rounded-full border px-3 py-1.5 text-[11px] text-ink-dim transition-colors hover:text-ink"
        style={{
          borderColor: "var(--edge-bright)",
          background: "color-mix(in oklab, var(--panel) 88%, transparent)",
        }}
      >
        {open ? "close" : "debug"}
      </button>
    </div>
  );
}

/** Reads one project so the option list never rebuilds an array of new objects. */
function ProjectOption({ id }: { id: string }) {
  const project = useProject(id);
  if (!project) return null;
  return <option value={project.path}>{project.name}</option>;
}
