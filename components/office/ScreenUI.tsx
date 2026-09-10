"use client";

import { memo } from "react";
import { motion } from "motion/react";
import type { AgentState } from "@/lib/agent/agentTypes";
import { uvRect, type ScreenFace } from "@/components/office/face";

/**
 * A miniature developer interface drawn on a monitor.
 *
 * Each state gets the interface it would actually be looking at — an editor
 * while coding, a terminal while running, a search pane while searching — so
 * the office reads as engineering work rather than as glowing rectangles. It
 * is laid out in flat UV space and projected onto the screen plane, and it is
 * pure SVG, so a dozen of them cost nothing.
 */

export interface ScreenUIProps {
  face: ScreenFace;
  state: AgentState;
  animate: boolean;
  /** Compact monitors drop the finest rows. */
  dense?: boolean;
}

const INK = "#cdd6dd";
const MUTED = "#5d7078";
const GUTTER = "#2a3339";

function ScreenUIImpl({ face, state, animate, dense = false }: ScreenUIProps) {
  const R = (u0: number, v0: number, u1: number, v1: number) => uvRect(face, u0, v0, u1, v1);

  return (
    <g>
      {/* Panel background, lifted just off the bezel. */}
      <polygon points={R(0, 0, 1, 1)} fill="#0a0e11" />

      {state === "idle" ? (
        <IdleScreen R={R} animate={animate} />
      ) : state === "running" || state === "success" || state === "error" ? (
        <TerminalScreen R={R} state={state} animate={animate} dense={dense} />
      ) : state === "searching" ? (
        <SearchScreen R={R} animate={animate} dense={dense} />
      ) : state === "waiting" ? (
        <WaitingScreen R={R} animate={animate} />
      ) : (
        <EditorScreen R={R} state={state} animate={animate} dense={dense} />
      )}

      {/* Glass sheen across the top-left corner. */}
      <polygon points={R(0, 0, 0.42, 1)} fill="#ffffff" opacity="0.035" />
    </g>
  );
}

type Rect = (u0: number, v0: number, u1: number, v1: number) => string;

