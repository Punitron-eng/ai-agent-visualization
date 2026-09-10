import type { Variants, Transition } from "motion/react";
import type { AgentState } from "@/lib/agent/agentTypes";

/**
 * The entire animation vocabulary of the character.
 *
 * Event code never reaches in here, and nothing in here knows where a state
 * came from. Adding a state means adding one entry to each map below plus one
 * line in toolStateMap / the state machine.
 */

const loop = (duration: number, delay = 0): Transition => ({
  duration,
  repeat: Infinity,
  ease: "easeInOut",
  delay,
});

const settle: Transition = { type: "spring", stiffness: 220, damping: 22, mass: 0.7 };

/** Whole-body posture. */
export const bodyVariants: Variants = {
  idle: { y: [0, -1.6, 0], rotate: 0, scaleY: [1, 1.012, 1], transition: loop(4.2) },
  thinking: { y: [0, -1, 0], rotate: -1.5, scaleY: 1, transition: { ...loop(3.4), rotate: settle } },
  reading: { y: [0, -1, 0], rotate: 0, scaleY: 1, transition: loop(3.6) },
  searching: { y: [0, -1.4, 0], rotate: 0, scaleY: 1, transition: loop(2.4) },
  coding: { y: [0, -2.2, 0], rotate: 0, scaleY: 1, transition: loop(0.62) },
  running: { y: [0, -1, 0], rotate: 1.2, scaleY: 1, transition: { ...loop(2.8), rotate: settle } },
  waiting: { y: [0, -0.8, 0], rotate: 0, scaleY: 1, transition: loop(5.5) },
  success: { y: [0, -9, 0, -4, 0], rotate: 0, scaleY: [1, 0.94, 1.05, 1], transition: { duration: 0.9, ease: "easeOut" } },
  error: { y: 0, rotate: [0, -3, 3, -2, 2, 0], scaleY: 1, transition: { duration: 0.5, ease: "easeInOut" } },
};

/** Head look direction and tilt. The monitor sits up and to the right. */
export const headVariants: Variants = {
  idle: { x: [0, 0.8, 0, -0.8, 0], y: 0, rotate: [0, 0.7, 0, -0.7, 0], transition: loop(7) },
  thinking: { x: -1.5, y: -1, rotate: -7, transition: settle },
  reading: { x: 1, y: [-1.5, 1.5, -1.5], rotate: 2, transition: { ...loop(3.2), x: settle, rotate: settle } },
  searching: { x: [-3, 3.5, -2, 3, -3], y: -0.5, rotate: [-3, 3, -2, 3, -3], transition: loop(2.1) },
  coding: { x: 1.2, y: 0.6, rotate: 1.5, transition: settle },
  running: { x: 2, y: 0, rotate: 3, transition: settle },
  waiting: { x: 0, y: 0, rotate: [0, -1, 0], transition: { ...loop(5), rotate: loop(5) } },
  success: { x: 0, y: -1, rotate: [0, -6, 6, 0], transition: { duration: 0.8 } },
  error: { x: 0, y: 1.5, rotate: [0, 4, -4, 0], transition: { duration: 0.5 } },
};

/** Visor brightness and shape carry most of the "expression". */
export const visorVariants: Variants = {
  idle: { opacity: [0.62, 0.78, 0.62], scaleY: 1, transition: loop(4.2) },
  thinking: { opacity: [0.55, 1, 0.55], scaleY: 1, transition: loop(1.5) },
  reading: { opacity: 0.92, scaleY: 0.82, transition: { duration: 0.3 } },
  searching: { opacity: [0.7, 1, 0.7], scaleY: 0.9, transition: loop(1.05) },
  coding: { opacity: [0.8, 1, 0.8], scaleY: 1, transition: loop(0.62) },
  running: { opacity: [0.6, 0.95, 0.6], scaleY: 1, transition: loop(1.6) },
  waiting: { opacity: [0.3, 0.85, 0.3], scaleY: 1, transition: loop(2.6) },
  success: { opacity: 1, scaleY: [1, 0.35, 1], transition: { duration: 0.7 } },
  error: { opacity: [1, 0.4, 1], scaleY: 0.55, transition: loop(0.4) },
};

