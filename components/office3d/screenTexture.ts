import * as THREE from "three";
import type { AgentState } from "@/lib/agent/agentTypes";
import { STATE_COLOR } from "@/lib/agent/palette";

/**
 * The miniature developer interface on a monitor, drawn to a canvas and used
 * as a texture.
 *
 * Redrawn only when the state changes — never per frame — so twenty screens
 * cost twenty small 2D draws across a whole session, not twenty per tick. One
 * texture is cached per state and shared by every monitor showing it.
 */

const W = 256;
const H = 142;

const INK = "#cdd6dd";
const MUTED = "#5d7078";
const PANEL = "#0a0e11";
const CHROME = "#131a1f";

const cache = new Map<AgentState, THREE.CanvasTexture>();

export function screenTexture(state: AgentState): THREE.CanvasTexture {
  const existing = cache.get(state);
  if (existing) return existing;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx, state);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  cache.set(state, texture);
  return texture;
}

function draw(ctx: CanvasRenderingContext2D, state: AgentState): void {
  const accent = STATE_COLOR[state];
  ctx.fillStyle = PANEL;
  ctx.fillRect(0, 0, W, H);

  switch (state) {
    case "idle":
      drawIdle(ctx);
      break;
    case "running":
    case "success":
    case "error":
      drawTerminal(ctx, state, accent);
      break;
    case "searching":
      drawSearch(ctx, accent);
      break;
    case "waiting":
      drawWaiting(ctx, accent);
      break;
    default:
      drawEditor(ctx, accent, state === "coding");
  }

  // A soft diagonal sheen sells it as glass at a distance.
  const sheen = ctx.createLinearGradient(0, 0, W * 0.7, H);
  sheen.addColorStop(0, "rgba(255,255,255,0.055)");
  sheen.addColorStop(0.55, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, H);
}

/** Editor: tab strip, gutter, syntax-coloured code, caret. */
function drawEditor(ctx: CanvasRenderingContext2D, accent: string, typing: boolean): void {
  ctx.fillStyle = CHROME;
  ctx.fillRect(0, 0, W, 18);
  ctx.fillStyle = "#1d262c";
  ctx.fillRect(6, 3, 96, 15);
  ctx.fillStyle = accent;
  ctx.fillRect(6, 16, 96, 2);
  ctx.fillStyle = "#161d22";
  ctx.fillRect(108, 5, 62, 11);

  ctx.fillStyle = "rgba(42,51,57,0.55)";
  ctx.fillRect(0, 18, 22, H - 18);

  const rows: Array<Array<[number, number, "k" | "s" | "t" | "n"]>> = [
    [[0, 30, "k"], [36, 58, "n"]],
    [[12, 24, "k"], [42, 72, "s"]],
    [[12, 68, "n"]],
    [[24, 40, "k"], [70, 48, "n"]],
    [[12, 82, "t"]],
    [[12, 34, "k"], [54, 62, "n"]],
    [[0, 24, "k"]],
  ];

  rows.forEach((row, index) => {
    const y = 26 + index * 15;
    ctx.fillStyle = MUTED;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(7, y, 8, 5);
    ctx.globalAlpha = 1;
    for (const [dx, width, kind] of row) {
      ctx.fillStyle = kind === "k" ? accent : kind === "s" ? "#b6d98f" : INK;
      ctx.globalAlpha = kind === "t" ? 0.4 : 0.8;
      ctx.fillRect(30 + dx, y, width, 5);
    }
    ctx.globalAlpha = 1;
  });

  if (typing) {
    ctx.fillStyle = accent;
    ctx.fillRect(30 + 90, 26 + 2 * 15, 4, 6);
    ctx.beginPath();
    ctx.arc(W - 12, 9, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Terminal: prompt, output, progress or a coloured result banner. */
function drawTerminal(ctx: CanvasRenderingContext2D, state: AgentState, accent: string): void {
  ctx.fillStyle = CHROME;
  ctx.fillRect(0, 0, W, 15);
  for (let dot = 0; dot < 3; dot += 1) {
    ctx.fillStyle = MUTED;
    ctx.globalAlpha = 0.7 - dot * 0.15;
    ctx.beginPath();
    ctx.arc(10 + dot * 11, 7.5, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const rows = 6;
  for (let index = 0; index < rows; index += 1) {
    const y = 26 + index * 16;
    const isPrompt = index === 0;
    const isResult = index === rows - 1;
    ctx.fillStyle = isPrompt ? accent : MUTED;
    ctx.globalAlpha = isPrompt ? 0.95 : 0.45;
    ctx.fillRect(12, y, 9, 5);
    ctx.fillStyle = isResult ? accent : INK;
    ctx.globalAlpha = isResult ? 0.95 : 0.55;
    ctx.fillRect(28, y, isPrompt ? 130 : isResult ? 92 : 70 + ((index * 23) % 60), 5);
    ctx.globalAlpha = 1;
  }

  if (state === "running") {
    ctx.fillStyle = "#1b2429";
    ctx.fillRect(12, H - 14, W - 24, 6);
    ctx.fillStyle = accent;
    ctx.fillRect(12, H - 14, (W - 24) * 0.58, 6);
  } else {
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, W, 3);
  }
}

/** Search: a query field over a list of hits. */
function drawSearch(ctx: CanvasRenderingContext2D, accent: string): void {
  ctx.fillStyle = "#161f24";
  ctx.fillRect(12, 12, W - 24, 26);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(26, 25, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(38, 22, 110, 6);
  ctx.globalAlpha = 1;

  for (let index = 0; index < 5; index += 1) {
    const y = 52 + index * 17;
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(14, y, 7, 5);
    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(28, y, 88 + ((index * 29) % 70), 5);
    ctx.globalAlpha = 1;
  }
}

function drawWaiting(ctx: CanvasRenderingContext2D, accent: string): void {
  ctx.fillStyle = CHROME;
  ctx.fillRect(0, 0, W, 15);
  ctx.fillStyle = MUTED;
  ctx.globalAlpha = 0.4;
  ctx.fillRect(24, 58, W - 48, 6);
  ctx.globalAlpha = 1;
  ctx.fillStyle = accent;
  ctx.fillRect(24, 78, 92, 7);
}

function drawIdle(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = MUTED;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function disposeScreenTextures(): void {
  for (const material of materialCache.values()) material.dispose();
  for (const texture of cache.values()) texture.dispose();
  materialCache.clear();
  cache.clear();
}

const materialCache = new Map<AgentState, THREE.MeshBasicMaterial>();

/**
 * One unlit material per state, shared by every monitor showing it. Unlit is
 * deliberate: a screen should read as emitting light, not as a surface being
 * lit by the room.
 */
export function screenMaterial(state: AgentState): THREE.MeshBasicMaterial {
  let material = materialCache.get(state);
  if (!material) {
    material = new THREE.MeshBasicMaterial({ map: screenTexture(state), toneMapped: false });
    materialCache.set(state, material);
  }
  return material;
}
