"use client";

import { memo, useMemo } from "react";
import * as THREE from "three";
import type { OfficePlan } from "@/components/office/layout";
import { OGEO, OMAT } from "@/materials/officeMaterials";

/**
 * The iThinkLogistics logo, built as real geometry and stood off the wall.
 *
 * The mark in the brand SVG is a pin: a circle with a tip dropped from it, and
 * a smaller copy of exactly the same shape punched out of the middle — the
 * inner and outer forms share both their tip ratio and the angle at which the
 * flanks leave the circle, so one `pinShape()` draws both. Extruding that gives
 * a solid sign with a genuine edge that catches the key light, rather than a
 * decal pretending to be one.
 *
 * The wordmark is a canvas texture rather than extruded glyphs: a text
 * geometry would need a font payload fetched at runtime, and at this size the
 * letters are two pixels of edge. It is doubled — a dark ghost a few
 * millimetres behind the blue face — which reads as depth from every angle the
 * orbit camera can reach.
 */

/** Height of the pin mark, floor-to-tip, in world units. */
const MARK_H = 0.62;
/** Depth the sign stands off the wall face. */
const RELIEF = 0.055;

/**
 * Flank angle and tip ratio, measured off the brand artwork. Both the outer
 * mark and its cut-out use them, which is why the hole looks like a small
 * version of the logo instead of a plain circle.
 */
const FLANK = 0.7358;
const TIP = 1.458;

function pinShape(radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(radius * Math.cos(-FLANK), radius * Math.sin(-FLANK));
  shape.absarc(0, 0, radius, -FLANK, Math.PI + FLANK, false);
  shape.lineTo(0, -radius * TIP);
  shape.closePath();
  return shape;
}

/** Outer radius in the artwork's own units, where the whole mark is 1 tall. */
const OUTER = 1 / (1 + TIP);
const INNER = OUTER * 0.379;

let markGeometry: THREE.ExtrudeGeometry | null = null;

function pinGeometry(): THREE.ExtrudeGeometry {
  if (markGeometry) return markGeometry;
  const shape = pinShape(OUTER * MARK_H);
  shape.holes.push(pinShape(INNER * MARK_H));
  markGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: RELIEF,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 24,
  });
  // The extruder emits object-space UVs, so the brand gradient is pinned to
  // the mark's own bounding box instead of smearing across it.
  markGeometry.computeBoundingBox();
  return markGeometry;
}

let brandMaterials: THREE.Material[] | null = null;

/** Face and edge of the sign: the brand gradient, and its darker return. */
function markMaterials(): THREE.Material[] {
  if (brandMaterials) return brandMaterials;
  const box = pinGeometry().boundingBox;
  const width = box ? box.max.x - box.min.x : 1;
  const height = box ? box.max.y - box.min.y : 1;

  const texture = gradientTexture();
  texture.repeat.set(1 / width, 1 / height);
  texture.offset.set(box ? -box.min.x / width : 0, box ? -box.min.y / height : 0);

  brandMaterials = [
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.34, metalness: 0.25 }),
    new THREE.MeshStandardMaterial({ color: new THREE.Color("#0a3fb0"), roughness: 0.42, metalness: 0.3 }),
  ];
  return brandMaterials;
}

/** #004FE5 → #4C9AFF, the gradient the brand mark is filled with. */
function gradientTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const fill = ctx.createLinearGradient(6, 64, 58, 0);
    fill.addColorStop(0, "#004FE5");
    fill.addColorStop(1, "#4C9AFF");
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

const WORD = "iThinkLogistics";
/** Wordmark proportions, taken from the artwork and scaled off the mark. */
const WORD_W = MARK_H * 4.78;
const WORD_H = MARK_H * 0.5;

let wordMaterial: THREE.MeshBasicMaterial | null = null;
let ghostMaterial: THREE.MeshBasicMaterial | null = null;

function wordTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 1024, 128);
    ctx.fillStyle = "#004FE5";
    ctx.font = "600 92px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(WORD, 4, 70, 1016);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function wordMaterials(): [THREE.MeshBasicMaterial, THREE.MeshBasicMaterial] {
  if (!wordMaterial || !ghostMaterial) {
    const texture = wordTexture();
    wordMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false });
    // The ghost is the same glyphs in shadow, sunk behind the face: it gives
    // the letters a visible thickness without a second geometry.
    ghostMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.45,
      color: new THREE.Color("#0a2f80"),
      toneMapped: false,
    });
  }
  return [wordMaterial, ghostMaterial];
}

export interface BrandLogoProps {
  plan: OfficePlan;
}

/**
 * Mounted on the left-hand wall — the solid one, the room's branding face —
 * at eye height above the wood panelling, turned to face the floor.
 */
function BrandLogoImpl({ plan }: BrandLogoProps) {
  const geometry = useMemo(() => pinGeometry(), []);
  const materials = useMemo(() => markMaterials(), []);
  const [face, ghost] = useMemo(() => wordMaterials(), []);

  // Set out from the near end of the wall rather than centred on it: the sign
  // reads left-aligned from the main camera, clear of the wood panelling.
  const z = Math.min(plan.depth * 0.56, plan.depth - 7.2);

  return (
    <group position={[0.05, 2.35, z]} rotation={[0, Math.PI / 2, 0]}>
      <group position={[0, MARK_H * 0.18, 0.01]}>
        <mesh geometry={geometry} material={materials} />
        {/* Standoffs: the sign is held off the wall, as a real one would be. */}
        <mesh
          geometry={OGEO.cord}
          material={OMAT.metal}
          position={[0, -MARK_H * 0.18, -0.02]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[1.6, 0.06, 1.6]}
        />
      </group>

      <group position={[MARK_H * 0.4 + 0.28 + WORD_W / 2, 0, 0]}>
        <mesh geometry={OGEO.plane} material={ghost} position={[0.008, -0.008, RELIEF * 0.55]} scale={[WORD_W, WORD_H, 1]} />
        <mesh geometry={OGEO.plane} material={face} position={[0, 0, RELIEF]} scale={[WORD_W, WORD_H, 1]} />
      </group>
    </group>
  );
}

export const BrandLogo = memo(BrandLogoImpl);
