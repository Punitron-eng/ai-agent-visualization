"use client";

import { memo } from "react";
import { motion } from "motion/react";
import type { ProjectId } from "@/lib/agent/agentTypes";
import { useProject } from "@/store/agentStore";
import { STATE_SHORT } from "@/components/character/motion/stateVariants";
import { deskSlot } from "@/components/office/layout";
import { project as iso } from "@/components/office/iso";
import type { SceneTransform } from "@/components/office/useSceneTransform";

export interface ProjectHudProps {
  id: ProjectId;
  slot: number;
  transform: SceneTransform;
  hovered: boolean;
  dimmed: boolean;
  onHover(id: ProjectId | null): void;
  onSelect(id: ProjectId): void;
}

/**
 * A small glass tag tethered to its desk rather than a dashboard card.
 *
 * Information is strictly tiered: the project name and a state dot are always
 * visible; the state word, current file and branch only appear on hover. With
 * a dozen desks on screen, anything more permanent turns the office into a
 * wall of text.
 */
function ProjectHudImpl({
  id,
  slot,
  transform,
  hovered,
  dimmed,
  onHover,
  onSelect,
}: ProjectHudProps) {
  const proj = useProject(id);
  if (!proj) return null;

  const place = deskSlot(slot);
  const world = iso(place.hud.x, place.hud.y, place.hud.z);
  const pos = transform.toScreen(world.sx, world.sy);
  const detail = proj.command ? `$ ${proj.command}` : proj.file;
  const busy = proj.state !== "idle";

  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: pos.left, top: pos.top, zIndex: hovered ? 30 : busy ? 20 : 10 }}
    >
      {/* Tether down to the desk, so the tag reads as attached to something. */}
      <span
        aria-hidden
        className="absolute left-1/2 top-0 block w-px -translate-x-1/2"
        style={{
          height: 14,
          background:
            "linear-gradient(to bottom, color-mix(in oklab, var(--accent) 50%, transparent), transparent)",
        }}
      />

      <motion.button
        type="button"
        data-state={proj.state}
        onMouseEnter={() => onHover(id)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(id)}
        onBlur={() => onHover(null)}
        onClick={() => onSelect(id)}
        className="pointer-events-auto absolute bottom-0 left-1/2 w-max -translate-x-1/2 cursor-pointer rounded-[7px] border text-left outline-none backdrop-blur-[6px]"
        style={{
          borderColor: hovered
            ? "color-mix(in oklab, var(--accent) 55%, transparent)"
            : "color-mix(in oklab, #ffffff 8%, transparent)",
          background: hovered
            ? "color-mix(in oklab, #14100e 92%, transparent)"
            : "color-mix(in oklab, #14100e 72%, transparent)",
          boxShadow: hovered
            ? "0 12px 28px -12px rgba(0,0,0,0.95)"
            : "0 6px 14px -10px rgba(0,0,0,0.85)",
          padding: hovered ? "6px 9px" : "4px 7px",
        }}
        animate={{ opacity: dimmed ? 0.22 : busy ? 1 : 0.62, y: hovered ? -4 : 0 }}
        transition={{ duration: 0.18 }}
      >
        <span className="flex items-center gap-[6px]">
          <motion.span
            className="block size-[5px] shrink-0 rounded-full"
            style={{ background: "var(--accent)" }}
            animate={
              busy ? { opacity: [1, 0.3, 1], scale: [1, 0.78, 1] } : { opacity: 0.4, scale: 1 }
            }
            transition={{ duration: 1.5, repeat: busy ? Infinity : 0, ease: "easeInOut" }}
          />
          <span
            className="max-w-[160px] truncate font-medium leading-none text-ink"
            style={{ fontSize: hovered ? 11.5 : 10.5 }}
          >
            {proj.name}
          </span>
          {/* The state word is hover-only; the dot's colour already carries it. */}
          {hovered && (
            <span
              className="whitespace-nowrap font-semibold uppercase leading-none tracking-[0.1em]"
              style={{ color: "var(--accent)", fontSize: 8 }}
            >
              {STATE_SHORT[proj.state]}
            </span>
          )}
        </span>

        {/*
          Mounted only while hovered. Collapsing it with height:0 would leave
          its hidden text still setting the button's intrinsic width, which
          stretches every tag to the length of its longest hidden line.
        */}
        {hovered && (
          <motion.span
            className="block"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.16 }}
          >
            {detail && (
              <span className="mt-[5px] block max-w-[210px] truncate font-mono text-[9.5px] leading-tight text-ink-dim">
                {detail}
              </span>
            )}
            <span className="mt-[2px] block max-w-[210px] truncate text-[9px] leading-tight text-ink-faint">
              {[proj.gitBranch, proj.model].filter(Boolean).join(" · ") || "no session"}
            </span>
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}

export const ProjectHud = memo(ProjectHudImpl);
