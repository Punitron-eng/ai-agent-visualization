"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useAgentStore, useProjectIds } from "@/store/agentStore";
import { useAgentStream, usePageVisible } from "@/hooks/useAgentStream";
import dynamic from "next/dynamic";
import { OfficeSidebar, type NavKey } from "@/components/shell/OfficeSidebar";
import { OfficeHeader } from "@/components/shell/OfficeHeader";
import { ActivityPanel } from "@/components/shell/ActivityPanel";
import { FocusedWorkstation } from "@/components/workstation/FocusedWorkstation";
import { DebugControls } from "@/components/ui/DebugControls";

/**
 * WebGL has no server rendering, and the three.js bundle is large enough that
 * it should not sit in the initial payload. Loading it on the client only also
 * keeps the shell interactive while the scene compiles.
 */
const Office3D = dynamic(
  () => import("@/components/office3d/Office3D").then((m) => m.Office3D),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center">
        <p className="text-[11.5px] text-ink-faint">Opening the office…</p>
      </div>
    ),
  },
);

/**
 * The application shell. The office is the main visualisation layer; the
 * chrome around it stays deliberately quiet.
 */
export function Workspace() {
  useAgentStream();
  const pageVisible = usePageVisible();

  const [nav, setNav] = useState<NavKey>("workspace");
  const [query, setQuery] = useState("");

  const allIds = useProjectIds();
  const focusedId = useAgentStore((s) => s.focusedId);
  const focus = useAgentStore((s) => s.focus);

  const names = useAgentStore(
    useShallow((s) => s.order.map((id) => s.projects[id]?.name.toLowerCase() ?? "")),
  );

  const ids = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return allIds;
    return allIds.filter((_, index) => names[index]?.includes(needle));
  }, [allIds, names, query]);

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <div className="hidden lg:block">
        <OfficeSidebar nav={nav} onNav={setNav} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <OfficeHeader query={query} onQuery={setQuery} />

        {/*
          The canvas stays mounted across focus changes. Unmounting it would
          tear down and rebuild the WebGL context — the most expensive thing
          this app can do — so focusing a project flies the camera to its desk
          and slides a detail panel in beside it instead.
        */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {allIds.length === 0 ? (
            <EmptyOffice />
          ) : (
            <Office3D
              ids={ids}
              animate={pageVisible}
              focusedId={focusedId}
              onSelect={focus}
            />
          )}

          <AnimatePresence>
            {focusedId && (
              <motion.div
                key="focus"
                className="pointer-events-none absolute inset-y-0 right-0 flex w-full max-w-[420px] items-start p-4"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ type: "spring", stiffness: 300, damping: 32 }}
              >
                <FocusedWorkstation id={focusedId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ActivityPanel />
      </div>

      <DebugControls />
    </div>
  );
}

function EmptyOffice() {
  return (
    <div className="grid h-full place-items-center px-8">
      <div className="max-w-md text-center">
        <p className="text-[14px] text-ink-dim">The office is empty.</p>
        <p className="mt-2 text-[12px] leading-relaxed text-ink-faint">
          Run <span className="font-mono text-ink-dim">npm run hooks:install</span> and restart
          Claude Code. A desk appears for every project you work in, and the agent at it moves with
          the real session. The debug panel drives each state without a live session.
        </p>
      </div>
    </div>
  );
}
