"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { project } from "@/components/office/iso";
import { IsoBox, IsoPlane } from "@/components/office/IsoPrimitives";
import {
  Bookshelf,
  Chair,
  CoffeeMachine,
  Crate,
  Desk,
  DeskMonitor,
  GlassPanel,
  LightPool,
  MAT,
  Mug,
  Plant,
  Rug,
  ServerRack,
  Sofa,
  Table,
  Whiteboard,
} from "@/components/office/props";
import { RobotAgent } from "@/components/office/RobotAgent";
import type { OfficePlan, Zone } from "@/components/office/layout";
import type { WorkflowSignals } from "@/store/agentStore";

/**
 * Everything that is not a project desk: the shell of the room, and the zones
 * work actually flows through — plan, build, test, review, deploy.
 *
 * The ambient robots are set dressing, but their behaviour is tied to real
 * aggregate state, never invented. The test bench only lights when a test
 * command is genuinely running, the review area only when a `git` command is,
 * and the racks only during a build or deploy.
 */
function OfficeEnvironmentImpl({
  plan,
  animate,
  signals,
}: {
  plan: OfficePlan;
  animate: boolean;
  signals: WorkflowSignals;
}) {
  const { width, depth, zones: Z } = plan;

  return (
    <g>
      {/* Floor: a dark slab with plank grain and a polished sheen. */}
      <IsoBox x={-0.5} y={-0.5} w={width + 1} d={depth + 1} h={0.35} color={MAT.floor} />
      <IsoPlane x={-0.5} y={-0.5} z={0.351} w={width + 1} d={depth + 1} fill="#3d2e23" />
      {Array.from({ length: Math.ceil((depth + 1) / 1.3) }).map((_, index) => (
        <IsoPlane
          key={index}
          x={-0.5}
          y={-0.5 + index * 1.3}
          z={0.352}
          w={width + 1}
          d={0.65}
          fill="#000"
          opacity={0.055}
        />
      ))}

      {/* Walls, low enough to keep the floor plan legible. */}
      <IsoBox x={-0.5} y={-1.05} w={width + 1} d={0.55} h={2.1} z={0.35} color={MAT.wall} />
      <IsoBox x={-1.05} y={-0.5} w={0.55} d={depth + 1} h={2.1} z={0.35} color={MAT.wall} />
      <IsoBox x={-0.5} y={-1.05} w={width + 1} d={0.55} h={0.05} z={2.45} color="#e8a33d" opacity={0.55} />
      <IsoBox x={-1.05} y={-0.5} w={0.55} d={depth + 1} h={0.05} z={2.45} color="#e8a33d" opacity={0.3} />
      <WallWash x={2} y={-0.9} w={6} />
      <WallWash x={9.5} y={-0.9} w={6} />

      {/* ── Planning ───────────────────────────────────────────────────── */}
      <ZoneFloor zone={Z.planning} tint="#4b382a" />
      <LightPool {...Z.planning} opacity={0.07} />
      <GlassPanel x={Z.planning.x} y={Z.planning.y + Z.planning.d} w={Z.planning.w} d={0.08} h={2.0} />
      <Whiteboard x={Z.planning.x + 1.3} y={Z.planning.y + 0.15} />
      <Table x={Z.planning.x + 1.5} y={Z.planning.y + 1.9} w={2.6} d={1.2} h={0.7} />
      <Chair x={Z.planning.x + 1.1} y={Z.planning.y + 1.15} />
      <Chair x={Z.planning.x + 3.5} y={Z.planning.y + 1.15} />
      <Mug x={Z.planning.x + 2.6} y={Z.planning.y + 2.2} z={0.7} />
      <RobotAgent
        x={Z.planning.x + 1.7}
        y={Z.planning.y + 1.7}
        state={signals.planning ? "thinking" : "idle"}
        pose="standing"
        animate={animate}
        scale={0.3}
      />
      <RobotAgent
        x={Z.planning.x + 3.2}
        y={Z.planning.y + 1.7}
        state={signals.planning ? "thinking" : "idle"}
        pose="standing"
        animate={animate}
        scale={0.3}
        flip
      />
      <Plant x={Z.planning.x + 5.2} y={Z.planning.y + 0.4} scale={1.05} sway={animate} />

      {/* ── Chill ──────────────────────────────────────────────────────── */}
      <ZoneFloor zone={Z.chill} tint="#463628" />
      <LightPool {...Z.chill} color="var(--clay-light)" opacity={0.05} />
      <Rug x={Z.chill.x + 0.5} y={Z.chill.y + 1.4} w={3.0} d={1.9} />
      <Sofa x={Z.chill.x + 0.7} y={Z.chill.y + 0.4} w={2.5} />
      <Table x={Z.chill.x + 1.3} y={Z.chill.y + 2.0} w={1.3} d={0.85} h={0.36} />
      <Mug x={Z.chill.x + 1.7} y={Z.chill.y + 2.25} z={0.44} />
      <RobotAgent
        x={Z.chill.x + 1.5}
        y={Z.chill.y + 0.85}
        z={0.34}
        state={signals.waiting ? "waiting" : "idle"}
        animate={animate}
        scale={0.29}
      />
      <Plant x={Z.chill.x + 3.5} y={Z.chill.y + 0.3} scale={1.15} sway={animate} />

      {/* ── Fuel ───────────────────────────────────────────────────────── */}
      <ZoneFloor zone={Z.fuel} tint="#463628" />
      <LightPool {...Z.fuel} opacity={0.08} />
      <IsoBox x={Z.fuel.x + 0.2} y={Z.fuel.y + 0.4} w={2.9} d={0.75} h={0.95} color="#463830" />
      <IsoBox x={Z.fuel.x + 0.2} y={Z.fuel.y + 0.4} w={2.9} d={0.75} h={0.04} z={0.95} color="#6b574a" />
      <CoffeeMachine x={Z.fuel.x + 0.45} y={Z.fuel.y + 0.55} />
      <Mug x={Z.fuel.x + 1.55} y={Z.fuel.y + 0.7} z={0.99} />
      <Mug x={Z.fuel.x + 1.9} y={Z.fuel.y + 0.7} z={0.99} />
      <Mug x={Z.fuel.x + 2.25} y={Z.fuel.y + 0.7} z={0.99} />
      <RobotAgent
        x={Z.fuel.x + 1.9}
        y={Z.fuel.y + 2.05}
        state="idle"
        pose="standing"
        animate={animate}
        scale={0.28}
      />
      <Bookshelf x={Z.fuel.x + 2.7} y={Z.fuel.y + 1.9} />

      {/* ── Test & Debug ───────────────────────────────────────────────── */}
      <ZoneFloor zone={Z.testing} tint="#443327" />
      <LightPool
        {...Z.testing}
        color={signals.testing ? "var(--ok)" : "var(--amber)"}
        opacity={signals.testing ? 0.1 : 0.045}
      />
      <Desk x={Z.testing.x + 0.5} y={Z.testing.y + 0.35} w={3.0} d={1.4} />
      <DeskMonitor
        x={Z.testing.x + 0.8}
        y={Z.testing.y + 0.55}
        w={1.05}
        h={0.62}
        state={signals.testing ? "running" : "idle"}
        animate={animate}
        dense
      />
      <DeskMonitor
        x={Z.testing.x + 2.05}
        y={Z.testing.y + 0.55}
        w={0.95}
        h={0.56}
        state={signals.testing ? "success" : "idle"}
        animate={animate}
        dense
      />
      <RobotAgent
        x={Z.testing.x + 1.8}
        y={Z.testing.y + 2.05}
        state={signals.testing ? "running" : "idle"}
        pose="standing"
        animate={animate}
        scale={0.29}
      />
      <Plant x={Z.testing.x + 3.8} y={Z.testing.y + 0.5} scale={0.85} sway={animate} />

      {/* ── Git & Review ───────────────────────────────────────────────── */}
      <ZoneFloor zone={Z.review} tint="#443327" />
      <LightPool
        {...Z.review}
        color={signals.reviewing ? "var(--visor)" : "var(--amber)"}
        opacity={signals.reviewing ? 0.1 : 0.045}
      />
      <Table x={Z.review.x + 0.6} y={Z.review.y + 0.5} w={3.4} d={1.3} h={0.7} />
      <DeskMonitor
        x={Z.review.x + 1.3}
        y={Z.review.y + 0.65}
        z={0.7}
        w={1.05}
        h={0.6}
        state={signals.reviewing ? "reading" : "idle"}
        animate={animate}
        dense
      />
      <BranchGlyph x={Z.review.x + 3.3} y={Z.review.y + 0.9} active={signals.reviewing && animate} />
      <RobotAgent
        x={Z.review.x + 1.2}
        y={Z.review.y + 2.05}
        state={signals.reviewing ? "reading" : "idle"}
        pose="standing"
        animate={animate}
        scale={0.29}
      />
      <RobotAgent
        x={Z.review.x + 2.7}
        y={Z.review.y + 2.05}
        state={signals.reviewing ? "thinking" : "idle"}
        pose="standing"
        animate={animate}
        scale={0.29}
        flip
      />

      {/* ── Deploy ─────────────────────────────────────────────────────── */}
      <ZoneFloor zone={Z.deploy} tint="#413124" />
      <LightPool
        {...Z.deploy}
        color={signals.deploying ? "var(--ok)" : "var(--amber)"}
        opacity={signals.deploying ? 0.11 : 0.045}
      />
      <ServerRack x={Z.deploy.x + 3.2} y={Z.deploy.y + 0.3} active={signals.deploying && animate} />
      <ServerRack x={Z.deploy.x + 4.05} y={Z.deploy.y + 0.3} active={signals.deploying && animate} />
      <Crate x={Z.deploy.x + 1.5} y={Z.deploy.y + 0.7} />
      <Crate x={Z.deploy.x + 2.3} y={Z.deploy.y + 1.0} h={0.5} />
      <RobotAgent
        x={Z.deploy.x + 0.9}
        y={Z.deploy.y + 2.05}
        state={signals.deploying ? "running" : "idle"}
        pose="standing"
        animate={animate}
        scale={0.29}
      />
      <Plant x={Z.deploy.x + 0.2} y={Z.deploy.y + 0.4} scale={0.9} sway={animate} />
    </g>
  );
}

