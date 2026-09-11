"use client";

import { memo, type ReactNode } from "react";
import { Html } from "@react-three/drei";
import type { Zone } from "@/components/office/layout";
import { OGEO, OMAT } from "@/materials/officeMaterials";

/**
 * The architectural language every room in the social wing shares: full-height
 * glazing in slim dark frames, a glass door, a warm floor inset and one flush
 * ceiling light.
 *
 * All three rooms are built from this one component — only their contents and
 * their labels differ — which is what keeps the wing looking like a single
 * fit-out rather than three separate experiments.
 */

/** Head height of the partitions. */
export const ROOM_HEIGHT = 3.0;

export interface GlassRoomProps {
  zone: Zone;
  /** Shown on hover, in the room's own words. */
  hoverLabel: string;
  hovered: boolean;
  /** Warmer floor and light: the chill room is not a meeting room. */
  warm?: boolean;
  /** Door position along the front wall, as a fraction of its width. */
  doorAt?: number;
  /** Draw the partition on this side; the neighbour draws the other one. */
  wallLeft?: boolean;
  wallRight?: boolean;
  onHover(hovered: boolean): void;
  onSelect?(): void;
  children?: ReactNode;
}

function GlassRoomImpl({
  zone,
  hoverLabel,
  hovered,
  warm = false,
  doorAt = 0.5,
  wallLeft = true,
  wallRight = true,
  onHover,
  onSelect,
  children,
}: GlassRoomProps) {
  const { x, y, w, d } = zone;
  const frontZ = y + d;
  const centerX = x + w / 2;
  const centerZ = y + d / 2;

  return (
    <group>
      {/* Floor inset: a warmer plane that stops exactly at the glass line, so
          each room reads as its own volume from above. */}
      <mesh
        geometry={OGEO.plane}
        material={warm ? OMAT.floorWarm : OMAT.carpet}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, 0.016, centerZ]}
        scale={[w, d, 1]}
      />

      {/* Front glazing, split around the door opening. */}
      <Partition axis="x" from={x} to={x + w} at={frontZ} door={doorAt} />
      {wallLeft && <Partition axis="z" from={y} to={frontZ} at={x} />}
      {wallRight && <Partition axis="z" from={y} to={frontZ} at={x + w} />}

      {/* One flush ceiling light per room — warm in the chill room. */}
      <mesh
        geometry={OGEO.discLight}
        material={warm ? OMAT.warmGlow : OMAT.lightTube}
        rotation={[Math.PI / 2, 0, 0]}
        position={[centerX, ROOM_HEIGHT - 0.05, centerZ]}
        scale={2.6}
      />

      {children}

      {/* Hover volume: one invisible box for the whole room, so the label does
          not flicker as the pointer crosses the furniture inside it. */}
      <mesh
        geometry={OGEO.unitBox}
        position={[centerX, ROOM_HEIGHT / 2, centerZ]}
        scale={[w, ROOM_HEIGHT, d]}
        visible={false}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover(true);
        }}
        onPointerOut={() => onHover(false)}
        onClick={(event) => {
          if (!onSelect) return;
          event.stopPropagation();
          onSelect();
        }}
      />

      {hovered && (
        <Html
          position={[centerX, ROOM_HEIGHT + 0.35, centerZ]}
          center
          zIndexRange={[14, 0]}
          style={{ pointerEvents: "none" }}
        >
          <span className="whitespace-nowrap rounded-[6px] border border-white/10 bg-[rgba(20,16,14,0.9)] px-[7px] py-[4px] text-[9px] font-semibold uppercase tracking-[0.18em] text-ink/80 backdrop-blur-[6px]">
            {hoverLabel}
          </span>
        </Html>
      )}
    </group>
  );
}

/**
 * One run of glazing: a pane, a head and sill rail, and mullions at roughly
 * 1.4 m. With `door`, the run splits around an opening and grows a leaf.
 */
const Partition = memo(function Partition({
  axis,
  from,
  to,
  at,
  door,
}: {
  axis: "x" | "z";
  from: number;
  to: number;
  /** The fixed coordinate: z for an x-run, x for a z-run. */
  at: number;
  /** Door centre as a fraction of the run, if this run has one. */
  door?: number;
}) {
  const length = to - from;
  const doorWidth = 0.95;
  const doorCenter = door === undefined ? 0 : from + length * door;
  const segments: Array<[number, number]> =
    door === undefined
      ? [[from, to]]
      : [
          [from, doorCenter - doorWidth / 2],
          [doorCenter + doorWidth / 2, to],
        ];

  const place = (center: number, y: number): [number, number, number] =>
    axis === "x" ? [center, y, at] : [at, y, center];
  const spin: [number, number, number] = axis === "x" ? [0, 0, 0] : [0, Math.PI / 2, 0];

  return (
    <group>
      {segments.map(([a, b]) => {
        const span = b - a;
        if (span < 0.02) return null;
        const center = (a + b) / 2;
        const mullions = Math.max(0, Math.round(span / 1.4) - 1);
        return (
          <group key={`${a}`}>
            <mesh
              geometry={OGEO.glassPane}
              material={OMAT.glass}
              position={place(center, ROOM_HEIGHT / 2)}
              rotation={spin}
              scale={[span, ROOM_HEIGHT, 1]}
            />
            {[0.05, ROOM_HEIGHT - 0.05].map((y) => (
              <mesh
                key={y}
                geometry={OGEO.frameBar}
                material={OMAT.frame}
                position={place(center, y)}
                rotation={spin}
                scale={[span, 1, 1]}
              />
            ))}
            {Array.from({ length: mullions }).map((_, index) => (
              <mesh
                key={index}
                geometry={OGEO.mullion}
                material={OMAT.frame}
                position={place(a + (span * (index + 1)) / (mullions + 1), ROOM_HEIGHT / 2)}
                rotation={spin}
                scale={[1, ROOM_HEIGHT, 1]}
              />
            ))}
            {/* Jamb at each end of the run. */}
            {[a, b].map((edge) => (
              <mesh
                key={`jamb-${edge}`}
                geometry={OGEO.mullion}
                material={OMAT.frame}
                position={place(edge, ROOM_HEIGHT / 2)}
                rotation={spin}
                scale={[1.4, ROOM_HEIGHT, 1.4]}
              />
            ))}
          </group>
        );
      })}

      {/* A glass leaf, swung a few degrees open so the room reads as usable. */}
      {door !== undefined && (
        <group
          position={place(doorCenter - doorWidth / 2, 0)}
          rotation={[0, axis === "x" ? -0.35 : Math.PI / 2 - 0.35, 0]}
        >
          <mesh
            geometry={OGEO.glassPane}
            material={OMAT.windowGlass}
            position={[doorWidth / 2, ROOM_HEIGHT / 2 - 0.05, 0]}
            scale={[doorWidth, ROOM_HEIGHT - 0.1, 1]}
          />
          <mesh
            geometry={OGEO.frameBar}
            material={OMAT.frame}
            position={[doorWidth / 2, ROOM_HEIGHT - 0.12, 0]}
            scale={[doorWidth, 1, 1]}
          />
          <mesh
            geometry={OGEO.doorHandle}
            material={OMAT.metal}
            position={[doorWidth - 0.12, 1.05, 0.04]}
          />
        </group>
      )}
    </group>
  );
});

export const GlassRoom = memo(GlassRoomImpl);
