"use client";

import { memo } from "react";
import { deskSlot } from "@/components/office/layout";
import { TaskChair } from "@/components/office3d/studio/Chair";
import { DeskProps, StudioMonitor } from "@/components/office3d/studio/Monitor";

/**
 * A spare seat on a bench run: dark screen, chair pushed in.
 *
 * The bench itself is drawn by the room, so an unclaimed seat is only the
 * hardware on it — which is exactly what an empty workstation looks like.
 */
function EmptyDesk3DImpl({ slot }: { slot: number }) {
  const place = deskSlot(slot);
  const { out, face } = place;
  return (
    <group>
      <StudioMonitor
        position={[place.desk.x, 0.78, place.desk.z]}
        state="idle"
        rotation={face}
        off
        scale={0.82}
      />
      <DeskProps
        position={[place.desk.x + out.x * 0.42, 0.78, place.desk.z + out.z * 0.42]}
        rotation={face}
      />
      <TaskChair
        position={[place.robot.x + out.x * 0.22, 0, place.robot.y + out.z * 0.22]}
        rotation={face + Math.PI}
      />
    </group>
  );
}

export const EmptyDesk3D = memo(EmptyDesk3DImpl);
