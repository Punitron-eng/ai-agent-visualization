"use client";

import { memo } from "react";
import { motion } from "motion/react";
import type { AgentState } from "@/lib/agent/agentTypes";
import { project } from "@/components/office/iso";
import { IsoBox, IsoPlane } from "@/components/office/IsoPrimitives";
import { facePoly, type ScreenFace } from "@/components/office/face";
import { ScreenUI } from "@/components/office/ScreenUI";

/**
 * Set dressing. Each prop is authored once in world units and reused across
 * zones, so the office reads as one place built from one kit.
 */

export const MAT = {
  floor: "#4a3a2e",
  floorAlt: "#55432f",
  wall: "#332720",
  deskTop: "#8a6343",
  deskLeg: "#3b2f27",
  metal: "#5b4f47",
  screen: "#0c1013",
  seat: "#4b3d35",
  fabric: "#6b5a4a",
  leaf: "#3f7a54",
  leafLight: "#549a68",
  pot: "#8a6144",
  glass: "#a7e2ef",
  paper: "#e2dacd",
} as const;

/** A desk with legs and a lit front edge. */
export const Desk = memo(function Desk({ x, y, w = 3, d = 1.6 }: { x: number; y: number; w?: number; d?: number }) {
  return (
    <g>
      <IsoBox x={x + 0.12} y={y + 0.12} w={0.18} d={0.18} h={0.72} color={MAT.deskLeg} />
      <IsoBox x={x + w - 0.3} y={y + 0.12} w={0.18} d={0.18} h={0.72} color={MAT.deskLeg} />
      <IsoBox x={x + 0.12} y={y + d - 0.3} w={0.18} d={0.18} h={0.72} color={MAT.deskLeg} />
      <IsoBox x={x + w - 0.3} y={y + d - 0.3} w={0.18} d={0.18} h={0.72} color={MAT.deskLeg} />
      <IsoBox x={x} y={y} w={w} d={d} h={0.1} z={0.72} color={MAT.deskTop} />
    </g>
  );
});

/** A monitor showing the interface its agent would actually be looking at. */
export const DeskMonitor = memo(function DeskMonitor({
  x,
  y,
  z = 0.82,
  w = 1.15,
  h = 0.7,
  state = "idle",
  animate = true,
  dense = false,
  off = false,
}: {
  x: number;
  y: number;
  z?: number;
  w?: number;
  h?: number;
  state?: AgentState;
  animate?: boolean;
  dense?: boolean;
  off?: boolean;
}) {
  const d = 0.09;
  const inset = 0.05;
  const face: ScreenFace = {
    x0: x + inset,
    x1: x + w - inset,
    y: y + d,
    z0: z + 0.14 + inset,
    z1: z + 0.14 + h - inset,
  };

  return (
    <g>
      {/* Stand */}
      <IsoBox x={x + w / 2 - 0.09} y={y + 0.02} w={0.18} d={0.16} h={0.14} z={z} color={MAT.metal} />
      <IsoBox x={x + w / 2 - 0.24} y={y} w={0.48} d={0.26} h={0.03} z={z} color={MAT.metal} />
      {/* Chassis */}
      <IsoBox x={x} y={y} w={w} d={d} h={h} z={z + 0.14} color="#1d1715" />

      {off ? (
        <polygon
          points={facePoly(face.x0, face.x1, face.y + 0.002, face.z0, face.z1)}
          fill="#0a0d0f"
        />
      ) : (
        <ScreenUI face={face} state={state} animate={animate} dense={dense} />
      )}

      {/* Emissive spill from the panel onto its own bezel. */}
      {!off && (
        <polygon
          points={facePoly(x, x + w, y + d + 0.004, z + 0.14, z + 0.14 + h)}
          fill="var(--accent)"
          opacity={0.07}
        />
      )}
      <polygon
        points={facePoly(x, x + w, y + d + 0.005, z + 0.14, z + 0.14 + h)}
        fill="none"
        stroke="#7d6d62"
        strokeWidth="0.7"
        opacity="0.5"
      />
    </g>
  );
});

export const DeskKeyboard = memo(function DeskKeyboard({
  x,
  y,
  typing = false,
}: {
  x: number;
  y: number;
  typing?: boolean;
}) {
  return (
    <g>
      <IsoBox x={x} y={y} w={0.85} d={0.34} h={0.05} z={0.82} color="#181312" />
      {typing && (
        <motion.g
          animate={{ opacity: [0.25, 0.9, 0.25] }}
          transition={{ duration: 0.42, repeat: Infinity, ease: "easeInOut" }}
        >
          <IsoPlane x={x + 0.06} y={y + 0.06} z={0.88} w={0.73} d={0.22} fill="var(--accent)" opacity={0.75} />
        </motion.g>
      )}
    </g>
  );
});