function ZoneFloor({ zone, tint }: { zone: Zone; tint: string }) {
  return <IsoPlane x={zone.x} y={zone.y} z={0.354} w={zone.w} d={zone.d} fill={tint} opacity={0.7} />;
}

/** A branch/merge mark on the review table — the one bit of iconography. */
function BranchGlyph({ x, y, active }: { x: number; y: number; active: boolean }) {
  const a = project(x, y, 0.72);
  return (
    <motion.g
      animate={active ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.32 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <circle cx={a.sx} cy={a.sy - 16} r="2.8" fill="var(--accent)" />
      <circle cx={a.sx} cy={a.sy - 2} r="2.8" fill="var(--accent)" />
      <circle cx={a.sx + 12} cy={a.sy - 9} r="2.8" fill="var(--accent)" />
      <path
        d={`M${a.sx} ${a.sy - 16} L${a.sx} ${a.sy - 2} M${a.sx} ${a.sy - 9} L${a.sx + 12} ${a.sy - 9}`}
        stroke="var(--accent)"
        strokeWidth="1.4"
        fill="none"
      />
    </motion.g>
  );
}

/** A soft strip of light thrown up the back wall. */
function WallWash({ x, y, w }: { x: number; y: number; w: number }) {
  const c = project(x + w / 2, y, 1.5);
  return (
    <ellipse
      cx={c.sx}
      cy={c.sy}
      rx={w * 20}
      ry={40}
      fill="var(--amber)"
      opacity="0.09"
      style={{ filter: "blur(16px)" }}
    />
  );
}

/** An unoccupied desk, so the development floor never looks half-built. */
export const EmptyDesk = memo(function EmptyDesk({ x, y }: { x: number; y: number }) {
  return (
    <g opacity={0.45}>
      <Desk x={x} y={y} w={2.7} d={1.5} />
      <DeskMonitor x={x + 0.5} y={y + 0.3} off dense animate={false} />
      <Chair x={x + 1.05} y={y + 1.7} />
    </g>
  );
});

/** Slow drifting dust — the only purely decorative animation in the scene. */
export const Dust = memo(function Dust({ animate }: { animate: boolean }) {
  if (!animate) return null;
  return (
    <g opacity="0.4">
      {Array.from({ length: 10 }).map((_, index) => {
        const x = ((index * 173) % 880) - 420;
        const y = ((index * 251) % 360) - 20;
        return (
          <motion.circle
            key={index}
            cx={x}
            cy={y}
            r={index % 3 === 0 ? 1.4 : 1}
            fill="var(--amber)"
            animate={{ y: [0, -22, 0], opacity: [0, 0.5, 0] }}
            transition={{
              duration: 12 + (index % 5),
              repeat: Infinity,
              delay: (index % 7) * 1.6,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </g>
  );
});

export const OfficeEnvironment = memo(OfficeEnvironmentImpl);
