"use client";

import { memo } from "react";
import { Html } from "@react-three/drei";
import type { ProjectId } from "@/lib/agent/agentTypes";
import { useProject } from "@/store/agentStore";
import { STATE_SHORT } from "@/components/character/motion/stateVariants";
import { STATE_COLOR } from "@/lib/agent/palette";
import { deskSlot, type Zone } from "@/components/office/layout";

export interface ProjectLabelsProps {
  ordered: Array<[ProjectId, number]>;
  hovered: ProjectId | null;
  onHover(id: ProjectId | null): void;
  onSelect(id: ProjectId): void;
}

/**
 * Desk tags, anchored in the room but drawn as HTML so type stays crisp and
 * a constant size at any zoom.
 *
 * Information is tiered exactly as in the 2D renderer: name plus a state dot
 * always, everything else only on hover. With twenty desks, anything more
 * permanent turns the office into a wall of text.
 */
function ProjectLabelsImpl({ ordered, hovered, onHover, onSelect }: ProjectLabelsProps) {
  return (
    <>
      {ordered.map(([id, slot]) => (
        <ProjectLabel
          key={id}
          id={id}
          slot={slot}
          hovered={hovered === id}
          dimmed={hovered !== null && hovered !== id}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

function ProjectLabel({
  id,
  slot,
  hovered,
  dimmed,
  onHover,
  onSelect,
}: {
  id: ProjectId;
  slot: number;
  hovered: boolean;
  dimmed: boolean;
  onHover(id: ProjectId | null): void;
  onSelect(id: ProjectId): void;
}) {
  const project = useProject(id);
  if (!project) return null;

  const place = deskSlot(slot);
  const accent = STATE_COLOR[project.state];
  const busy = project.state !== "idle";
  const detail = project.command ? `$ ${project.command}` : project.file;

  return (
    <Html
      position={[place.robot.x + place.out.x * 0.3, 1.95, place.robot.y + place.out.z * 0.3]}
      center
      // Occlusion needs a raycast per frame per label; the tether and the
      // dimming already make depth readable, so it is not worth the cost.
      zIndexRange={[20, 0]}
      style={{ pointerEvents: "none" }}
    >
      <button
        type="button"
        onPointerEnter={() => onHover(id)}
        onPointerLeave={() => onHover(null)}
        onClick={() => onSelect(id)}
        className="pointer-events-auto w-max cursor-pointer rounded-[7px] border text-left backdrop-blur-[6px] transition-[opacity,padding] duration-150"
        style={{
          borderColor: hovered ? `${accent}8c` : "rgba(255,255,255,0.09)",
          background: hovered ? "rgba(20,16,14,0.94)" : "rgba(20,16,14,0.74)",
          boxShadow: hovered
            ? "0 12px 28px -12px rgba(0,0,0,0.95)"
            : "0 6px 14px -10px rgba(0,0,0,0.85)",
          padding: hovered ? "6px 9px" : "4px 7px",
          opacity: dimmed ? 0.28 : busy ? 1 : 0.66,
        }}
      >
        <span className="flex items-center gap-[6px]">
          <span
            className="block size-[5px] shrink-0 rounded-full"
            style={{
              background: accent,
              opacity: busy ? 1 : 0.45,
              animation: busy ? "cc-pulse 1.5s ease-in-out infinite" : undefined,
            }}
          />
          <span
            className="max-w-[160px] truncate font-medium leading-none text-ink"
            style={{ fontSize: hovered ? 11.5 : 10.5 }}
          >
            {project.name}
          </span>
          {hovered && (
            <span
              className="whitespace-nowrap text-[8px] font-semibold uppercase leading-none tracking-[0.1em]"
              style={{ color: accent }}
            >
              {STATE_SHORT[project.state]}
            </span>
          )}
        </span>

        {hovered && (
          <span className="mt-[5px] block">
            {detail && (
              <span className="block max-w-[210px] truncate font-mono text-[9.5px] leading-tight text-ink-dim">
                {detail}
              </span>
            )}
            <span className="mt-[2px] block max-w-[210px] truncate text-[8.5px] leading-tight text-ink-faint">
              {[project.gitBranch, project.model].filter(Boolean).join(" · ") || "no session"}
            </span>
          </span>
        )}
      </button>
    </Html>
  );
}

export const ProjectLabels = memo(ProjectLabelsImpl);

/**
 * Zone signage: one muted word per area, floating just above the floor.
 *
 * Deliberately minimal and non-interactive — the furniture is what tells you
 * what an area is; the word only confirms it.
 */
export const ZoneLabels = memo(function ZoneLabels({ zones }: { zones: Zone[] }) {
  return (
    <>
      {zones.map((zone) => (
        <Html
          key={zone.label}
          position={[zone.x + zone.w / 2, 0.05, zone.y + zone.d / 2]}
          center
          zIndexRange={[6, 0]}
          style={{ pointerEvents: "none" }}
        >
          <span className="whitespace-nowrap text-[9.5px] font-medium uppercase tracking-[0.2em] text-ink/28">
            {zone.label}
          </span>
        </Html>
      ))}
    </>
  );
});
