"use client";

import { memo } from "react";
import { motion } from "motion/react";
import type { ProjectId } from "@/lib/agent/agentTypes";
import { useActiveProjectIds, useAgentStore, useDormantProjectIds, useProject } from "@/store/agentStore";
import { STATE_SHORT } from "@/components/character/motion/stateVariants";

const NAV = [
  { key: "workspace", label: "Workspace", icon: WorkspaceIcon },
  { key: "projects", label: "Projects", icon: ProjectsIcon },
  { key: "activity", label: "Activity", icon: ActivityIcon },
] as const;

export type NavKey = (typeof NAV)[number]["key"];

/** Application chrome: this is a product, not a game, so it keeps a real shell. */
function OfficeSidebarImpl({
  nav,
  onNav,
}: {
  nav: NavKey;
  onNav(key: NavKey): void;
}) {
  const active = useActiveProjectIds();
  const dormant = useDormantProjectIds();

  return (
    <aside
      className="flex h-full w-[236px] shrink-0 flex-col border-r"
      style={{ borderColor: "var(--edge)", background: "var(--ground-deep)" }}
    >
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-5">
        <Mark />
        <span className="text-[14px] font-medium tracking-tight text-ink">Claude Code</span>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {NAV.map((item) => {
          const selected = nav === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNav(item.key)}
              className="relative flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] transition-colors"
              style={{ color: selected ? "var(--ink)" : "var(--ink-dim)" }}
            >
              {selected && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg border"
                  style={{
                    borderColor: "var(--edge-bright)",
                    background: "color-mix(in oklab, var(--panel-raised) 80%, transparent)",
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <item.icon />
              <span className="relative">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-3 thin-scroll">
        <SidebarSection title="Working" ids={active} />
        {dormant.length > 0 && <SidebarSection title="Quiet" ids={dormant} muted />}
      </div>

      <div className="border-t px-5 py-4" style={{ borderColor: "var(--edge)" }}>
        <p className="text-[11px] leading-snug text-ink-faint">
          Small agents.
          <br />
          Big progress.
        </p>
      </div>
    </aside>
  );
}

function SidebarSection({
  title,
  ids,
  muted = false,
}: {
  title: string;
  ids: ProjectId[];
  muted?: boolean;
}) {
  if (ids.length === 0) return null;
  return (
    <section className="mb-4">
      <p className="px-2 pb-1.5 text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
        {title} · {ids.length}
      </p>
      {ids.map((id) => (
        <SidebarProject key={id} id={id} muted={muted} />
      ))}
    </section>
  );
}

function SidebarProject({ id, muted }: { id: ProjectId; muted: boolean }) {
  const proj = useProject(id);
  const focus = useAgentStore((s) => s.focus);
  const focusedId = useAgentStore((s) => s.focusedId);
  if (!proj) return null;

  return (
    <button
      type="button"
      data-state={proj.state}
      onClick={() => focus(id)}
      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[color-mix(in_oklab,var(--panel-raised)_70%,transparent)]"
      style={{ opacity: muted ? 0.55 : 1 }}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: "var(--accent)", opacity: proj.state === "idle" ? 0.45 : 1 }}
      />
      <span
        className="min-w-0 flex-1 truncate text-[11.5px]"
        style={{ color: focusedId === id ? "var(--ink)" : "var(--ink-dim)" }}
      >
        {proj.name}
      </span>
      <span className="shrink-0 text-[8.5px] tracking-[0.08em]" style={{ color: "var(--accent)" }}>
        {STATE_SHORT[proj.state]}
      </span>
    </button>
  );
}

function Mark() {
  return (
    <span
      className="grid size-7 place-items-center rounded-md"
      style={{ background: "color-mix(in oklab, var(--clay) 22%, transparent)" }}
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path
          d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"
          stroke="var(--clay-light)"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function WorkspaceIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden>
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.4" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.4" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.4" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.4" stroke="currentColor" strokeWidth="1.3" fill="none" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden>
      <path
        d="M2 4.2A1.2 1.2 0 013.2 3h3l1.4 1.7h5.2A1.2 1.2 0 0114 5.9v6A1.2 1.2 0 0112.8 13H3.2A1.2 1.2 0 012 11.8z"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
      />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden>
      <path
        d="M1.6 8.4h3l1.9-4.8 2.6 9L11.6 8.4h2.8"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const OfficeSidebar = memo(OfficeSidebarImpl);
