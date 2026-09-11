import * as THREE from "three";

/**
 * The display of the collaboration room's MacBook: a developer environment
 * with Claude Code running in it.
 *
 * Unlike `screenTexture`, which caches one still per agent state, this one is
 * alive — code lands line by line, the terminal scrolls, the caret blinks and
 * the agent's progress bar fills. It is still cheap: one 2D canvas redrawn a
 * few times a second, on a texture shared by the single station that uses it.
 */

const W = 512;
const H = 320;

const BG = "#0b0f13";
const CHROME = "#141a21";
const PANEL = "#0d1319";
const TERM = "#06090c";
const INK = "#c6d2dc";
const MUTED = "#4e6068";
const BLUE = "#4f8cff";
const GREEN = "#3fcf8e";
const AMBER = "#e0a33e";
const VIOLET = "#a78bfa";

const MONO = "ui-monospace, Menlo, monospace";

/** The editor's gutter, in the order Claude touches them. */
const FILES = [
  "layout.ts",
  "MeetingRoom.tsx",
  "MacBook.tsx",
  "claudeScreen.ts",
  "Office3D.tsx",
  "stations.ts",
];

/** Terminal history, scrolled a line at a time so it always reads as live. */
const TERMINAL = [
  "> npm run build",
  "  Changes detected - rebuilding",
  "  Building...",
  "  compiled in 1.8s",
  "> npm test -- --watch",
  "  Running tests...",
  "  42 passed, 0 failed",
  "  Agent working...",
  "> git status --short",
  "  M components/office3d",
];

/** Chat turns in the assistant panel. */
const CHAT: Array<[who: "you" | "claude", text: string]> = [
  ["you", "Ship the collab room"],
  ["claude", "Reading the plan"],
  ["claude", "Editing MeetingRoom"],
  ["claude", "Running tests..."],
  ["claude", "Agent working..."],
];

export interface LiveScreen {
  texture: THREE.CanvasTexture;
  /** Redraw for a moment in time, in seconds. */
  update(t: number): void;
}

let screen: LiveScreen | null = null;

export function claudeScreen(): LiveScreen {
  if (screen) return screen;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  screen = {
    texture,
    update(t: number) {
      if (!ctx) return;
      draw(ctx, t);
      texture.needsUpdate = true;
    },
  };
  screen.update(0);
  return screen;
}

function draw(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  titleBar(ctx, t);
  explorer(ctx, t);
  editor(ctx, t);
  terminal(ctx, t);
  assistant(ctx, t);
}

