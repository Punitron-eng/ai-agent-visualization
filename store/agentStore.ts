"use client";

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type {
  BridgeMessage,
  MonitorLine,
  ProjectId,
  ProjectRuntime,
} from "@/lib/agent/agentTypes";
import { STATE_PRECEDENCE } from "@/lib/agent/agentTypes";
import { DEFAULT_VIBE, VIBES, type VibeId } from "@/lib/agent/vibes";

/** Seeded projects that have never produced a live event sort to the back. */
export function sortProjects(projects: ProjectRuntime[]): ProjectRuntime[] {
  return [...projects].sort((a, b) => {
    if (a.seeded !== b.seeded) return a.seeded ? 1 : -1;
    const rank = STATE_PRECEDENCE[b.state] - STATE_PRECEDENCE[a.state];
    if (rank !== 0) return rank;
    return b.lastActivityAt - a.lastActivityAt;
  });
}

export interface ActivityEntry extends MonitorLine {
  projectId: ProjectId;
  projectName: string;
}

const ACTIVITY_LIMIT = 40;

interface AgentStore {
  projects: Record<ProjectId, ProjectRuntime>;
  order: ProjectId[];
  /** Newest-first feed across every project, for the activity panel. */
  activity: ActivityEntry[];
  connected: boolean;
  focusedId: ProjectId | null;
  showDormant: boolean;
  serverStartedAt: number | null;

  apply(message: BridgeMessage): void;
  setConnected(connected: boolean): void;
  focus(id: ProjectId | null): void;
  toggleDormant(): void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  projects: {},
  order: [],
  activity: [],
  connected: false,
  focusedId: null,
  showDormant: false,
  serverStartedAt: null,

  apply(message) {
    set((current) => {
      switch (message.type) {
        case "snapshot": {
          const projects: Record<ProjectId, ProjectRuntime> = {};
          for (const project of message.projects) projects[project.id] = project;
          return {
            projects,
            order: sortProjects(message.projects).map((p) => p.id),
            serverStartedAt: message.serverStartedAt,
          };
        }
        case "patch": {
          const projects = { ...current.projects };
          const fresh: ActivityEntry[] = [];

          for (const project of message.projects) {
            // Only terminal lines the client has not seen become activity, so
            // a re-sent snapshot of a project never duplicates its history.
            const seen = current.projects[project.id]?.terminal;
            const lastSeenId = seen?.[seen.length - 1]?.id;
            const cutoff = lastSeenId
              ? project.terminal.findIndex((line) => line.id === lastSeenId) + 1
              : project.terminal.length;
            for (const line of project.terminal.slice(cutoff)) {
              fresh.push({ ...line, projectId: project.id, projectName: project.name });
            }
            projects[project.id] = project;
          }

          const activity = fresh.length
            ? [...fresh.reverse(), ...current.activity].slice(0, ACTIVITY_LIMIT)
            : current.activity;

          return {
            projects,
            activity,
            order: sortProjects(Object.values(projects)).map((p) => p.id),
          };
        }
        case "removed": {
          const projects = { ...current.projects };
          for (const id of message.projectIds) delete projects[id];
          return {
            projects,
            order: sortProjects(Object.values(projects)).map((p) => p.id),
            focusedId:
              current.focusedId && message.projectIds.includes(current.focusedId)
                ? null
                : current.focusedId,
          };
        }
        default:
          return current;
      }
    });
  },

  setConnected: (connected) => set({ connected }),
  focus: (focusedId) => set({ focusedId }),
  toggleDormant: () => set((s) => ({ showDormant: !s.showDormant })),
}));

/**
 * Subscribing to one project keeps an event in repo A from re-rendering repo B.
 * This is what makes a grid of a dozen animated workstations affordable.
 */
export function useProject(id: ProjectId): ProjectRuntime | undefined {
  return useAgentStore((s) => s.projects[id]);
}

/**
 * Two selectors rather than one returning `{active, dormant}`: useShallow
 * compares the selected value one level deep, so a wrapper object holding two
 * freshly-built arrays would never compare equal and would loop forever.
 */
export function useActiveProjectIds(): ProjectId[] {
  return useAgentStore(useShallow((s) => s.order.filter((id) => !s.projects[id]?.seeded)));
}

