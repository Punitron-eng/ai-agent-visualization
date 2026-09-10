import type { AgentState } from "@/lib/agent/agentTypes";

/**
 * The single source of truth for colour.
 *
 * WebGL materials cannot read CSS custom properties, so these values are
 * defined here and mirrored into `app/globals.css`. Change a value here and
 * change it there — the pairing is asserted by `tests/palette.test.mjs`.
 */

export const STATE_COLOR: Record<AgentState, string> = {
  idle: "#6b5e57",
  thinking: "#9b8cf0",
  reading: "#4dd8e6",
  searching: "#5ab8f0",
  coding: "#4dd8e6",
  running: "#e8a33d",
  waiting: "#e8a33d",
  success: "#3dd68c",
  error: "#e5484d",
};

/** Materials shared by the diorama, warm-dark studio. */
export const SCENE_COLOR = {
  ground: "#141010",
  floor: "#6d5642",
  floorSheen: "#5c4835",
  wall: "#574433",
  deskTop: "#a2764f",
  deskLeg: "#3b2f27",
  metal: "#5b4f47",
  seat: "#5d4c41",
  fabric: "#8a7461",
  screenOff: "#0c1013",
  leaf: "#4f9a67",
  leafDark: "#3b7a50",
  pot: "#9c7150",
  glass: "#a7e2ef",
  crate: "#7a5a3c",
  clay: "#c4614a",
  clayLight: "#dd7f68",
  clayDark: "#9c4a37",
  amber: "#e8a33d",
  rug: "#7a5a4a",
  rugAlt: "#5f6b5a",
  window: "#9fd0e8",
  lampWarm: "#ffd9a0",
} as const;

export function stateColor(state: AgentState): string {
  return STATE_COLOR[state];
}
