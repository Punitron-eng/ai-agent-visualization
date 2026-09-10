"use client";

import { useEffect } from "react";
import { useVibeStore } from "@/store/agentStore";
import { VIBES, VIBE_IDS } from "@/lib/agent/vibes";

/**
 * Vibe picker. Sets a `data-vibe` attribute on the document so the shell's CSS
 * variables follow, while the 3D scene re-skins its shared materials.
 */
export function VibeSwitcher() {
  const vibe = useVibeStore((s) => s.vibe);
  const setVibe = useVibeStore((s) => s.setVibe);
  const hydrateVibe = useVibeStore((s) => s.hydrateVibe);

  useEffect(() => {
    hydrateVibe();
  }, [hydrateVibe]);

  useEffect(() => {
    document.documentElement.dataset.vibe = vibe;
  }, [vibe]);

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border p-0.5"
      style={{ borderColor: "var(--edge)", background: "color-mix(in oklab, var(--panel) 55%, transparent)" }}
      role="radiogroup"
      aria-label="Office vibe"
    >
      {VIBE_IDS.map((id) => {
        const selected = vibe === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            title={VIBES[id].hint}
            onClick={() => setVibe(id)}
            className="cursor-pointer rounded-[6px] px-2 py-1 text-[10px] transition-colors"
            style={{
              background: selected ? "var(--panel-raised)" : "transparent",
              color: selected ? "var(--ink)" : "var(--ink-faint)",
            }}
          >
            {VIBES[id].label}
          </button>
        );
      })}
    </div>
  );
}
