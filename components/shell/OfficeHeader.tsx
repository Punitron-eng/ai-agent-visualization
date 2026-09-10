"use client";

import { memo } from "react";
import { useAgentStore } from "@/store/agentStore";
import { useOfficeCounts } from "@/components/office/OfficeScene";
import { WorkflowBar } from "@/components/shell/WorkflowBar";
import { ConnectionBadge } from "@/components/ui/ConnectionBadge";
import { VibeSwitcher } from "@/components/ui/VibeSwitcher";

export interface OfficeHeaderProps {
  query: string;
  onQuery(value: string): void;
}

/**
 * Everything counted here comes from live project state. There are no
 * decorative metrics: when nothing is running, the header says so.
 */
function OfficeHeaderImpl({ query, onQuery }: OfficeHeaderProps) {
  const counts = useOfficeCounts();
  const projectTotal = useAgentStore((s) => s.order.length);

  const headline =
    counts.error > 0
      ? "Your engineering floor needs you."
      : counts.working > 0
        ? "Your engineering floor is active."
        : counts.active > 0
          ? "The floor is quiet."
          : "Nobody has clocked in yet.";

  const subline =
    counts.active === 0
      ? `${projectTotal} ${projectTotal === 1 ? "project" : "projects"} known · no live sessions`
      : `${counts.working} of ${counts.active} ${counts.active === 1 ? "agent" : "agents"} working across ${projectTotal} ${projectTotal === 1 ? "project" : "projects"}`;

  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 px-8 pb-4 pt-6">
      <div className="min-w-0">
        <h1 className="text-[19px] font-medium leading-tight tracking-[-0.01em] text-ink">
          {headline}
        </h1>
        <p className="mt-1 text-[12px] text-ink-faint">{subline}</p>

        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Pill value={counts.working} label="working" tone="var(--visor)" />
          <Pill value={counts.waiting} label="awaiting you" tone="var(--amber)" />
          <Pill value={counts.idle} label="idle" tone="var(--ink-faint)" />
          {counts.error > 0 && <Pill value={counts.error} label="errored" tone="var(--bad)" />}
        </div>
      </div>

      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-3">
          <label className="relative block">
            <span className="sr-only">Search projects</span>
            <svg
              viewBox="0 0 16 16"
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint"
              aria-hidden
            >
              <circle cx="7" cy="7" r="4.6" stroke="currentColor" strokeWidth="1.3" fill="none" />
              <path d="M10.6 10.6L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search projects"
              className="w-[210px] rounded-lg border py-1.5 pl-8 pr-3 text-[12px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-[var(--edge-bright)]"
              style={{
                borderColor: "var(--edge)",
                background: "color-mix(in oklab, var(--panel) 55%, transparent)",
              }}
            />
          </label>
          <ConnectionBadge />
        </div>
        <div className="flex items-center gap-3">
          <VibeSwitcher />
          <WorkflowBar />
        </div>
      </div>
    </header>
  );
}

/** A count with a state dot. Zero values stay visible so the row does not jump. */
function Pill({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span
        className="inline-block size-1.5 translate-y-[-1px] rounded-full"
        style={{ background: tone, opacity: value === 0 ? 0.35 : 1 }}
      />
      <span
        className="text-[13px] font-medium tabular-nums"
        style={{ color: value === 0 ? "var(--ink-faint)" : "var(--ink)" }}
      >
        {value}
      </span>
      <span className="text-[11px] text-ink-faint">{label}</span>
    </span>
  );
}

export const OfficeHeader = memo(OfficeHeaderImpl);
