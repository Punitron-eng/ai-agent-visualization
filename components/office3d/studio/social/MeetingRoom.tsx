"use client";

import { memo } from "react";
import type { Zone } from "@/components/office/layout";
import { TaskChair } from "@/components/office3d/studio/Chair";
import { GlassRoom } from "@/components/office3d/studio/social/GlassRoom";
import {
  PottedPlant,
  RoundTable,
  SideCabinet,
  Whiteboard,
} from "@/components/office3d/studio/social/RoomProps";

/**
 * A glass meeting room: round table, a ring of chairs, a whiteboard on the
 * solid back wall, a side cabinet and a plant.
 *
 * Both rooms in the wing are this component with different configuration —
 * seat count, board text, which way the door swings — so the pair stays
 * consistent without a line of duplicated JSX.
 */

export interface MeetingRoomConfig {
  id: string;
  zone: Zone;
  hoverLabel: string;
  /** What is written on the whiteboard. */
  boardText: string;
  /** 4–6 chairs; the ring is laid out to suit. */
  seats: number;
  doorAt: number;
  wallLeft?: boolean;
  wallRight?: boolean;
}

export interface MeetingRoomProps extends MeetingRoomConfig {
  hovered: boolean;
  onHover(hovered: boolean): void;
}

function MeetingRoomImpl({
  zone,
  hoverLabel,
  boardText,
  seats,
  doorAt,
  wallLeft,
  wallRight,
  hovered,
  onHover,
}: MeetingRoomProps) {
  const cx = zone.x + zone.w / 2;
  const cz = zone.y + zone.d / 2 - 0.15;
  const radius = 1.28;

  return (
    <GlassRoom
      zone={zone}
      hoverLabel={hoverLabel}
      hovered={hovered}
      doorAt={doorAt}
      wallLeft={wallLeft}
      wallRight={wallRight}
      onHover={onHover}
    >
      <RoundTable position={[cx, 0, cz]} radius={0.95} />
      {/* A small plant in the middle of the table — the one soft thing in an
          otherwise hard room. */}
      <PottedPlant position={[cx, 0.75, cz]} scale={0.62} tall={false} />

      {Array.from({ length: seats }).map((_, index) => {
        // Chairs are spread around the near three-quarters of the table so the
        // room is legible from the main camera rather than a ring of backs.
        const angle = -Math.PI * 0.78 + (index / (seats - 1)) * Math.PI * 1.56;
        return (
          <TaskChair
            key={index}
            position={[cx + Math.sin(angle) * radius, 0, cz + Math.cos(angle) * radius]}
            rotation={angle + Math.PI}
            scale={0.92}
          />
        );
      })}

      <Whiteboard position={[cx, 1.72, zone.y + 0.08]} text={boardText} />
      <SideCabinet position={[zone.x + 0.85, 0, zone.y + zone.d - 0.5]} />
      <PottedPlant position={[zone.x + zone.w - 0.5, 0, zone.y + 0.55]} scale={0.95} />
    </GlassRoom>
  );
}

export const MeetingRoom = memo(MeetingRoomImpl);
