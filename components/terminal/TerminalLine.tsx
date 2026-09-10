"use client";

import { memo } from "react";
import type { MonitorLine, MonitorLineKind } from "@/lib/agent/agentTypes";

const STYLE: Record<MonitorLineKind, { color: string; glyph: string }> = {
  read: { color: "var(--visor)", glyph: "→" },
  search: { color: "#5ab8f0", glyph: "⌕" },
  edit: { color: "var(--clay-light)", glyph: "✎" },
  run: { color: "var(--amber)", glyph: "" },
  info: { color: "var(--ink-faint)", glyph: "" },
  ok: { color: "var(--ok)", glyph: "✓" },
  fail: { color: "var(--bad)", glyph: "✗" },
};

function TerminalLineImpl({ line }: { line: MonitorLine }) {
  const style = STYLE[line.kind];
  return (
    <div className="flex gap-[0.5em] leading-[1.7] whitespace-pre">
      {style.glyph && <span style={{ color: style.color }}>{style.glyph}</span>}
      <span className="truncate" style={{ color: style.color }}>
        {line.text}
      </span>
    </div>
  );
}

export const TerminalLine = memo(TerminalLineImpl);
