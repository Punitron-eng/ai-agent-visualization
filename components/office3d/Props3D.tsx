"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AgentState } from "@/lib/agent/agentTypes";
import { GEO, MAT, lampHalo, stateEmissive, stateGlow } from "@/components/office3d/resources";
import { screenMaterial } from "@/components/office3d/screenTexture";

/** Reusable furniture. Every mesh here draws from the shared geometry/material pool. */

/**
 * A private copy of a state's emissive material, for the few objects whose
 * brightness is animated per instance. Disposed on unmount.
 */
function useOwnEmissive(state: AgentState): THREE.MeshStandardMaterial {
  const material = useMemo(() => stateEmissive(state, 0).clone(), [state]);
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

export const Desk = memo(function Desk({
  position,
  width = 2.7,
}: {
  position: [number, number, number];
  width?: number;
}) {
  const sx = width / 2.7;
  return (
    <group position={position}>
      <mesh geometry={GEO.deskTop} material={MAT.deskTop} position={[0, 0.78, 0]} scale={[sx, 1, 1]} />
      {[
        [-width / 2 + 0.14, 0.62],
        [width / 2 - 0.14, 0.62],
        [-width / 2 + 0.14, -0.62],
        [width / 2 - 0.14, -0.62],
      ].map(([x, z], index) => (
        <mesh key={index} geometry={GEO.deskLeg} material={MAT.deskLeg} position={[x, 0.37, z]} />
      ))}
      <mesh
        geometry={GEO.circle}
        material={MAT.shadow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        scale={[width * 0.95, 1.7, 1]}
      />
    </group>
  );
});

/**
 * Office chair. The backrest sits at -z, behind an occupant facing +z, so a
 * seated robot has the chair behind it rather than through its chest.
 */
export const Chair = memo(function Chair({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={GEO.unitBox} material={MAT.metal} position={[0, 0.03, 0]} scale={[0.42, 0.05, 0.42]} />
      <mesh geometry={GEO.chairPost} material={MAT.metal} position={[0, 0.2, 0]} />
      <mesh geometry={GEO.chairSeat} material={MAT.seat} position={[0, 0.42, 0]} />
      <mesh geometry={GEO.chairBack} material={MAT.seat} position={[0, 0.7, -0.21]} />
    </group>
  );
});

/**
 * A monitor whose panel shows the interface its agent would actually be
 * looking at. The texture is cached per state, so switching states swaps a
 * pointer rather than redrawing anything.
 */
export const Monitor = memo(function Monitor({
  position,
  state,
  rotation = 0,
  scale = 1,
  off = false,
}: {
  position: [number, number, number];
  state: AgentState;
  rotation?: number;
  scale?: number;
  off?: boolean;
}) {
  // One shared material per state, so twenty monitors showing "coding" are a
  // single material and a single texture between them.
  const material = off ? MAT.screenOff : screenMaterial(state);

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh geometry={GEO.monitorFoot} material={MAT.metal} position={[0, 0.012, 0.02]} />
      <mesh geometry={GEO.monitorNeck} material={MAT.metal} position={[0, 0.09, 0.02]} />
      <mesh geometry={GEO.monitorBody} material={MAT.dark} position={[0, 0.48, 0]} />
      <mesh geometry={GEO.monitorScreen} material={material} position={[0, 0.48, 0.027]} />
      {!off && (
        <sprite
          scale={[1.9, 1.2, 1]}
          position={[0, 0.5, 0.22]}
          material={stateGlow(state, state === "idle" ? 0.05 : 0.16)}
        />
      )}
    </group>
  );
});

export const Keyboard = memo(function Keyboard({
  position,
  state,
  animate,
}: {
  position: [number, number, number];
  state: AgentState;
  animate: boolean;
}) {
  const typing = animate && state === "coding";
  // An own copy of the material: its brightness is animated per keyboard, and
  // mutating the shared per-state material would drive every other object
  // tinted by that state.
  const material = useOwnEmissive(state);
  const glow = useRef<THREE.Mesh>(null);

  useFrame((frame) => {
    const mesh = glow.current;
    if (!mesh) return;
    (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = typing
      ? 0.6 + Math.abs(Math.sin(frame.clock.elapsedTime * 9)) * 1.3
      : 0;
  });

  return (
    <group position={position}>
      <mesh geometry={GEO.keyboard} material={MAT.dark} />
      <mesh
        ref={glow}
        geometry={GEO.plane}
        material={material}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.021, 0]}
        scale={[0.72, 0.22, 1]}
      />
    </group>
  );
});

