import * as THREE from "three";

/**
 * The lounge TV, playing something.
 *
 * A short loop of frames is drawn once at startup and then cycled by swapping
 * which texture the material points at — so "playing" costs one pointer
 * assignment every few hundred milliseconds, not a redraw per frame.
 */

const W = 192;
const H = 108;
const FRAMES = 12;

let frames: THREE.CanvasTexture[] | null = null;

export function tvFrames(): THREE.CanvasTexture[] {
  if (frames) return frames;

  frames = Array.from({ length: FRAMES }, (_, index) => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (ctx) drawFrame(ctx, index / FRAMES);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  });
  return frames;
}

/**
 * A stylised sunset timelapse — a horizon, a sun that tracks across and sinks,
 * drifting clouds and a bird. Abstract enough to loop without looking wrong,
 * concrete enough to read as "the TV is on".
 */
function drawFrame(ctx: CanvasRenderingContext2D, t: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  const warmth = 0.5 + Math.sin(t * Math.PI * 2) * 0.5;
  sky.addColorStop(0, mix("#1d2a52", "#3a2352", warmth));
  sky.addColorStop(0.55, mix("#6a4a7a", "#c96a4a", warmth));
  sky.addColorStop(1, mix("#e0895a", "#f2b46a", warmth));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sun: arcs across and dips below the horizon.
  const sunX = W * (0.12 + t * 0.76);
  const sunY = H * (0.74 - Math.sin(t * Math.PI) * 0.46);
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 34);
  glow.addColorStop(0, "rgba(255,236,190,0.95)");
  glow.addColorStop(0.4, "rgba(255,190,120,0.45)");
  glow.addColorStop(1, "rgba(255,170,100,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 40, sunY - 40, 80, 80);
  ctx.fillStyle = "#ffeec2";
  ctx.beginPath();
  ctx.arc(sunX, sunY, 9, 0, Math.PI * 2);
  ctx.fill();

  // Clouds drifting the other way, wrapped so the loop is seamless.
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  for (const [cx, cy, cw] of [
    [0.2, 0.22, 46],
    [0.62, 0.34, 34],
    [0.85, 0.16, 28],
  ] as const) {
    const x = (((cx - t * 0.35) % 1) + 1) % 1;
    ctx.beginPath();
    ctx.ellipse(x * W, cy * H, cw / 2, cw / 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hills and water.
  ctx.fillStyle = "#2c2340";
  ctx.beginPath();
  ctx.moveTo(0, H * 0.72);
  ctx.quadraticCurveTo(W * 0.3, H * 0.6, W * 0.55, H * 0.71);
  ctx.quadraticCurveTo(W * 0.8, H * 0.79, W, H * 0.68);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,220,170,0.18)";
  ctx.fillRect(sunX - 5, H * 0.72, 10, H * 0.28);

  // A bird, because a still frame never quite reads as playing.
  const birdX = W * (0.75 - t * 0.5);
  const birdY = H * (0.26 + Math.sin(t * Math.PI * 4) * 0.05);
  ctx.strokeStyle = "rgba(20,16,28,0.55)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(birdX - 5, birdY);
  ctx.quadraticCurveTo(birdX - 2.5, birdY - 3, birdX, birdY);
  ctx.quadraticCurveTo(birdX + 2.5, birdY - 3, birdX + 5, birdY);
  ctx.stroke();
}

function mix(a: string, b: string, amount: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const blend = (shift: number) => {
    const va = (pa >> shift) & 255;
    const vb = (pb >> shift) & 255;
    return Math.round(va + (vb - va) * amount);
  };
  return `rgb(${blend(16)},${blend(8)},${blend(0)})`;
}

export function disposeTvFrames(): void {
  frames?.forEach((texture) => texture.dispose());
  frames = null;
}
