"use client";

import { memo } from "react";
import { Html } from "@react-three/drei";
import type { Zone } from "@/components/office/layout";
import { TaskChair } from "@/components/office3d/studio/Chair";
import { GlassRoom } from "@/components/office3d/studio/social/GlassRoom";
import { OfficeChair } from "@/components/office3d/studio/social/OfficeChair";
import { CollaborationTable } from "@/components/office3d/studio/social/CollaborationTable";
import { MacBookCodingStation } from "@/components/office3d/studio/social/MacBookCodingStation";
import {
  PottedPlant,
  RoundTable,
  SideCabinet,
  Whiteboard,
} from "@/components/office3d/studio/social/RoomProps";

/**
 * A glass meeting room: a table, chairs around it, a whiteboard on the solid
 * back wall, a side cabinet and a plant.
 *
 * Both rooms in the wing are this component with different configuration —
 * which table it is furnished with, seat count, board text, which way the door
 * swings — so the pair stays consistent without a line of duplicated JSX.
 *
 * Two layouts: `round`, a ring of chairs around a pedestal table, and
 * `collaboration`, a long rectangular table with two chairs a side and the
 * coding station on it.
 */

export type MeetingLayout = "round" | "collaboration";

export interface MeetingRoomConfig {
  id: string;
  zone: Zone;
  hoverLabel: string;
  /** What is written on the whiteboard. */
  boardText: string;
  /** How the room is furnished. Defaults to the round table. */
  layout?: MeetingLayout;
  /** Round layout only: 4–6 chairs, and the ring is laid out to suit. */
  seats: number;
  doorAt: number;
  wallLeft?: boolean;
  wallRight?: boolean;
  /** A quiet standing label, for a room that is making a point. */
  subLabel?: string;
}

export interface MeetingRoomProps extends MeetingRoomConfig {
  hovered: boolean;
  animate: boolean;
  onHover(hovered: boolean): void;
}

function MeetingRoomImpl({
  zone,
  hoverLabel,
  boardText,
  layout = "round",
  seats,
  doorAt,
  wallLeft,
  wallRight,
  subLabel,
  hovered,
  animate,
  onHover,
}: MeetingRoomProps) {
  const cx = zone.x + zone.w / 2;
  const cz = zone.y + zone.d / 2 - 0.15;
  const collaboration = layout === "collaboration";

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
      {collaboration ? (
        <CollaborationTable position={[cx, 0, cz]} />
      ) : (
        <>
          <RoundTable position={[cx, 0, cz]} radius={0.95} />
          {/* A small plant in the middle of the table — the one soft thing in
              an otherwise hard room. */}
          <PottedPlant position={[cx, 0.75, cz]} scale={0.62} tall={false} />
        </>
      )}

      {collaboration ? (
        <>
          {/* Exactly four: two to a long side, nobody on the ends, and far
              enough apart that no two chairs ever intersect. */}
          {[-0.52, 0.52].map((x) =>
            [-0.92, 0.92].map((z) => (
              <OfficeChair
                key={`${x}:${z}`}
                position={[cx + x, 0, cz + z]}
                rotation={z > 0 ? Math.PI : 0}
                scale={0.92}
              />
            )),
          )}
          {/* The station sits on the far half of the table and is turned a few
              degrees toward the main camera, so the screen is legible from the
              orbit view without the laptop facing nobody. */}
          <MacBookCodingStation
            position={[cx - 0.08, 0.765, cz - 0.12]}
            rotation={0.3}
            animate={animate}
          />
          <PottedPlant position={[cx + 0.86, 0.765, cz + 0.28]} scale={0.5} tall={false} />
        </>
      ) : (
        Array.from({ length: seats }).map((_, index) => {
          // Chairs are spread around the near three-quarters of the table so
          // the room is legible from the main camera rather than a ring of
          // backs.
          const angle = -Math.PI * 0.78 + (index / (seats - 1)) * Math.PI * 1.56;
          return (
            <TaskChair
              key={index}
              position={[cx + Math.sin(angle) * 1.28, 0, cz + Math.cos(angle) * 1.28]}
              rotation={angle + Math.PI}
              scale={0.92}
            />
          );
        })
      )}

      <Whiteboard position={[cx, 1.72, zone.y + 0.08]} text={boardText} />
      <SideCabinet position={[zone.x + 0.85, 0, zone.y + zone.d - 0.5]} />
      <PottedPlant position={[zone.x + zone.w - 0.5, 0, zone.y + 0.55]} scale={0.95} />

      {subLabel && (
        <Html
          position={[cx, 2.24, zone.y + zone.d - 0.2]}
          center
          zIndexRange={[12, 0]}
          style={{ pointerEvents: "none" }}
        >
          <span className="whitespace-nowrap text-[8px] font-medium uppercase tracking-[0.3em] text-white/35">
            {subLabel}
          </span>
        </Html>
      )}
    </GlassRoom>
  );
}

export const MeetingRoom = memo(MeetingRoomImpl);
