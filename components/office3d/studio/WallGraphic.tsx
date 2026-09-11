"use client";

import { memo, useMemo } from "react";
import * as THREE from "three";
import type { OfficePlan } from "@/components/office/layout";
import { OGEO } from "@/materials/officeMaterials";
import { SHELL } from "@/config/officeLayout";

/**
 * Painted lettering on the timber panel of the branding wall.
 *
 * Signwriting, not a poster: the words are drawn straight onto the wood with
 * no frame and no backing board, which is why the material is a transparent
 * canvas texture rather than a lit plane. One texture, one draw call, and the
 * copy lives in the array below so changing what the wall says is a data edit.
 */

/** What the wall says, top line down. */
const LINES = [
  {
    text: "BETTER SHIPPING",
    size: 86,
    weight: 700,
    color: "#2121212",
    gap: 108,
  },
  { text: "TOGETHER", size: 86, weight: 700, color: "#2121212", gap: 132 },
  {
    text: "BUILD  ·  SHIP  ·  GROW",
    size: 46,
    weight: 500,
    color: "#2121212",
    gap: 0,
  },
] as const;

const CANVAS_W = 1024;
const CANVAS_H = 512;

let graphicMaterial: THREE.MeshBasicMaterial | null = null;

function manifestoMaterial(): THREE.MeshBasicMaterial {
  if (graphicMaterial) return graphicMaterial;

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Centre the whole block on the panel: the gaps carry the baselines, and
    // the last line contributes its own height rather than a gap.
    const block =
      LINES.reduce((total, line) => total + line.gap, 0) +
      LINES[LINES.length - 1].size;
    let y = (CANVAS_H - block) / 2 + LINES[0].size * 0.5;

    for (const line of LINES) {
      ctx.fillStyle = line.color;
      ctx.font = `${line.weight} ${line.size}px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
      ctx.fillText(line.text, CANVAS_W / 2, y, CANVAS_W - 40);
      y += line.gap;
    }

    // A hairline rule under the strapline, the way painted wall type is set.
    ctx.fillStyle = "#f0d7b4";
    ctx.globalAlpha = 0.5;
    ctx.fillRect(CANVAS_W / 2 - 200, y + 18, 400, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  graphicMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    // Unlit on purpose: paint on a wall that faces away from the key light
    // would otherwise sit in shadow and read as grey smudge from the camera.
    toneMapped: false,
    opacity: 0.94,
  });
  return graphicMaterial;
}

export interface WallGraphicProps {
  plan: OfficePlan;
}

/** Centred on the timber panel, which `OfficeWalls` hangs on the left wall. */
function WallGraphicImpl({ plan }: WallGraphicProps) {
  const material = useMemo(() => manifestoMaterial(), []);
  const width = 3.4;

  return (
    <mesh
      geometry={OGEO.plane}
      material={material}
      position={[0.062, SHELL.height / 2 - 0.2, plan.depth - 3.2]}
      rotation={[0, Math.PI / 2, 0]}
      scale={[width, (width * CANVAS_H) / CANVAS_W, 1]}
    />
  );
}

export const WallGraphic = memo(WallGraphicImpl);
