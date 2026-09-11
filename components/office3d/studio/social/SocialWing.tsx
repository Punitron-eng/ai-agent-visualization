"use client";

import { memo, useState } from "react";
import type { OfficePlan, Zone } from "@/components/office/layout";
import { MeetingRoom, type MeetingRoomConfig } from "@/components/office3d/studio/social/MeetingRoom";
import { ChillRoom, carromCenter } from "@/components/office3d/studio/social/ChillRoom";

/**
 * The social wing: two glass meeting rooms and the recreation room, side by
 * side across the back of the floor plate.
 *
 * The two meeting rooms are the same component twice over configuration — only
 * their seat count, board text and door position differ — and the chill room
 * shares their glass, framing and ceiling detail so the three read as one
 * fit-out.
 */

export interface SocialWingProps {
  plan: OfficePlan;
  animate: boolean;
  /** Called with a point in the room when the chill room is clicked. */
  onFocus(point: [number, number, number] | null): void;
}

function meetingRooms(plan: OfficePlan): MeetingRoomConfig[] {
  return [
    {
      id: "meeting-01",
      zone: plan.zones.planning,
      hoverLabel: "PLANNING",
      boardText: "IDEAS → PRODUCTS → IMPACT",
      seats: 5,
      doorAt: 0.68,
    },
    {
      id: "meeting-02",
      zone: plan.zones.meeting,
      hoverLabel: "COLLABORATION",
      boardText: "PLAN → BUILD → SHIP",
      // The collaboration room: one long table, four chairs, and a laptop
      // with Claude Code running on it.
      layout: "collaboration",
      subLabel: "HUMAN × AI",
      seats: 4,
      doorAt: 0.32,
      // The shared partition with Meeting 01 is drawn once, by that room.
      wallLeft: false,
    },
  ];
}

function SocialWingImpl({ plan, animate, onFocus }: SocialWingProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const chill: Zone = plan.zones.chill;
  const [cx, cz] = carromCenter(chill);

  return (
    <group>
      {meetingRooms(plan).map((room) => (
        <MeetingRoom
          key={room.id}
          {...room}
          hovered={hovered === room.id}
          animate={animate}
          onHover={(is) => setHovered(is ? room.id : null)}
        />
      ))}

      <ChillRoom
        zone={chill}
        animate={animate}
        hovered={hovered === "chill"}
        boardHovered={hovered === "carrom"}
        onHover={(is) => setHovered(is ? "chill" : null)}
        onHoverBoard={(is) => setHovered(is ? "carrom" : null)}
        // Clicking the room brings the camera down to the height of the game
        // rather than to the middle of the room: the activity is the subject.
        onSelect={() => onFocus([cx, 0.9, cz])}
      />
    </group>
  );
}

export const SocialWing = memo(SocialWingImpl);