/** Office chair, seen from behind for desks facing away. */
export const Chair = memo(function Chair({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <IsoBox x={x + 0.22} y={y + 0.22} w={0.16} d={0.16} h={0.4} color={MAT.metal} />
      <IsoBox x={x} y={y} w={0.62} d={0.6} h={0.12} z={0.4} color={MAT.seat} />
      <IsoBox x={x} y={y + 0.48} w={0.62} d={0.12} h={0.62} z={0.52} color={MAT.seat} />
    </g>
  );
});

export const Plant = memo(function Plant({
  x,
  y,
  scale = 1,
  sway = true,
}: {
  x: number;
  y: number;
  scale?: number;
  sway?: boolean;
}) {
  const base = project(x + 0.25 * scale, y + 0.25 * scale, 0.35 * scale);
  return (
    <g>
      <IsoBox
        x={x}
        y={y}
        w={0.5 * scale}
        d={0.5 * scale}
        h={0.38 * scale}
        color={MAT.pot}
      />
      <motion.g
        style={{ originX: `${base.sx}px`, originY: `${base.sy}px` }}
        animate={sway ? { rotate: [0, 1.4, 0, -1.4, 0] } : { rotate: 0 }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        {[
          [0, -34, 16],
          [-15, -26, 13],
          [15, -28, 12],
          [-7, -44, 11],
          [9, -41, 10],
        ].map(([dx, dy, r], index) => (
          <ellipse
            key={index}
            cx={base.sx + dx * scale}
            cy={base.sy + dy * scale}
            rx={r * scale * 0.75}
            ry={r * scale * 0.5}
            fill={index % 2 ? MAT.leafLight : MAT.leaf}
            transform={`rotate(${dx * 1.4} ${base.sx + dx * scale} ${base.sy + dy * scale})`}
          />
        ))}
      </motion.g>
    </g>
  );
});

/** Glass partition: a tinted pane with a metal frame. */
export const GlassPanel = memo(function GlassPanel({
  x,
  y,
  w,
  d,
  h = 2.2,
}: {
  x: number;
  y: number;
  w: number;
  d: number;
  h?: number;
}) {
  return (
    <g>
      <IsoBox x={x} y={y} w={w} d={d} h={h} color={MAT.glass} opacity={0.09} />
      <IsoBox x={x} y={y} w={w} d={d} h={0.06} z={h} color={MAT.metal} />
      <IsoBox x={x} y={y} w={0.08} d={d} h={h} color={MAT.metal} opacity={0.85} />
      <IsoBox x={x + w - 0.08} y={y} w={0.08} d={d} h={h} color={MAT.metal} opacity={0.85} />
    </g>
  );
});

/** Warm pool of light on the floor, used to separate zones. */
export const LightPool = memo(function LightPool({
  x,
  y,
  w,
  d,
  color = "var(--amber)",
  opacity = 0.07,
}: {
  x: number;
  y: number;
  w: number;
  d: number;
  color?: string;
  opacity?: number;
}) {
  const c = project(x + w / 2, y + d / 2, 0);
  return (
    <ellipse
      cx={c.sx}
      cy={c.sy}
      rx={(w + d) * 15}
      ry={(w + d) * 7.5}
      fill={color}
      opacity={opacity}
      style={{ filter: "blur(14px)" }}
    />
  );
});

export const Rug = memo(function Rug({ x, y, w, d }: { x: number; y: number; w: number; d: number }) {
  return <IsoPlane x={x} y={y} w={w} d={d} fill="#3b2f28" opacity={0.85} />;
});

export const Sofa = memo(function Sofa({ x, y, w = 2.2 }: { x: number; y: number; w?: number }) {
  return (
    <g>
      <IsoBox x={x} y={y} w={w} d={0.95} h={0.34} color={MAT.fabric} />
      <IsoBox x={x} y={y + 0.78} w={w} d={0.18} h={0.72} color={MAT.fabric} />
      <IsoBox x={x} y={y} w={0.16} d={0.95} h={0.55} color={MAT.fabric} />
      <IsoBox x={x + w - 0.16} y={y} w={0.16} d={0.95} h={0.55} color={MAT.fabric} />
    </g>
  );
});

export const Table = memo(function Table({
  x,
  y,
  w = 1.3,
  d = 0.8,
  h = 0.42,
}: {
  x: number;
  y: number;
  w?: number;
  d?: number;
  h?: number;
}) {
  return (
    <g>
      <IsoBox x={x + 0.1} y={y + 0.1} w={0.12} d={0.12} h={h} color={MAT.metal} />
      <IsoBox x={x + w - 0.22} y={y + d - 0.22} w={0.12} d={0.12} h={h} color={MAT.metal} />
      <IsoBox x={x} y={y} w={w} d={d} h={0.07} z={h} color="#6a5240" />
    </g>
  );
});

/** Whiteboard for the planning room, with sticky notes. */
export const Whiteboard = memo(function Whiteboard({ x, y }: { x: number; y: number }) {
  const face = project(x, y, 1.9);
  return (
    <g>
      <IsoBox x={x} y={y} w={2.4} d={0.1} h={1.5} z={0.5} color="#cfc7bb" />
      {[
        [18, 14],
        [40, 22],
        [62, 12],
        [30, 34],
        [56, 40],
      ].map(([dx, dy], index) => (
        <rect
          key={index}
          x={face.sx + 14 + dx}
          y={face.sy + 16 + dy}
          width="11"
          height="11"
          rx="1"
          fill={index % 2 ? "#e8c65a" : "#e29a6a"}
          opacity="0.9"
          transform={`skewY(26)`}
        />
      ))}
    </g>
  );
});

export const CoffeeMachine = memo(function CoffeeMachine({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <IsoBox x={x} y={y} w={0.6} d={0.5} h={0.85} color="#2a2320" />
      <IsoBox x={x + 0.08} y={y + 0.05} w={0.44} d={0.06} h={0.22} z={0.42} color="var(--amber)" opacity={0.55} />
      <IsoBox x={x} y={y} w={0.6} d={0.5} h={0.08} z={0.85} color="#3a312c" />
    </g>
  );
});

export const Mug = memo(function Mug({ x, y, z = 0.82 }: { x: number; y: number; z?: number }) {
  return <IsoBox x={x} y={y} w={0.17} d={0.17} h={0.19} z={z} color="#c9bfb4" />;
});

export const Crate = memo(function Crate({ x, y, h = 0.6 }: { x: number; y: number; h?: number }) {
  return (
    <g>
      <IsoBox x={x} y={y} w={0.75} d={0.75} h={h} color="#7a5a3c" />
      <IsoPlane x={x + 0.12} y={y + 0.12} z={h + 0.002} w={0.51} d={0.51} fill="#5f4630" opacity={0.7} />
    </g>
  );
});

export const ServerRack = memo(function ServerRack({
  x,
  y,
  active = false,
}: {
  x: number;
  y: number;
  active?: boolean;
}) {
  return (
    <g>
      <IsoBox x={x} y={y} w={0.7} d={0.75} h={1.7} color="#1e1a18" />
      {[0, 1, 2, 3, 4].map((row) => (
        <motion.g
          key={row}
          animate={active ? { opacity: [0.25, 1, 0.25] } : { opacity: 0.22 }}
          transition={{ duration: 1.5, repeat: Infinity, delay: row * 0.22, ease: "easeInOut" }}
        >
          <IsoBox
            x={x + 0.08}
            y={y}
            w={0.54}
            d={0.04}
            h={0.07}
            z={0.24 + row * 0.28}
            color="var(--ok)"
          />
        </motion.g>
      ))}
    </g>
  );
});

/** Shelf of manuals — one of the details that reward looking closely. */
export const Bookshelf = memo(function Bookshelf({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <IsoBox x={x} y={y} w={0.95} d={0.42} h={1.15} color="#40332b" />
      {[0, 1].map((shelf) =>
        [0, 1, 2, 3].map((book) => (
          <IsoBox
            key={`${shelf}-${book}`}
            x={x + 0.09 + book * 0.19}
            y={y + 0.06}
            w={0.14}
            d={0.3}
            h={0.26}
            z={0.16 + shelf * 0.45}
            color={["#8c5a45", "#5d7a8c", "#7d8c5a", "#8c7d5a"][book]}
          />
        )),
      )}
    </g>
  );
});

/** Desk lamp: a small warm point light near a workstation. */
export const DeskLamp = memo(function DeskLamp({ x, y, on = true }: { x: number; y: number; on?: boolean }) {
  const head = project(x + 0.12, y + 0.12, 1.32);
  return (
    <g>
      <IsoBox x={x} y={y} w={0.24} d={0.24} h={0.04} z={0.82} color={MAT.metal} />
      <IsoBox x={x + 0.09} y={y + 0.09} w={0.06} d={0.06} h={0.46} z={0.86} color={MAT.metal} />
      <ellipse cx={head.sx} cy={head.sy} rx="8" ry="5" fill="#4a3d34" />
      {on && <ellipse cx={head.sx} cy={head.sy + 5} rx="17" ry="10" fill="var(--amber)" opacity="0.3" style={{ filter: "blur(5px)" }} />}
    </g>
  );
});

/** Headphones resting on a desk. */
export const Headphones = memo(function Headphones({ x, y }: { x: number; y: number }) {
  const c = project(x, y, 0.84);
  return (
    <g opacity="0.9">
      <path
        d={`M${c.sx - 7} ${c.sy} a7 5 0 0 1 14 0`}
        stroke="#3b332e"
        strokeWidth="2.4"
        fill="none"
      />
      <ellipse cx={c.sx - 7} cy={c.sy + 1} rx="2.6" ry="2" fill="#2c2622" />
      <ellipse cx={c.sx + 7} cy={c.sy + 1} rx="2.6" ry="2" fill="#2c2622" />
    </g>
  );
});