export const Mug = memo(function Mug({ position }: { position: [number, number, number] }) {
  return <mesh geometry={GEO.mug} material={MAT.paper} position={position} />;
});

export const Plant = memo(function Plant({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh geometry={GEO.pot} material={MAT.pot} position={[0, 0.12, 0]} />
      {LEAVES.map(([x, y, z, s], index) => (
        <mesh
          key={index}
          geometry={GEO.leaf}
          material={index % 2 ? MAT.leaf : MAT.leafDark}
          position={[x, 0.3 + y, z]}
          scale={[s, s * 0.62, s]}
        />
      ))}
    </group>
  );
});

const LEAVES: Array<[number, number, number, number]> = [
  [0, 0.16, 0, 1],
  [-0.15, 0.05, 0.07, 0.78],
  [0.14, 0.08, -0.06, 0.72],
  [0.05, 0.24, 0.1, 0.62],
  [-0.08, 0.22, -0.1, 0.58],
];

export const Table = memo(function Table({
  position,
  width = 1.3,
  depth = 0.85,
  height = 0.7,
}: {
  position: [number, number, number];
  width?: number;
  depth?: number;
  height?: number;
}) {
  return (
    <group position={position}>
      <mesh
        geometry={GEO.table}
        material={MAT.deskTop}
        position={[0, height, 0]}
        scale={[width / 1.3, 1, depth / 0.85]}
      />
      {[
        [-width / 2 + 0.12, -depth / 2 + 0.12],
        [width / 2 - 0.12, depth / 2 - 0.12],
      ].map(([x, z], index) => (
        <mesh
          key={index}
          geometry={GEO.tableLeg}
          material={MAT.metal}
          position={[x, height / 2, z]}
          scale={[1, height / 0.62, 1]}
        />
      ))}
    </group>
  );
});

export const Sofa = memo(function Sofa({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh geometry={GEO.sofaBase} material={MAT.fabric} position={[0, 0.16, 0]} />
      <mesh geometry={GEO.sofaBack} material={MAT.fabric} position={[0, 0.46, -0.36]} />
    </group>
  );
});

export const Crate = memo(function Crate({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return <mesh geometry={GEO.crate} material={MAT.crate} position={position} scale={scale} />;
});

/** Server rack whose LEDs only run while something is genuinely deploying. */
export const ServerRack = memo(function ServerRack({
  position,
  active,
}: {
  position: [number, number, number];
  active: boolean;
}) {
  // One own material for the whole rack; the rows share it and blink together.
  const material = useOwnEmissive("success");
  const leds = useRef<THREE.Group>(null);

  useFrame((frame) => {
    const first = leds.current?.children[0] as THREE.Mesh | undefined;
    if (!first) return;
    (first.material as THREE.MeshStandardMaterial).emissiveIntensity = active
      ? 0.4 + Math.abs(Math.sin(frame.clock.elapsedTime * 3)) * 1.6
      : 0.12;
  });

  return (
    <group position={position}>
      <mesh geometry={GEO.rack} material={MAT.dark} position={[0, 0.83, 0]} />
      <group ref={leds}>
        {[0, 1, 2, 3, 4].map((row) => (
          <mesh
            key={row}
            geometry={GEO.rackLed}
            material={material}
            position={[0, 0.35 + row * 0.28, 0.37]}
          />
        ))}
      </group>
    </group>
  );
});

/** Whiteboard with sticky notes — the planning room's one piece of detail. */
export const Whiteboard = memo(function Whiteboard({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh geometry={GEO.board} material={MAT.paper} position={[0, 1.25, 0]} />
      {NOTES.map(([x, y], index) => (
        <mesh
          key={index}
          geometry={GEO.note}
          material={index % 2 ? MAT.pot : MAT.clay}
          position={[x, 1.25 + y, 0.05]}
        />
      ))}
    </group>
  );
});

const NOTES: Array<[number, number]> = [
  [-0.7, 0.3],
  [-0.35, 0.12],
  [0.05, 0.32],
  [0.4, 0.05],
  [0.75, 0.26],
];

export const Bookshelf = memo(function Bookshelf({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh geometry={GEO.unitBox} material={MAT.deskLeg} position={[0, 0.6, 0]} scale={[0.95, 1.2, 0.4]} />
      {[0, 1].map((shelf) =>
        [0, 1, 2, 3].map((slot) => (
          <mesh
            key={`${shelf}-${slot}`}
            geometry={GEO.book}
            material={slot % 2 ? MAT.clay : MAT.leaf}
            position={[-0.32 + slot * 0.21, 0.36 + shelf * 0.46, 0.02]}
          />
        )),
      )}
    </group>
  );
});

/**
 * A proper indoor tree. Two of these in a corner do more for "this is an
 * office someone works in" than any amount of extra furniture.
 */
export const Tree = memo(function Tree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh geometry={GEO.pot} material={MAT.pot} position={[0, 0.18, 0]} scale={[1.5, 1.5, 1.5]} />
      <mesh geometry={GEO.trunk} material={MAT.deskLeg} position={[0, 1.05, 0]} />
      {CANOPY.map(([x, y, z, s], index) => (
        <mesh
          key={index}
          geometry={GEO.canopy}
          material={index % 2 ? MAT.leaf : MAT.leafDark}
          position={[x, 1.7 + y, z]}
          scale={[s, s * 0.8, s]}
        />
      ))}
      <mesh
        geometry={GEO.circle}
        material={MAT.shadow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.006, 0]}
        scale={1.5}
      />
    </group>
  );
});

