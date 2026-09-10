"use client";

import { memo } from "react";
import { GEO, MAT } from "@/components/office3d/resources";
import {
  BeanBag,
  Bookshelf,
  Chair,
  Crate,
  Desk,
  Divider,
  FloorLamp,
  GlassRoom,
  Monitor,
  Mug,
  Pendant,
  Plant,
  Rug,
  ServerRack,
  Sofa,
  Table,
  Tree,
  WallArt,
  WaterCooler,
  Whiteboard,
  WindowWall,
} from "@/components/office3d/Props3D";
import { Robot3D } from "@/components/office3d/Robot3D";
import { Television } from "@/components/office3d/Television";
import { deskSlot, type OfficePlan, type Zone } from "@/components/office/layout";
import type { WorkflowSignals } from "@/store/agentStore";

/**
 * The room: shell, lighting fixtures, greenery and the workflow zones.
 *
 * Plan coordinates are reused verbatim from the 2D layout — plan x to world x,
 * plan y (depth) to world z, height to world y — so the floor plan is defined
 * once and both renderers agree.
 *
 * Ambient robots are set dressing, but their behaviour is tied to real
 * aggregate state: the planning room only stirs when something is genuinely
 * thinking, the racks only blink during a real build or deploy.
 */
function Room3DImpl({
  plan,
  animate,
  signals,
}: {
  plan: OfficePlan;
  animate: boolean;
  signals: WorkflowSignals;
}) {
  const { width, depth, zones: Z } = plan;
  const cx = width / 2;
  const cz = depth / 2;
  const podRows = Math.ceil((Z.pods.d + 0.1) / 3.15);

  return (
    <group>
      {/* ── Shell ─────────────────────────────────────────────────── */}
      <mesh
        geometry={GEO.plane}
        material={MAT.floor}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[cx, 0, cz]}
        scale={[width + 2, depth + 2, 1]}
      />
      <mesh
        geometry={GEO.unitBox}
        material={MAT.floorSheen}
        position={[cx, -0.2, cz]}
        scale={[width + 2, 0.4, depth + 2]}
      />

      {/* Back walls, with glazing punched into them. Dusk light through the
          windows is what makes the room read as an interior at all. */}
      <mesh
        geometry={GEO.unitBox}
        material={MAT.wall}
        position={[cx, 1.6, -1.1]}
        scale={[width + 2, 3.2, 0.25]}
      />
      <mesh
        geometry={GEO.unitBox}
        material={MAT.wall}
        position={[-1.1, 1.6, cz]}
        scale={[0.25, 3.2, depth + 2]}
      />
      <WindowWall position={[cx - 1.5, 0.95, -0.96]} width={width * 0.55} height={1.7} panes={5} />
      <WindowWall
        position={[-0.96, 0.95, cz + 1.5]}
        rotation={Math.PI / 2}
        width={depth * 0.5}
        height={1.7}
        panes={4}
      />
      <WallArt position={[width - 2.2, 2.1, -0.94]} />
      <WallArt position={[width - 1.1, 2.1, -0.94]} />

      {/* Pendants over the development floor. Emissive discs plus one real
          light each for the front row only — see Office3D for the budget. */}
      {Array.from({ length: podRows }).map((_, row) =>
        [0, 2].map((column) => {
          const place = deskSlot(row * 4 + column);
          return (
            <Pendant key={`${row}-${column}`} position={[place.x + 3.2, 0, place.y + 0.6]} />
          );
        }),
      )}

      {/* ── Planning: an actual meeting room ─────────────────────── */}
      <GlassRoom
        x={Z.planning.x - 0.2}
        z={Z.planning.y - 0.2}
        width={Z.planning.w + 0.4}
        depth={Z.planning.d + 0.4}
        door="front"
      />
      <ZoneRug zone={Z.planning} alt />
      <Whiteboard position={[Z.planning.x + 2.6, 0, Z.planning.y + 0.2]} />
      <Table position={[Z.planning.x + 2.7, 0, Z.planning.y + 2.0]} width={2.5} depth={1.2} />
      <Chair position={[Z.planning.x + 1.9, 0, Z.planning.y + 1.25]} rotation={Math.PI} />
      <Chair position={[Z.planning.x + 3.5, 0, Z.planning.y + 1.25]} rotation={Math.PI} />
      <Mug position={[Z.planning.x + 3.0, 0.76, Z.planning.y + 2.0]} />
      <Robot3D
        position={[Z.planning.x + 1.9, 0, Z.planning.y + 1.9]}
        state={signals.planning ? "thinking" : "idle"}
        pose="standing"
        facing={0.5}
        animate={animate}
        seed={1}
      />
      <Robot3D
        position={[Z.planning.x + 3.6, 0, Z.planning.y + 1.9]}
        state={signals.planning ? "thinking" : "idle"}
        pose="standing"
        facing={-0.4}
        animate={animate}
        seed={2}
      />
      <Tree position={[Z.planning.x + 5.4, 0, Z.planning.y + 0.6]} scale={1.05} />
      <Plant position={[Z.planning.x + 0.4, 0, Z.planning.y + 2.6]} scale={1.1} />

      {/* ── Chill: an enclosed lounge with a TV on ───────────────── */}
      <GlassRoom
        x={Z.chill.x - 0.2}
        z={Z.chill.y - 0.2}
        width={Z.chill.w + 0.4}
        depth={Z.chill.d + 0.4}
        door="front"
      />
      <Television
        position={[Z.chill.x + Z.chill.w / 2, 1.35, Z.chill.y - 0.12]}
        width={1.8}
        animate={animate}
      />
      <Rug position={[Z.chill.x + 2.0, 0.008, Z.chill.y + 1.9]} width={3.6} depth={2.4} />
      <Sofa position={[Z.chill.x + 2.0, 0, Z.chill.y + 2.9]} />
      <Table position={[Z.chill.x + 2.0, 0, Z.chill.y + 1.9]} width={1.2} depth={0.8} height={0.38} />
      <Mug position={[Z.chill.x + 2.0, 0.44, Z.chill.y + 1.9]} />
      <BeanBag position={[Z.chill.x + 0.6, 0.28, Z.chill.y + 2.2]} />
      <BeanBag position={[Z.chill.x + 3.5, 0.28, Z.chill.y + 2.3]} />
      <FloorLamp position={[Z.chill.x + 0.4, 0, Z.chill.y + 3.2]} />
      {/* Watching the TV, which is behind the camera from where they sit. */}
      <Robot3D
        position={[Z.chill.x + 1.5, 0.32, Z.chill.y + 2.85]}
        state={signals.waiting ? "waiting" : "idle"}
        facing={Math.PI}
        animate={animate}
        seed={3}
      />
      <Robot3D
        position={[Z.chill.x + 2.6, 0.32, Z.chill.y + 2.85]}
        state="idle"
        facing={Math.PI}
        animate={animate}
        seed={11}
      />
      <Tree position={[Z.chill.x + 3.9, 0, Z.chill.y + 1.0]} scale={1.05} />

      {/* ── Fuel ─────────────────────────────────────────────────── */}
      <mesh
        geometry={GEO.unitBox}
        material={MAT.deskLeg}
        position={[Z.fuel.x + 1.7, 0.48, Z.fuel.y + 0.8]}
        scale={[2.8, 0.95, 0.7]}
      />
      <mesh
        geometry={GEO.unitBox}
        material={MAT.deskTop}
        position={[Z.fuel.x + 1.7, 0.97, Z.fuel.y + 0.8]}
        scale={[2.9, 0.06, 0.78]}
      />
      <mesh
        geometry={GEO.unitBox}
        material={MAT.dark}
        position={[Z.fuel.x + 0.9, 1.3, Z.fuel.y + 0.8]}
        scale={[0.55, 0.62, 0.45]}
      />
      <Mug position={[Z.fuel.x + 1.9, 1.05, Z.fuel.y + 0.8]} />
      <Mug position={[Z.fuel.x + 2.2, 1.05, Z.fuel.y + 0.8]} />
      <Mug position={[Z.fuel.x + 2.5, 1.05, Z.fuel.y + 0.8]} />
      <WaterCooler position={[Z.fuel.x + 3.1, 0, Z.fuel.y + 0.8]} />
      <Robot3D
        position={[Z.fuel.x + 1.8, 0, Z.fuel.y + 2.2]}
        state="idle"
        pose="standing"
        facing={0.15}
        animate={animate}
        seed={4}
      />
      <Bookshelf position={[Z.fuel.x + 0.2, 0, Z.fuel.y + 2.4]} />
      <Plant position={[Z.fuel.x + 2.6, 0, Z.fuel.y + 2.5]} scale={1.0} />

      {/* ── Test & Debug ─────────────────────────────────────────── */}
      <ZoneRug zone={Z.testing} />
      <Chair position={[Z.testing.x + 1.7, 0, Z.testing.y + 1.75]} rotation={0.25} />
      <Robot3D
        position={[Z.testing.x + 1.7, 0.42, Z.testing.y + 1.35]}
        state={signals.testing ? "running" : "idle"}
        facing={0.25}
        animate={animate}
        seed={5}
      />
      <Desk position={[Z.testing.x + 2.0, 0, Z.testing.y + 0.45]} width={2.8} />
      <Monitor
        position={[Z.testing.x + 1.3, 0.83, Z.testing.y + 0.55]}
        state={signals.testing ? "running" : "idle"}
        rotation={0.25}
      />
      <Monitor
        position={[Z.testing.x + 2.7, 0.83, Z.testing.y + 0.5]}
        state={signals.testing ? "success" : "idle"}
        rotation={0.15}
        scale={0.85}
      />
      <Tree position={[Z.testing.x + 4.0, 0, Z.testing.y + 1.4]} scale={0.95} />
      <FloorLamp position={[Z.testing.x + 0.3, 0, Z.testing.y + 1.9]} />

      {/* ── Git & Review ─────────────────────────────────────────── */}
      <ZoneRug zone={Z.review} />
      <Table position={[Z.review.x + 2.2, 0, Z.review.y + 0.7]} width={3.2} depth={1.2} />
      <Monitor
        position={[Z.review.x + 2.6, 0.76, Z.review.y + 0.7]}
        state={signals.reviewing ? "reading" : "idle"}
        rotation={0.2}
        scale={0.9}
      />
      <Robot3D
        position={[Z.review.x + 1.1, 0.42, Z.review.y + 1.5]}
        state={signals.reviewing ? "reading" : "idle"}
        facing={0.45}
        animate={animate}
        seed={6}
      />
      <Robot3D
        position={[Z.review.x + 3.1, 0.42, Z.review.y + 1.6]}
        state={signals.reviewing ? "thinking" : "idle"}
        facing={-0.3}
        animate={animate}
        seed={7}
      />
      <Plant position={[Z.review.x + 4.2, 0, Z.review.y + 0.4]} scale={1.05} />
      <BeanBag position={[Z.review.x + 0.5, 0.28, Z.review.y + 2.1]} />
      <Plant position={[Z.review.x + 2.2, 0, Z.review.y + 2.2]} scale={0.85} />

      {/* ── Deploy ───────────────────────────────────────────────── */}
      <ZoneRug zone={Z.deploy} />
      <ServerRack position={[Z.deploy.x + 3.0, 0, Z.deploy.y + 0.6]} active={signals.deploying} />
      <ServerRack position={[Z.deploy.x + 3.8, 0, Z.deploy.y + 0.6]} active={signals.deploying} />
      <Crate position={[Z.deploy.x + 1.3, 0.3, Z.deploy.y + 1.1]} />
      <Crate position={[Z.deploy.x + 2.0, 0.25, Z.deploy.y + 1.5]} scale={0.82} />
      <Robot3D
        position={[Z.deploy.x + 0.7, 0, Z.deploy.y + 1.8]}
        state={signals.deploying ? "running" : "idle"}
        pose="standing"
        facing={0.35}
        animate={animate}
        seed={8}
      />
      <Tree position={[Z.deploy.x + 0.4, 0, Z.deploy.y + 0.5]} scale={1.0} />
      <FloorLamp position={[Z.deploy.x + 4.4, 0, Z.deploy.y + 1.9]} />

      {/* Greenery scattered through the floor so no corner reads as bare. */}
      <Tree position={[width - 0.4, 0, 0.4]} scale={1.2} />
      <Tree position={[0.2, 0, cz + 1.5]} scale={1.1} />
      <Plant position={[cx - 0.4, 0, Z.pods.y - 0.9]} scale={1.0} />
      <Plant position={[width - 0.6, 0, cz]} scale={0.95} />

      {/* Short partitions behind each desk — the most office-like object in
          the room, but only in desk-width pieces so they never read as walls. */}
      {Array.from({ length: podRows * 4 }).map((_, slot) => {
        const place = deskSlot(slot);
        return (
          <Divider key={slot} position={[place.x + 1.35, 0, place.y - 1.85]} width={2.9} />
        );
      })}
    </group>
  );
}

/** A soft rug the size of a zone, to stop the floor reading as bare concrete. */
function ZoneRug({ zone, alt = false }: { zone: Zone; alt?: boolean }) {
  return (
    <Rug
      position={[zone.x + zone.w / 2, 0.006, zone.y + zone.d / 2]}
      width={zone.w * 0.92}
      depth={zone.d * 0.88}
      alt={alt}
    />
  );
}

export const Room3D = memo(Room3DImpl);
