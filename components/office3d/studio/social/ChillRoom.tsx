"use client";

import { memo } from "react";
import type { Zone } from "@/components/office/layout";
import { OGEO, OMAT } from "@/materials/officeMaterials";
import { GlassRoom } from "@/components/office3d/studio/social/GlassRoom";
import { CarromBoard } from "@/components/office3d/studio/social/CarromBoard";
import { FreeAgent, type FreeAgentConfig } from "@/components/office3d/studio/social/FreeAgent";
import { PottedPlant } from "@/components/office3d/studio/social/RoomProps";

/**
 * The recreation room: the same glass and dark framing as the meeting rooms,
 * but warmer light, softer furniture and a carrom board with four free agents
 * playing around it.
 *
 * It is deliberately the widest room in the wing and the only one with a game
 * in it — enough to become the eye's second stop after the desks, without
 * turning the office into an arcade.
 */

/** Where the board sits inside the room. */
export function carromCenter(zone: Zone): [number, number] {
  return [zone.x + 4.0, zone.y + 1.9];
}

/** The four players, generated from configuration rather than hand-placed JSX. */
export function freeAgents(zone: Zone): FreeAgentConfig[] {
  const [cx, cz] = carromCenter(zone);
  return [
    // Taking the shot, from the near side of the board.
    { id: "free-1", role: "player", x: cx, z: cz + 0.95, facing: Math.PI, period: 9, offset: 0 },
    // Watching closely from across the board.
    { id: "free-2", role: "observer", x: cx - 0.1, z: cz - 0.95, facing: 0, period: 9, offset: 1.7 },
    // Preparing the next turn, off to one side.
    { id: "free-3", role: "player", x: cx - 1.0, z: cz + 0.15, facing: Math.PI / 2, period: 13, offset: 4.4 },
    // Hanging back, half in the conversation.
    { id: "free-4", role: "observer", x: cx + 1.05, z: cz - 0.3, facing: -Math.PI / 2, period: 11, offset: 2.6 },
  ];
}

export interface ChillRoomProps {
  zone: Zone;
  animate: boolean;
  hovered: boolean;
  boardHovered: boolean;
  onHover(hovered: boolean): void;
  onHoverBoard(hovered: boolean): void;
  onSelect(): void;
}

function ChillRoomImpl({
  zone,
  animate,
  hovered,
  boardHovered,
  onHover,
  onHoverBoard,
  onSelect,
}: ChillRoomProps) {
  const { x, y } = zone;
  const [cx, cz] = carromCenter(zone);

  return (
    <GlassRoom
      zone={zone}
      hoverLabel="FREE AGENTS"
      hovered={hovered}
      warm
      doorAt={0.28}
      wallLeft={false}
      onHover={onHover}
      onSelect={onSelect}
    >
      {/* The game, and the people around it. */}
      <CarromBoard position={[cx, 0, cz]} hovered={boardHovered} onHover={onHoverBoard} />
      {freeAgents(zone).map((config) => (
        <FreeAgent key={config.id} config={config} animate={animate} />
      ))}

      {/* Soft seating. */}
      <mesh
        geometry={OGEO.rug}
        material={OMAT.rug}
        position={[x + 1.3, 0.02, y + 2.0]}
        scale={[1.35, 1, 1.15]}
      />
      <Sofa position={[x + 1.3, 0, y + 0.75]} />
      <LoungeChair position={[x + 0.45, 0, y + 2.5]} rotation={0.9} />
      <BeanBag position={[x + 2.3, 0, y + 2.6]} />
      <CoffeeTable position={[x + 1.3, 0, y + 1.95]} />

      {/* Fuel and storage. */}
      <CoffeeStation position={[x + 3.1, 0, y + 0.5]} />
      <Bookshelf position={[x + 5.05, 0, y + 3.2]} rotation={-Math.PI / 2} />

      {/* Greenery and wall art. */}
      <PottedPlant position={[x + 0.35, 0, y + 0.4]} scale={1.05} />
      <PottedPlant position={[x + 5.05, 0, y + 0.45]} scale={0.9} />
      <PottedPlant position={[x + 2.45, 0, y + 3.5]} scale={0.8} />
      <WallArt position={[x + 4.3, 1.9, y + 0.07]} />
    </GlassRoom>
  );
}