export function useDormantProjectIds(): ProjectId[] {
  return useAgentStore(useShallow((s) => s.order.filter((id) => s.projects[id]?.seeded)));
}

export function useProjectIds(): ProjectId[] {
  return useAgentStore(useShallow((s) => s.order));
}

/**
 * Aggregate signals that drive the office's workflow zones and the workflow
 * bar. Every one is read off real project state — the commands are the ones
 * Claude Code actually ran — and the selector returns a bitmask so it stays a
 * primitive and cannot loop.
 */
export interface WorkflowSignals {
  /** Something is thinking: the planning room. */
  planning: boolean;
  /** Something is editing: the development pods. */
  building: boolean;
  /** A test command is running: the test bench. */
  testing: boolean;
  /** A git command is running: the review area. */
  reviewing: boolean;
  /** A build or deploy command is running: the deployment bay. */
  deploying: boolean;
  /** Something is blocked on you: someone waits in the chill zone. */
  waiting: boolean;
}

// Matched against the command Claude Code actually ran, so a step only lights
// when that work is genuinely happening. Git is tested first at the call site,
// since the generic verbs can appear inside any script name.
const TEST_CMD = /\b(test|tests|jest|vitest|pytest|phpunit|rspec|playwright)\b/i;
const GIT_CMD = /^\s*(git|gh)\s/i;
const SHIP_CMD = /\b(build|deploy|publish|docker|vercel|release)\b/i;

export const STEP_BITS = { test: 4, push: 8, deploy: 16 } as const;

/**
 * Which workflow step a command belongs to. Git is checked first: a commit
 * message can mention tests or a build without the command being either.
 * Anything unrecognised counts as work at the test bench rather than vanishing.
 */
export function classifyCommand(command: string): number {
  if (GIT_CMD.test(command)) return STEP_BITS.push;
  if (TEST_CMD.test(command)) return STEP_BITS.test;
  if (SHIP_CMD.test(command)) return STEP_BITS.deploy;
  return STEP_BITS.test;
}

export function useWorkflowSignals(): WorkflowSignals {
  const mask = useAgentStore((s) => {
    let bits = 0;
    for (const id of s.order) {
      const p = s.projects[id];
      if (!p || p.seeded) continue;
      if (p.state === "thinking") bits |= 1;
      if (p.state === "coding") bits |= 2;
      if (p.state === "waiting") bits |= 32;

      // Classify on the command whenever one is in flight. A project blocked on
      // a permission prompt for `git push` is still at the Push step — the
      // command is real and pending, not finished.
      if ((p.state === "running" || p.state === "waiting") && p.command) {
        bits |= classifyCommand(p.command);
      }
    }
    return bits;
  });

  return {
    planning: (mask & 1) !== 0,
    building: (mask & 2) !== 0,
    testing: (mask & 4) !== 0,
    reviewing: (mask & 8) !== 0,
    deploying: (mask & 16) !== 0,
    waiting: (mask & 32) !== 0,
  };
}

/**
 * True while any live project is doing something. Drives the 3D scene's
 * on-demand render loop, so an idle office costs no GPU time at all.
 */
export function useAnyBusy(): boolean {
  return useAgentStore((s) => {
    for (const id of s.order) {
      const p = s.projects[id];
      if (p && !p.seeded && p.state !== "idle") return true;
    }
    return false;
  });
}

/**
 * The office vibe. Persisted per browser so the room looks the way you left
 * it; the SSR pass always renders the default to avoid a hydration mismatch,
 * and the stored choice is applied on mount.
 */
const VIBE_KEY = "cc.vibe";

interface VibeStore {
  vibe: VibeId;
  setVibe(vibe: VibeId): void;
  hydrateVibe(): void;
}

export const useVibeStore = create<VibeStore>((set) => ({
  vibe: DEFAULT_VIBE,
  setVibe(vibe) {
    set({ vibe });
    try {
      localStorage.setItem(VIBE_KEY, vibe);
    } catch {
      // Private mode or blocked storage: the choice just will not persist.
    }
  },
  hydrateVibe() {
    try {
      const stored = localStorage.getItem(VIBE_KEY) as VibeId | null;
      if (stored && stored in VIBES) set({ vibe: stored });
    } catch {
      /* ignore */
    }
  },
}));