function titleBar(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = CHROME;
  ctx.fillRect(0, 0, W, 18);
  const lights = ["#ff5f57", "#febc2e", "#28c840"];
  lights.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(12 + index * 13, 9, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = MUTED;
  ctx.font = `10px ${MONO}`;
  ctx.textAlign = "center";
  ctx.fillText("claude code - ai-agent-visualization", W / 2, 12);
  ctx.textAlign = "left";

  // Live indicator: a pulse, not a dot, so the top of the screen is never dead.
  ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.4;
  ctx.fillStyle = GREEN;
  ctx.beginPath();
  ctx.arc(W - 14, 9, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function explorer(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = PANEL;
  ctx.fillRect(0, 18, 96, H - 18);
  ctx.fillStyle = MUTED;
  ctx.font = `9px ${MONO}`;
  ctx.fillText("EXPLORER", 9, 34);

  // The open file walks the tree, which is what a working agent looks like.
  const active = Math.floor(t / 4) % FILES.length;
  FILES.forEach((file, index) => {
    const y = 52 + index * 17;
    if (index === active) {
      ctx.fillStyle = "rgba(79,140,255,0.16)";
      ctx.fillRect(0, y - 10, 96, 16);
      ctx.fillStyle = BLUE;
      ctx.fillRect(0, y - 10, 2, 16);
    }
    ctx.fillStyle = index === active ? INK : MUTED;
    ctx.font = `9px ${MONO}`;
    ctx.fillText(file.slice(0, 14), 11, y + 1);
  });

  // Changed-file badges down at the bottom of the tree.
  ctx.fillStyle = GREEN;
  ctx.font = `9px ${MONO}`;
  ctx.fillText("+128", 11, H - 26);
  ctx.fillStyle = "#e06c5f";
  ctx.fillText("-14", 52, H - 26);
}

/** Deterministic token widths, so the code reads as code and never shimmers. */
function tokenWidths(line: number): number[] {
  const widths: number[] = [];
  let seed = (line + 3) * 9301;
  for (let index = 0; index < 3 + (line % 3); index += 1) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    widths.push(14 + (seed % 46));
  }
  return widths;
}

function editor(ctx: CanvasRenderingContext2D, t: number): void {
  const x0 = 96;
  const top = 18;
  const rows = 11;
  // Lines land one at a time, then the block scrolls and starts filling again.
  const typed = Math.floor(t * 1.7) % (rows + 4);

  ctx.fillStyle = "#0a0f14";
  ctx.fillRect(x0, top, 244, 196);

  for (let row = 0; row < rows; row += 1) {
    const y = top + 16 + row * 16;
    ctx.fillStyle = MUTED;
    ctx.font = `8px ${MONO}`;
    ctx.fillText(String(row + 12), x0 + 6, y + 3);
    if (row > typed) continue;

    let x = x0 + 26 + (row % 3) * 8;
    const palette = [VIOLET, BLUE, INK, GREEN, AMBER];
    tokenWidths(row).forEach((width, index) => {
      ctx.fillStyle = palette[(row + index) % palette.length];
      ctx.globalAlpha = row === typed ? 0.8 : 0.52;
      ctx.fillRect(x, y - 4, width, 5);
      ctx.globalAlpha = 1;
      x += width + 7;
    });

    // The caret sits at the end of the line currently being written.
    if (row === typed && t % 1 < 0.55) {
      ctx.fillStyle = INK;
      ctx.fillRect(x, y - 7, 2, 11);
    }
  }
}

function terminal(ctx: CanvasRenderingContext2D, t: number): void {
  const x0 = 96;
  const top = 214;
  ctx.fillStyle = TERM;
  ctx.fillRect(x0, top, 244, H - top);
  ctx.fillStyle = CHROME;
  ctx.fillRect(x0, top, 244, 14);
  ctx.fillStyle = MUTED;
  ctx.font = `8px ${MONO}`;
  ctx.fillText("TERMINAL", x0 + 8, top + 10);

  const scroll = Math.floor(t * 0.85);
  for (let row = 0; row < 5; row += 1) {
    const line = TERMINAL[(scroll + row) % TERMINAL.length];
    const y = top + 28 + row * 14;
    ctx.font = `9px ${MONO}`;
    ctx.fillStyle = line.startsWith(">")
      ? BLUE
      : line.includes("passed") || line.includes("compiled")
        ? GREEN
        : line.includes("Agent")
          ? AMBER
          : INK;
    ctx.fillText(line, x0 + 8, y);
  }

  if (t % 1 < 0.55) {
    ctx.fillStyle = GREEN;
    ctx.fillRect(x0 + 8, top + 86, 6, 9);
  }
}

function assistant(ctx: CanvasRenderingContext2D, t: number): void {
  const x0 = 340;
  ctx.fillStyle = PANEL;
  ctx.fillRect(x0, 18, W - x0, H - 18);
  ctx.fillStyle = CHROME;
  ctx.fillRect(x0, 18, W - x0, 20);

  ctx.fillStyle = "#d97757";
  ctx.beginPath();
  ctx.arc(x0 + 14, 28, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = `600 10px ${MONO}`;
  ctx.fillText("CLAUDE", x0 + 24, 32);

  // Turns arrive over time and the panel keeps the most recent ones.
  const turns = 2 + (Math.floor(t / 2.6) % (CHAT.length - 1));
  let y = 52;
  for (let index = 0; index < turns; index += 1) {
    const [who, text] = CHAT[index % CHAT.length];
    const mine = who === "you";
    ctx.fillStyle = mine ? "rgba(79,140,255,0.18)" : "rgba(255,255,255,0.05)";
    ctx.fillRect(x0 + (mine ? 30 : 10), y, mine ? 128 : 140, 30);
    ctx.fillStyle = mine ? BLUE : INK;
    ctx.font = `8px ${MONO}`;
    ctx.fillText(text.slice(0, 22), x0 + (mine ? 38 : 18), y + 18);
    y += 36;
  }

  // Status: the agent is working, and the bar says how far it has got.
  const dots = ".".repeat(1 + (Math.floor(t * 2) % 3));
  ctx.fillStyle = AMBER;
  ctx.font = `9px ${MONO}`;
  ctx.fillText(`Agent working${dots}`, x0 + 12, H - 44);

  const progress = (t * 0.17) % 1;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(x0 + 12, H - 34, 148, 6);
  ctx.fillStyle = GREEN;
  ctx.fillRect(x0 + 12, H - 34, 148 * progress, 6);

  ctx.fillStyle = MUTED;
  ctx.font = `8px ${MONO}`;
  ctx.fillText(`${Math.round(progress * 100)}% build - tests`, x0 + 12, H - 16);
}
