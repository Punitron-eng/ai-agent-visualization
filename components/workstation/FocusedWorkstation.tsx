"use client";

import { useEffect } from "react";
import type { ProjectId } from "@/lib/agent/agentTypes";
import { useAgentStore, useProject } from "@/store/agentStore";
import { Terminal } from "@/components/terminal/Terminal";
import { AgentStatus } from "@/components/ui/AgentStatus";
import { RelativeTime } from "@/components/ui/RelativeTime";

/**
 * The detail panel for a focused project.
 *
 * It deliberately does not draw the workstation: the camera has already flown
 * to the real desk in the room behind this panel. What the room cannot show is
 * the actual text — the terminal, the file, the branch — so that is all this
 * carries.
 */
export function FocusedWorkstation({ id }: { id: ProjectId }) {
  const project = useProject(id);
  const focus = useAgentStore((s) => s.focus);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") focus(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  if (!project) return null;

  const subagents = Object.values(project.sessions).reduce(
    (total, session) => total + session.subagents.length,
    0,
  );
  const sessionCount = Object.keys(project.sessions).length;

  return (
    <section
      data-state={project.state}
      className="pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-xl border backdrop-blur-md"
      style={{
        borderColor: "var(--edge-bright)",
        background: "color-mix(in oklab, var(--panel) 88%, transparent)",
        boxShadow: "0 24px 60px -24px rgba(0,0,0,0.95)",
      }}
    >
      <span
        aria-hidden
        className="h-px w-full shrink-0"
        style={{ background: "var(--accent)" }}
      />

      <header className="flex items-start justify-between gap-3 px-4 pt-3.5">
        <div className="min-w-0">
          <h2 className="truncate text-[14px] font-medium tracking-tight text-ink">
            {project.name}
          </h2>
          <p className="truncate font-mono text-[10px] text-ink-faint">{project.path}</p>
        </div>
        <button
          type="button"
          onClick={() => focus(null)}
          className="shrink-0 cursor-pointer rounded-md border px-2 py-1 text-[10px] text-ink-dim transition-colors hover:text-ink"
          style={{ borderColor: "var(--edge-bright)" }}
        >
          Esc
        </button>
      </header>

      <div className="px-4 pt-3">
        <AgentStatus state={project.state} />
      </div>

      {/* The real terminal for this project, straight from live events. */}
      <div
        className="relative mx-4 mt-3 overflow-hidden rounded-lg border"
        style={{
          borderColor: "var(--edge)",
          background: "#07090a",
          height: 190,
          containerType: "size",
        }}
      >
        <Terminal lines={project.terminal} state={project.state} animate />
      </div>

      <dl
        className="grid grid-cols-2 gap-x-4 gap-y-2.5 px-4 py-3.5 text-[10.5px]"
        style={{ borderColor: "var(--edge)" }}
      >
        <Fact label="model" value={project.model ?? "—"} />
        <Fact label="branch" value={project.gitBranch ?? "—"} />
        <Fact
          label="sessions"
          value={
            sessionCount === 0
              ? "—"
              : `${sessionCount}${subagents ? ` · ${subagents} agents` : ""}`
          }
        />
        <Fact
          label="tokens"
          value={
            project.tokens
              ? `${compact(project.tokens.input)} in / ${compact(project.tokens.output)} out`
              : "—"
          }
        />
        <div className="col-span-2 min-w-0">
          <dt className="text-ink-faint">{project.command ? "command" : "file"}</dt>
          <dd className="truncate font-mono text-ink-dim">
            {project.command ? `$ ${project.command}` : (project.file ?? "—")}
          </dd>
        </div>
        <div className="col-span-2 min-w-0">
          <dt className="text-ink-faint">last activity</dt>
          <dd className="text-ink-dim">
            <RelativeTime timestamp={project.lastActivityAt} />
          </dd>
        </div>
      </dl>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="truncate text-ink-dim">{value}</dd>
    </div>
  );
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}