const CANOPY: Array<[number, number, number, number]> = [
  [0, 0.18, 0, 1],
  [-0.36, 0, 0.12, 0.72],
  [0.34, 0.04, -0.14, 0.68],
  [0.08, 0.42, 0.2, 0.6],
  [-0.14, 0.38, -0.22, 0.56],
];

/** Low partition between desk rows — the most "office" object there is. */
export const Divider = memo(function Divider({
  position,
  rotation = 0,
  width = 2.6,
}: {
  position: [number, number, number];
  rotation?: number;
  width?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={GEO.divider} material={MAT.divider} position={[0, 0.31, 0]} scale={[width / 2.6, 1, 1]} />
      <mesh geometry={GEO.divider} material={MAT.metal} position={[0, 0.63, 0]} scale={[width / 2.6, 0.06, 1.3]} />
    </group>
  );
});

/**
 * Pendant lamp. The emissive disc does the visual work; the caller decides
 * whether it is also backed by a real light, since those are rationed.
 */
export const Pendant = memo(function Pendant({
  position,
  height = 2.6,
}: {
  position: [number, number, number];
  height?: number;
}) {
  return (
    <group position={position}>
      <mesh geometry={GEO.pendantCord} material={MAT.metal} position={[0, height + 0.28, 0]} />
      <mesh geometry={GEO.pendantCone} material={MAT.shade} position={[0, height, 0]} />
      <mesh
        geometry={GEO.discLight}
        material={MAT.warmGlow}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, height - 0.15, 0]}
      />
      <sprite scale={[2.4, 2.4, 1]} position={[0, height - 0.3, 0]} material={warmSprite()} />
    </group>
  );
});

/** Floor lamp for the lounge. */
export const FloorLamp = memo(function FloorLamp({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh geometry={GEO.pot} material={MAT.metal} position={[0, 0.05, 0]} scale={[1.1, 0.25, 1.1]} />
      <mesh geometry={GEO.lampPost} material={MAT.metal} position={[0, 0.8, 0]} />
      <mesh geometry={GEO.lampShade} material={MAT.shade} position={[0, 1.6, 0]} />
      <mesh
        geometry={GEO.discLight}
        material={MAT.warmGlow}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 1.46, 0]}
        scale={0.85}
      />
      <sprite scale={[2.2, 2.2, 1]} position={[0, 1.5, 0]} material={warmSprite()} />
    </group>
  );
});

/** Rug. Softens the floor and marks out the lounge and meeting areas. */
export const Rug = memo(function Rug({
  position,
  width,
  depth,
  alt = false,
}: {
  position: [number, number, number];
  width: number;
  depth: number;
  alt?: boolean;
}) {
  return (
    <mesh
      geometry={GEO.plane}
      material={alt ? MAT.rugAlt : MAT.rug}
      rotation={[-Math.PI / 2, 0, 0]}
      position={position}
      scale={[width, depth, 1]}
    />
  );
});

