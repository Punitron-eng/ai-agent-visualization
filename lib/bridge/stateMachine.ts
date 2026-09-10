import type { AgentEvent, AgentState } from "@/lib/agent/agentTypes";

/**
 * Timing constants. These exist so a burst of parallel tool calls reads as one
 * deliberate motion instead of a flicker, and so transient states resolve on
 * their own if Claude Code disappears mid-turn.
 */
export const TIMING = {
  /** A state must be held this long before a lower-priority event can replace it. */
  minDwellMs: 350,
  successMs: 2500,
  errorMs: 3000,
  /** Silence after which a session drifts back to idle. */
  idleAfterMs: 20_000,
} as const;

export const TRANSIENT_STATES: ReadonlySet<AgentState> = new Set(["success", "error"]);

export interface MachineState {
  state: AgentState;
  /** When `state` was entered. */
  since: number;
  /** For transients: when to fall back, and to what. */
  expiresAt?: number;
  fallback?: AgentState;
  lastActivityAt: number;
}

export function initialMachineState(now: number): MachineState {
  return { state: "idle", since: now, lastActivityAt: now };
}

/**
 * Pure reducer. Knows nothing about projects, transports or Claude Code — the
 * registry applies it once per session and the tests drive it directly.
 */
export function reduce(current: MachineState, event: AgentEvent): MachineState {
  const now = event.timestamp;
  const next = event.state;

  // A transient that has not expired outranks anything except another transient
  // or a higher-severity signal. This keeps a celebration or an error visible.
  if (current.expiresAt && now < current.expiresAt && !TRANSIENT_STATES.has(next)) {
    return { ...current, fallback: next, lastActivityAt: now };
  }

  if (TRANSIENT_STATES.has(next)) {
    return {
      state: next,
      since: now,
      expiresAt: now + (next === "success" ? TIMING.successMs : TIMING.errorMs),
      fallback: "idle",
      lastActivityAt: now,
    };
  }

  // Min-dwell: hold the current state briefly so parallel tool calls in the same
  // batch do not strobe. Activity is still recorded.
  //
  // Waking from idle is exempt: that transition is the one the user is waiting
  // to see, and there is nothing to strobe against.
  if (
    next !== current.state &&
    current.state !== "idle" &&
    now - current.since < TIMING.minDwellMs
  ) {
    return { ...current, fallback: next, lastActivityAt: now };
  }

  if (next === current.state) {
    return { ...current, expiresAt: undefined, fallback: undefined, lastActivityAt: now };
  }

  return { state: next, since: now, lastActivityAt: now };
}

/**
 * Advances time without an event: resolves expired transients, applies a
 * deferred min-dwell target, and decays to idle after silence. Returns the same
 * object when nothing changed so callers can skip work.
 */
export function tick(current: MachineState, now: number): MachineState {
  if (current.expiresAt && now >= current.expiresAt) {
    const resolved = current.fallback ?? "idle";
    return { state: resolved, since: now, lastActivityAt: current.lastActivityAt };
  }

  if (
    !current.expiresAt &&
    current.fallback &&
    current.fallback !== current.state &&
    now - current.since >= TIMING.minDwellMs
  ) {
    return { state: current.fallback, since: now, lastActivityAt: current.lastActivityAt };
  }

  if (
    current.state !== "idle" &&
    !current.expiresAt &&
    now - current.lastActivityAt >= TIMING.idleAfterMs
  ) {
    return { state: "idle", since: now, lastActivityAt: current.lastActivityAt };
  }

  return current;
}

/** Next moment this machine needs attention, or null if it is at rest. */
export function nextDeadline(current: MachineState): number | null {
  const candidates: number[] = [];
  if (current.expiresAt) candidates.push(current.expiresAt);
  if (current.fallback && current.fallback !== current.state) {
    candidates.push(current.since + TIMING.minDwellMs);
  }
  if (current.state !== "idle") candidates.push(current.lastActivityAt + TIMING.idleAfterMs);
  return candidates.length ? Math.min(...candidates) : null;
}