/** Typing hand. `y` is the keystroke; the other states park it. */
export const handLeftVariants: Variants = {
  idle: { y: 0, x: 0, rotate: 0, transition: settle },
  thinking: { y: 0, x: 0, rotate: 0, transition: settle },
  reading: { y: 0, x: 0, rotate: 0, transition: settle },
  searching: { y: [0, -1.5, 0], x: 0, rotate: 0, transition: loop(1.05) },
  coding: { y: [0, -3.2, 0], x: [0, -1, 0], rotate: 0, transition: loop(0.31) },
  running: { y: 0, x: 0, rotate: 0, transition: settle },
  waiting: { y: 0, x: 0, rotate: 0, transition: settle },
  success: { y: -10, x: -2, rotate: -22, transition: { type: "spring", stiffness: 300, damping: 14 } },
  error: { y: 0, x: 0, rotate: 0, transition: settle },
};

/** Right hand doubles as the "hand to chin" gesture when thinking. */
export const handRightVariants: Variants = {
  idle: { y: 0, x: 0, rotate: 0, transition: settle },
  thinking: { y: -13, x: -7, rotate: -28, transition: settle },
  reading: { y: 0, x: 0, rotate: 0, transition: settle },
  searching: { y: [0, -1.5, 0], x: 0, rotate: 0, transition: loop(1.05, 0.5) },
  coding: { y: [0, -3.2, 0], x: [0, 1, 0], rotate: 0, transition: loop(0.31, 0.15) },
  running: { y: -2, x: 2, rotate: 6, transition: settle },
  waiting: { y: 0, x: 0, rotate: 0, transition: settle },
  success: { y: -10, x: 2, rotate: 22, transition: { type: "spring", stiffness: 300, damping: 14 } },
  error: { y: -4, x: 1, rotate: 10, transition: settle },
};

/** Antenna bulb: the small "processing" tell. */
export const antennaVariants: Variants = {
  idle: { rotate: [0, 2, 0, -2, 0], transition: loop(6) },
  thinking: { rotate: [0, 9, -9, 0], transition: loop(1.6) },
  reading: { rotate: [0, 2, 0], transition: loop(4) },
  searching: { rotate: [-8, 8, -8], transition: loop(1.2) },
  coding: { rotate: [0, 3, 0, -3, 0], transition: loop(1.1) },
  running: { rotate: [0, 5, 0], transition: loop(1.8) },
  waiting: { rotate: 0, transition: settle },
  success: { rotate: [0, 16, -16, 0], transition: { duration: 0.8 } },
  error: { rotate: [0, -14, 14, 0], transition: { duration: 0.5 } },
};

/** How fast the desk lamp / monitor spill pulses. */
export const glowVariants: Variants = {
  idle: { opacity: [0.25, 0.34, 0.25], transition: loop(5) },
  thinking: { opacity: [0.3, 0.5, 0.3], transition: loop(1.8) },
  reading: { opacity: 0.5, transition: { duration: 0.4 } },
  searching: { opacity: [0.35, 0.6, 0.35], transition: loop(1.2) },
  coding: { opacity: [0.45, 0.7, 0.45], transition: loop(0.62) },
  running: { opacity: [0.35, 0.62, 0.35], transition: loop(1.4) },
  waiting: { opacity: [0.2, 0.45, 0.2], transition: loop(2.6) },
  success: { opacity: [0.9, 0.5], transition: { duration: 0.9 } },
  error: { opacity: [0.8, 0.35, 0.8], transition: loop(0.5) },
};

/** Compact cards run a calmer version of the same vocabulary. */
export const REDUCED_STATES: ReadonlySet<AgentState> = new Set(["idle", "waiting"]);

export const STATE_LABEL: Record<AgentState, string> = {
  idle: "idle",
  thinking: "thinking",
  reading: "reading",
  searching: "searching",
  coding: "coding",
  running: "running a command",
  waiting: "waiting for you",
  success: "finished",
  error: "hit an error",
};

/** Short form used on the grid chips. */
export const STATE_SHORT: Record<AgentState, string> = {
  idle: "IDLE",
  thinking: "THINKING",
  reading: "READING",
  searching: "SEARCHING",
  coding: "CODING",
  running: "RUNNING",
  waiting: "WAITING",
  success: "DONE",
  error: "ERROR",
};