/** A three-seat sofa in warm beige. */
const Sofa = memo(function Sofa({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh geometry={OGEO.sofaBase} material={OMAT.beige} position={[0, 0.3, 0]} />
      <mesh geometry={OGEO.sofaBack} material={OMAT.beige} position={[0, 0.66, -0.34]} />
      {[-1.02, 1.02].map((seat) => (
        <mesh key={seat} geometry={OGEO.sofaArm} material={OMAT.beige} position={[seat, 0.5, 0]} />
      ))}
      <mesh
        geometry={OGEO.circle}
        material={OMAT.shadow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        scale={[2.4, 1.0, 1]}
      />
    </group>
  );
});

/** A blue tub chair. */
const LoungeChair = memo(function LoungeChair({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={OGEO.loungeSeat} material={OMAT.fabricBlue} position={[0, 0.34, 0]} />
      <mesh
        geometry={OGEO.loungeShell}
        material={OMAT.blue}
        position={[0, 0.44, -0.05]}
        rotation={[-0.25, 0, 0]}
        scale={[1, 0.9, 1]}
      />
      <mesh geometry={OGEO.chairStar} material={OMAT.metal} position={[0, 0.14, 0]} scale={[1, 0.8, 1]} />
    </group>
  );
});

/** A beige bean bag: no frame, all slump. */
const BeanBag = memo(function BeanBag({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh
        geometry={OGEO.loungeShell}
        material={OMAT.beige}
        position={[0, 0.08, 0]}
        scale={[1.2, 1.0, 1.2]}
      />
      <mesh
        geometry={OGEO.circle}
        material={OMAT.shadow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.015, 0]}
        scale={1.2}
      />
    </group>
  );
});

/** A small round coffee table, with a mug and a book left on it. */
const CoffeeTable = memo(function CoffeeTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh geometry={OGEO.coffeeTop} material={OMAT.wood} position={[0, 0.4, 0]} />
      <mesh geometry={OGEO.coffeeStem} material={OMAT.charcoal} position={[0, 0.2, 0]} />
      <mesh geometry={OGEO.roundFoot} material={OMAT.charcoal} position={[0, 0.02, 0]} scale={0.6} />
      <mesh geometry={OGEO.mug} material={OMAT.white} position={[0.12, 0.47, 0.05]} />
      <mesh geometry={OGEO.book} material={OMAT.blue} position={[-0.12, 0.44, -0.02]} rotation={[0, 0.4, 0]} />
    </group>
  );
});

/** Water and coffee, against the back wall. */
const CoffeeStation = memo(function CoffeeStation({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh geometry={OGEO.counter} material={OMAT.white} position={[0, 0.45, 0]} scale={[1.5, 1, 1]} />
      <mesh geometry={OGEO.counterTop} material={OMAT.wood} position={[0, 0.93, 0]} scale={[1.54, 1, 1]} />
      {[-0.36, 0.36].map((door) => (
        <mesh key={door} geometry={OGEO.cabinetDoor} material={OMAT.blue} position={[door, 0.45, 0.315]} />
      ))}
      <mesh geometry={OGEO.coffeeMachine} material={OMAT.charcoal} position={[-0.4, 1.16, 0]} />
      {[0.15, 0.36, 0.57].map((mug) => (
        <mesh key={mug} geometry={OGEO.mug} material={OMAT.white} position={[mug, 1.0, 0.06]} />
      ))}
    </group>
  );
});

/** A small bookshelf, part books and part clutter. */
const Bookshelf = memo(function Bookshelf({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={OGEO.bookshelf} material={OMAT.white} position={[0, 0.58, 0]} />
      {[0.35, 0.72, 1.02].map((shelfY, shelf) => (
        <group key={shelfY}>
          {[-0.28, -0.1, 0.08, 0.26].slice(0, 4 - shelf).map((bookX, index) => (
            <mesh
              key={bookX}
              geometry={OGEO.book}
              material={index % 2 === 0 ? OMAT.blue : OMAT.offWhite}
              position={[bookX, shelfY + 0.09, 0.02]}
              rotation={[0, 0, index === 3 ? 0.3 : 0]}
              scale={[0.7, 2.4, 0.9]}
            />
          ))}
        </group>
      ))}
    </group>
  );
});

/** Three flat panels on the back wall: the room's only decoration. */
const WallArt = memo(function WallArt({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[
        { x: -0.55, material: OMAT.blue, w: 0.5, h: 0.68 },
        { x: 0.05, material: OMAT.offWhite, w: 0.42, h: 0.42 },
        { x: 0.6, material: OMAT.leaf, w: 0.36, h: 0.56 },
      ].map((panel) => (
        <mesh
          key={panel.x}
          geometry={OGEO.plane}
          material={panel.material}
          position={[panel.x, 0, 0]}
          scale={[panel.w, panel.h, 1]}
        />
      ))}
    </group>
  );
});

export const ChillRoom = memo(ChillRoomImpl);