/** A run of dusk-lit glazing. Nothing says "interior" faster than a window. */
export const WindowWall = memo(function WindowWall({
  position,
  rotation = 0,
  width,
  height = 1.5,
  panes = 4,
}: {
  position: [number, number, number];
  rotation?: number;
  width: number;
  height?: number;
  panes?: number;
}) {
  const paneWidth = width / panes;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {Array.from({ length: panes }).map((_, index) => (
        <mesh
          key={index}
          geometry={GEO.windowPane}
          material={MAT.windowGlow}
          position={[-width / 2 + paneWidth * (index + 0.5), height / 2, 0]}
          scale={[paneWidth * 0.9, height, 1]}
        />
      ))}
      <mesh geometry={GEO.unitBox} material={MAT.metal} position={[0, height + 0.04, 0]} scale={[width, 0.08, 0.1]} />
      <mesh geometry={GEO.unitBox} material={MAT.metal} position={[0, 0, 0]} scale={[width, 0.08, 0.1]} />
    </group>
  );
});

export const BeanBag = memo(function BeanBag({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <mesh geometry={GEO.beanBag} material={MAT.fabric} position={position} scale={[1, 0.68, 1]} />
  );
});

export const WaterCooler = memo(function WaterCooler({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh geometry={GEO.cooler} material={MAT.paper} position={[0, 0.52, 0]} />
      <mesh geometry={GEO.canopy} material={MAT.windowGlow} position={[0, 1.2, 0]} scale={[0.34, 0.42, 0.34]} />
    </group>
  );
});

export const WallArt = memo(function WallArt({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={GEO.frame} material={MAT.deskLeg} />
      <mesh geometry={GEO.plane} material={MAT.rugAlt} position={[0, 0, 0.025]} scale={[0.6, 0.4, 1]} />
    </group>
  );
});

let warmSpriteMaterial: THREE.SpriteMaterial | null = null;
/** Shared halo for every warm lamp in the room. */
function warmSprite(): THREE.SpriteMaterial {
  warmSpriteMaterial ??= lampHalo();
  return warmSpriteMaterial;
}

/**
 * Glass-walled room: three low walls with a gap left for a doorway, so the
 * meeting and chill areas read as rooms rather than as patches of floor.
 */
export const GlassRoom = memo(function GlassRoom({
  x,
  z,
  width,
  depth,
  height = 1.9,
  /** Which side the doorway is on. */
  door = "front",
}: {
  x: number;
  z: number;
  width: number;
  depth: number;
  height?: number;
  door?: "front" | "left" | "right";
}) {
  const t = 0.06;
  const doorWidth = 1.4;
  const frontRun = (width - doorWidth) / 2;

  return (
    <group>
      {/* Back wall, always solid. */}
      <Pane x={x + width / 2} z={z} w={width} d={t} h={height} />

      {/* Side walls, minus a doorway if it is on that side. */}
      {door === "left" ? (
        <Pane x={x} z={z + depth - (depth - doorWidth) / 4} w={t} d={(depth - doorWidth) / 2} h={height} />
      ) : (
        <Pane x={x} z={z + depth / 2} w={t} d={depth} h={height} />
      )}
      {door === "right" ? (
        <Pane x={x + width} z={z + depth - (depth - doorWidth) / 4} w={t} d={(depth - doorWidth) / 2} h={height} />
      ) : (
        <Pane x={x + width} z={z + depth / 2} w={t} d={depth} h={height} />
      )}

      {/* Front wall, split around the doorway. */}
      {door === "front" && (
        <>
          <Pane x={x + frontRun / 2} z={z + depth} w={frontRun} d={t} h={height} />
          <Pane x={x + width - frontRun / 2} z={z + depth} w={frontRun} d={t} h={height} />
        </>
      )}
      {door !== "front" && <Pane x={x + width / 2} z={z + depth} w={width} d={t} h={height} />}
    </group>
  );
});

/**
 * One glazed panel: a slim head rail and corner posts, and glass in between.
 *
 * The frame is deliberately light. A full rail top and bottom reads as
 * scaffolding rather than as a room, especially in the bright vibe where the
 * glass itself almost disappears.
 */
function Pane({ x, z, w, d, h }: { x: number; z: number; w: number; d: number; h: number }) {
  const horizontal = w > d;
  const postSpan = horizontal ? w : d;
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={GEO.unitBox} material={MAT.glass} position={[0, h / 2, 0]} scale={[w, h, d]} />
      <mesh
        geometry={GEO.unitBox}
        material={MAT.metal}
        position={[0, h + 0.015, 0]}
        scale={[w, 0.03, d * 1.3]}
      />
      {[-postSpan / 2, postSpan / 2].map((offset, index) => (
        <mesh
          key={index}
          geometry={GEO.unitBox}
          material={MAT.metal}
          position={horizontal ? [offset, h / 2, 0] : [0, h / 2, offset]}
          scale={[0.05, h, 0.05]}
        />
      ))}
    </group>
  );
}
