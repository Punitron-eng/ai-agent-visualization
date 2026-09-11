"use client";

import { memo } from "react";
import { benchRuns } from "@/components/office/layout";
import { BenchDesk } from "@/components/office3d/studio/Desk";

/**
 * The bench runs themselves — six-person clusters, three workstations a side.
 *
 * The furniture belongs to the room, not to any one project: drawing it here
 * once per run (rather than once per seat) is what keeps the tops coplanar,
 * the planter continuous, and the geometry count flat as projects come and go.
 */
export const BenchClusters = memo(function BenchClusters({ deskCount }: { deskCount: number }) {
  return (
    <>
      {benchRuns(deskCount).map((run) => (
        // A quarter turn: the run's long axis is world z, so the benches lie
        // across the scene and the two rows of screens face each other left
        // and right across the planter.
        <BenchDesk
          key={`${run.x}:${run.z}`}
          position={[run.x, 0, run.z]}
          rotation={Math.PI / 2}
          width={run.width}
        />
      ))}
    </>
  );
});
