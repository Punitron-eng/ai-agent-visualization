"use client";

import { memo } from "react";
import { Chair, Desk, Monitor } from "@/components/office3d/Props3D";

/** An unoccupied desk, so the development floor never looks half-built. */
function EmptyDesk3DImpl({ x, z }: { x: number; z: number }) {
  return (
    <group>
      <Desk position={[x, 0, z]} width={2.7} />
      <Monitor position={[x - 0.55, 0.83, z - 0.35]} state="idle" off />
      <Chair position={[x - 0.3, 0, z - 1.28]} rotation={0.28} />
    </group>
  );
}

export const EmptyDesk3D = memo(EmptyDesk3DImpl);