/** Editor: tab strip, line-number gutter, syntax-coloured code, caret. */
function EditorScreen({
  R,
  state,
  animate,
  dense,
}: {
  R: Rect;
  state: AgentState;
  animate: boolean;
  dense: boolean;
}) {
  const rows = dense ? CODE.slice(0, 5) : CODE;
  const top = 0.2;
  const rowH = (0.94 - top) / rows.length;
  const typing = state === "coding";

  return (
    <g>
      {/* Tab strip */}
      <polygon points={R(0, 0, 1, 0.15)} fill="#131a1f" />
      <polygon points={R(0.03, 0.02, 0.42, 0.15)} fill="#1d262c" />
      <polygon points={R(0.03, 0.135, 0.42, 0.15)} fill="var(--accent)" opacity="0.9" />
      <polygon points={R(0.45, 0.04, 0.72, 0.13)} fill="#161d22" />

      {/* Gutter */}
      <polygon points={R(0, 0.15, 0.09, 1)} fill={GUTTER} opacity="0.55" />

      {rows.map((row, index) => {
        const v = top + index * rowH;
        const h = rowH * 0.52;
        return (
          <g key={index}>
            <polygon points={R(0.025, v, 0.06, v + h)} fill={MUTED} opacity="0.5" />
            {row.map(([start, width, kind], token) => (
              <polygon
                key={token}
                points={R(0.12 + start, v, 0.12 + start + width, v + h)}
                fill={kind === "k" ? "var(--accent)" : kind === "s" ? "#b6d98f" : INK}
                opacity={kind === "t" ? 0.55 : 0.85}
              />
            ))}
          </g>
        );
      })}

      {/* Caret on the line being written. */}
      {typing && (
        <motion.polygon
          points={R(0.12 + 0.34, top + 2 * rowH, 0.12 + 0.37, top + 2 * rowH + rowH * 0.52)}
          fill="var(--accent)"
          animate={animate ? { opacity: [1, 1, 0, 0] } : { opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
        />
      )}

      {/* Unsaved-changes dot. */}
      {typing && <polygon points={R(0.93, 0.04, 0.97, 0.11)} fill="var(--accent)" />}
    </g>
  );
}

/** Terminal: prompt, output rows, and a result line coloured by outcome. */
function TerminalScreen({
  R,
  state,
  animate,
  dense,
}: {
  R: Rect;
  state: AgentState;
  animate: boolean;
  dense: boolean;
}) {
  const tone = state === "error" ? "#e5484d" : state === "success" ? "#3dd68c" : "var(--accent)";
  const rows = dense ? 4 : 6;
  const top = 0.16;
  const rowH = (0.92 - top) / rows;

  return (
    <g>
      <polygon points={R(0, 0, 1, 0.12)} fill="#131a1f" />
      <polygon points={R(0.03, 0.04, 0.07, 0.09)} fill={MUTED} opacity="0.7" />
      <polygon points={R(0.09, 0.04, 0.13, 0.09)} fill={MUTED} opacity="0.5" />

      {Array.from({ length: rows }).map((_, index) => {
        const v = top + index * rowH;
        const h = rowH * 0.5;
        const isPrompt = index === 0;
        const isResult = index === rows - 1;
        const width = isPrompt ? 0.52 : isResult ? 0.36 : 0.3 + ((index * 17) % 40) / 100;
        return (
          <g key={index}>
            <polygon
              points={R(0.05, v, 0.09, v + h)}
              fill={isPrompt ? tone : MUTED}
              opacity={isPrompt ? 0.95 : 0.45}
            />
            <polygon
              points={R(0.12, v, 0.12 + width, v + h)}
              fill={isResult ? tone : INK}
              opacity={isResult ? 0.95 : 0.6}
            />
          </g>
        );
      })}

      {/* Progress bar while a command is still running. */}
      {state === "running" && (
        <>
          <polygon points={R(0.05, 0.94, 0.95, 0.985)} fill="#1b2429" />
          <motion.polygon
            points={R(0.05, 0.94, 0.95, 0.985)}
            fill={tone}
            animate={animate ? { opacity: [0.35, 0.95, 0.35] } : { opacity: 0.7 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
      {state === "error" && <polygon points={R(0, 0, 1, 0.025)} fill={tone} opacity="0.9" />}
      {state === "success" && <polygon points={R(0, 0, 1, 0.025)} fill={tone} opacity="0.85" />}
    </g>
  );
}

/** Search: a query field over a list of hits. */
function SearchScreen({ R, animate, dense }: { R: Rect; animate: boolean; dense: boolean }) {
  const hits = dense ? 3 : 5;
  const top = 0.34;
  const rowH = (0.94 - top) / hits;

  return (
    <g>
      <polygon points={R(0.05, 0.08, 0.95, 0.26)} fill="#161f24" />
      <polygon points={R(0.08, 0.13, 0.12, 0.21)} fill="var(--accent)" opacity="0.85" />
      <motion.polygon
        points={R(0.15, 0.14, 0.62, 0.2)}
        fill={INK}
        opacity={0.6}
        animate={animate ? { opacity: [0.35, 0.7, 0.35] } : { opacity: 0.6 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {Array.from({ length: hits }).map((_, index) => {
        const v = top + index * rowH;
        const h = rowH * 0.44;
        return (
          <g key={index}>
            <polygon points={R(0.06, v, 0.09, v + h)} fill="var(--accent)" opacity={0.55} />
            <polygon
              points={R(0.12, v, 0.12 + 0.34 + ((index * 23) % 35) / 100, v + h)}
              fill={INK}
              opacity={0.5}
            />
          </g>
        );
      })}
    </g>
  );
}

/** Waiting: a dim screen with a single amber prompt. */
function WaitingScreen({ R, animate }: { R: Rect; animate: boolean }) {
  return (
    <g>
      <polygon points={R(0, 0, 1, 0.12)} fill="#131a1f" />
      <polygon points={R(0.1, 0.4, 0.9, 0.47)} fill={MUTED} opacity="0.4" />
      <motion.polygon
        points={R(0.1, 0.55, 0.46, 0.63)}
        fill="var(--accent)"
        animate={animate ? { opacity: [0.25, 0.9, 0.25] } : { opacity: 0.6 }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </g>
  );
}

/** Idle: screen asleep. */
function IdleScreen({ R, animate }: { R: Rect; animate: boolean }) {
  return (
    <motion.polygon
      points={R(0.45, 0.47, 0.55, 0.53)}
      fill={MUTED}
      animate={animate ? { opacity: [0.15, 0.4, 0.15] } : { opacity: 0.25 }}
      transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/** Token runs per line: [startOffset, width, kind]. k = keyword, s = string, t = comment. */
type Token = [number, number, "k" | "s" | "t" | "n"];
const CODE: Token[][] = [
  [
    [0, 0.12, "k"],
    [0.15, 0.24, "n"],
  ],
  [
    [0.05, 0.1, "k"],
    [0.18, 0.3, "s"],
  ],
  [
    [0.05, 0.28, "n"],
  ],
  [
    [0.1, 0.16, "k"],
    [0.29, 0.2, "n"],
  ],
  [
    [0.05, 0.34, "t"],
  ],
  [
    [0.05, 0.14, "k"],
    [0.22, 0.26, "n"],
  ],
  [
    [0, 0.1, "k"],
  ],
];

export const ScreenUI = memo(ScreenUIImpl);
