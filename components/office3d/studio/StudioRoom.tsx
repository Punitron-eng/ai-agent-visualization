"use client";

import { memo } from "react";
import type { OfficePlan } from "@/components/office/layout";
import type { WorkflowSignals } from "@/store/agentStore";
import { OfficeFloor } from "@/components/office3d/studio/OfficeFloor";
import { OfficeWalls } from "@/components/office3d/studio/OfficeWalls";
import { Windows } from "@/components/office3d/studio/Windows";
import { CityView } from "@/components/office3d/studio/CityView";
import { CeilingLights } from "@/components/office3d/studio/CeilingLights";
import { BrandLogo } from "@/components/office3d/studio/BrandLogo";
import { WallGraphic } from "@/components/office3d/studio/WallGraphic";

/**
 * The architectural shell, assembled.
 *
 * Nothing in here is per-project: it is the building, and it re-renders only
 * when the plan itself changes size. Everything that reacts to Claude Code —
 * agents, workstations, zone signals — is composed over the top of it by
 * `Office3D`.
 */

export interface StudioRoomProps {
  plan: OfficePlan;
  /** Seats on the floor, which is what decides how many bench runs there are. */
  deskCount: number;
  animate: boolean;
  /** Which workflow zones are live; dresses the room in later phases. */
  signals: WorkflowSignals;
}

function StudioRoomImpl({ plan, deskCount }: StudioRoomProps) {
  return (
    <group>
      {/* <CityView plan={plan} /> */}
      <OfficeFloor plan={plan} />
      <OfficeWalls plan={plan} />
      <Windows plan={plan} />
      <CeilingLights
        plan={plan}
        deskCount={deskCount}
      />
      <BrandLogo plan={plan} />
      <WallGraphic plan={plan} />
    </group>
  );
}

export const StudioRoom = memo(StudioRoomImpl);
