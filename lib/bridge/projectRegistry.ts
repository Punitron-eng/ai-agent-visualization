import { EventEmitter } from "node:events";
import type {
  AgentEvent,
  AgentState,
  MonitorLine,
  MonitorLineKind,
  ProjectId,
  ProjectRuntime,
  SessionInfo,
} from "@/lib/agent/agentTypes";
import { STATE_PRECEDENCE } from "@/lib/agent/agentTypes";
import { projectNameFromPath, normalizePath } from "@/lib/bridge/projectId";
import {
  initialMachineState,
  reduce,
  tick,
  type MachineState,
} from "@/lib/bridge/stateMachine";

const TERMINAL_LIMIT = 60;
/** A session with no events for this long stops counting toward the workstation. */
const SESSION_STALE_MS = 10 * 60_000;
/** Seeded-but-silent projects are kept; live projects are evicted only when very old. */
const PROJECT_EVICT_MS = 6 * 60 * 60_000;
const TICK_MS = 250;

interface SessionRuntime {
  info: SessionInfo;
  machine: MachineState;
  /** Project a session was first seen in. `cd` mid-session must not re-home it. */
  projectId: ProjectId;
}

interface ProjectEntry {
  runtime: ProjectRuntime;
  sessions: Map<string, SessionRuntime>;
}

/**
 * Owns per-project state. Every project gets its own state machines and its own
 * lifecycle, so an error or a celebration in one repo can never touch another.
 */
export class ProjectRegistry extends EventEmitter {
  private projects = new Map<ProjectId, ProjectEntry>();
  /** sessionId -> projectId, so a session stays with the project it began in. */
  private sessionHome = new Map<string, ProjectId>();
  private dirty = new Set<ProjectId>();
  private timer: NodeJS.Timeout | null = null;
  readonly startedAt = Date.now();

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.advance(Date.now()), TICK_MS);
    // Never hold the process open for the sake of the animation clock.
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  snapshot(): ProjectRuntime[] {
    return [...this.projects.values()].map((entry) => entry.runtime);
  }

  getByPath(projectPath: string): ProjectRuntime | undefined {
    return this.projects.get(normalizePath(projectPath).toLowerCase())?.runtime;
  }

  /** Registers a project discovered from history so the grid is not empty at boot. */
  seed(projectPath: string, lastActivityAt: number): ProjectRuntime {
    const entry = this.ensureProject(projectPath, lastActivityAt);
    if (entry.runtime.seeded) {
      entry.runtime.lastActivityAt = Math.max(entry.runtime.lastActivityAt, lastActivityAt);
      this.dirty.add(entry.runtime.id);
    }
    return entry.runtime;
  }

  ingest(event: AgentEvent): void {
    const projectPath = event.projectPath ?? event.projectId;
    // Pin a session to the project it started in; a later `cd` or worktree move
    // must not spawn a phantom workstation.
    const homed = event.sessionId ? this.sessionHome.get(event.sessionId) : undefined;
    const entry = homed
      ? (this.projects.get(homed) ?? this.ensureProject(projectPath, event.timestamp))
      : this.ensureProject(projectPath, event.timestamp);

    const runtime = entry.runtime;
    runtime.seeded = false;
    runtime.lastActivityAt = Math.max(runtime.lastActivityAt, event.timestamp);
    if (event.model) runtime.model = event.model;
    if (event.gitBranch) runtime.gitBranch = event.gitBranch;
    if (event.tokens) runtime.tokens = event.tokens;

    const sessionId = event.sessionId ?? "unknown";
    if (!this.sessionHome.has(sessionId)) this.sessionHome.set(sessionId, runtime.id);

    if (event.metaOnly) {
      // Refresh metadata and keep the session from drifting to idle mid-command,
      // but leave the state machine and the terminal untouched.
      const session = entry.sessions.get(sessionId);
      if (session) {
        session.info.lastActivityAt = event.timestamp;
        session.machine = { ...session.machine, lastActivityAt: event.timestamp };
        if (event.model) session.info.model = event.model;
      }
      this.dirty.add(runtime.id);
      this.flushSoon();
      return;
    }

    if (event.lifecycle === "session-end") {
      entry.sessions.delete(sessionId);
      this.sessionHome.delete(sessionId);
    } else {
      const session = this.ensureSession(entry, sessionId, event);
      session.machine = reduce(session.machine, event);
      session.info.state = session.machine.state;
      session.info.lastActivityAt = event.timestamp;
      if (event.permissionMode) session.info.permissionMode = event.permissionMode;
      if (event.model) session.info.model = event.model;

      if (event.lifecycle === "subagent-start" && event.agentId) {
        if (!session.info.subagents.includes(event.agentId)) {
          session.info.subagents.push(event.agentId);
        }
      }
      if (event.lifecycle === "subagent-stop" && event.agentId) {
        session.info.subagents = session.info.subagents.filter((id) => id !== event.agentId);
      }
      runtime.activeSessionId = sessionId;
    }

    this.applyDetails(runtime, event);
    this.appendTerminal(runtime, event);
    this.recompute(runtime, entry, event.timestamp);
    this.dirty.add(runtime.id);
    this.flushSoon();
  }

  /** Drives transient decay and idle drift for every project. */
  private advance(now: number): void {
    const removed: ProjectId[] = [];

    for (const entry of this.projects.values()) {
      let changed = false;

      for (const [sessionId, session] of entry.sessions) {
        if (now - session.info.lastActivityAt > SESSION_STALE_MS) {
          entry.sessions.delete(sessionId);
          this.sessionHome.delete(sessionId);
          changed = true;
          continue;
        }
        const nextMachine = tick(session.machine, now);
        if (nextMachine !== session.machine) {
          session.machine = nextMachine;
          session.info.state = nextMachine.state;
          changed = true;
        }
      }

      if (changed) {
        this.recompute(entry.runtime, entry, now);
        this.dirty.add(entry.runtime.id);
      }

      if (
        entry.sessions.size === 0 &&
        !entry.runtime.seeded &&
        now - entry.runtime.lastActivityAt > PROJECT_EVICT_MS
      ) {
        this.projects.delete(entry.runtime.id);
        this.dirty.delete(entry.runtime.id);
        removed.push(entry.runtime.id);
      }
    }

    if (removed.length) this.emit("removed", removed);
    this.flush();
  }

  private ensureProject(projectPath: string, now: number): ProjectEntry {
    const normalized = normalizePath(projectPath);
    const id = normalized.toLowerCase();
    const existing = this.projects.get(id);
    if (existing) return existing;

    const runtime: ProjectRuntime = {
      id,
      path: normalized,
      name: projectNameFromPath(normalized),
      state: "idle",
      sessions: {},
      lastActivityAt: now,
      terminal: [],
      seeded: true,
    };
    const entry: ProjectEntry = { runtime, sessions: new Map() };
    this.projects.set(id, entry);
    this.dirty.add(id);
    return entry;
  }

  private ensureSession(entry: ProjectEntry, sessionId: string, event: AgentEvent): SessionRuntime {
    const existing = entry.sessions.get(sessionId);
    if (existing) return existing;
    const session: SessionRuntime = {
      projectId: entry.runtime.id,
      machine: initialMachineState(event.timestamp),
      info: {
        sessionId,
        state: "idle",
        startedAt: event.timestamp,
        lastActivityAt: event.timestamp,
        model: event.model,
        permissionMode: event.permissionMode,
        subagents: [],
      },
    };
    entry.sessions.set(sessionId, session);
    return session;
  }

  private applyDetails(runtime: ProjectRuntime, event: AgentEvent): void {
    if (event.file) {
      runtime.file = event.file;
      runtime.command = undefined;
    }
    if (event.command) {
      runtime.command = event.command;
      runtime.file = undefined;
    }
  }

  /** Aggregate state = the most attention-worthy live session. */
  private recompute(runtime: ProjectRuntime, entry: ProjectEntry, now: number): void {
    const sessions = [...entry.sessions.values()];
    runtime.sessions = Object.fromEntries(sessions.map((s) => [s.info.sessionId, s.info]));

    if (sessions.length === 0) {
      runtime.state = "idle";
      runtime.activeSessionId = undefined;
      return;
    }

    let best: SessionRuntime = sessions[0];
    for (const session of sessions) {
      const a = STATE_PRECEDENCE[session.info.state];
      const b = STATE_PRECEDENCE[best.info.state];
      if (a > b || (a === b && session.info.lastActivityAt > best.info.lastActivityAt)) {
        best = session;
      }
    }
    runtime.state = best.info.state;
    runtime.activeSessionId = best.info.sessionId;
    if (best.info.model) runtime.model = best.info.model;
    void now;
  }

  private appendTerminal(runtime: ProjectRuntime, event: AgentEvent): void {
    const line = terminalLineFor(event);
    if (!line) return;
    const last = runtime.terminal[runtime.terminal.length - 1];
    if (last && last.text === line.text && last.kind === line.kind) return;
    runtime.terminal.push(line);
    if (runtime.terminal.length > TERMINAL_LIMIT) {
      runtime.terminal.splice(0, runtime.terminal.length - TERMINAL_LIMIT);
    }
  }

  /**
   * Patches are coalesced so a burst across several projects becomes one frame
   * rather than one render per event.
   */
  private flushHandle: NodeJS.Timeout | null = null;
  private flushSoon(): void {
    if (this.flushHandle) return;
    this.flushHandle = setTimeout(() => {
      this.flushHandle = null;
      this.flush();
    }, 60);
    this.flushHandle.unref?.();
  }

  private flush(): void {
    if (this.dirty.size === 0) return;
    const projects: ProjectRuntime[] = [];
    for (const id of this.dirty) {
      const entry = this.projects.get(id);
      if (entry) projects.push(entry.runtime);
    }
    this.dirty.clear();
    if (projects.length) this.emit("patch", projects);
  }

  /** Test/teardown helper: drops every project and clears all timers. */
  reset(): void {
    this.projects.clear();
    this.sessionHome.clear();
    this.dirty.clear();
    if (this.flushHandle) clearTimeout(this.flushHandle);
    this.flushHandle = null;
  }
}

let counter = 0;

export function terminalLineFor(event: AgentEvent): MonitorLine | null {
  const make = (kind: MonitorLineKind, text: string): MonitorLine => ({
    id: `${event.timestamp}-${counter++}`,
    kind,
    text,
    timestamp: event.timestamp,
  });

  if (event.type === "PostToolUseFailure" || event.type === "StopFailure") {
    return make("fail", event.message ?? "failed");
  }
  if (event.type === "Stop") return make("ok", "done");
  if (event.type === "PermissionRequest" || event.state === "waiting") {
    return make("info", event.message ?? "waiting for input");
  }
  if (event.type === "SessionStart") return make("info", "session started");
  if (event.type === "UserPromptSubmit") {
    return make("info", event.message ? `> ${event.message}` : "> new prompt");
  }

  // Only the *start* of a tool call produces a line; PostToolUse would double it.
  if (event.type !== "PreToolUse" && event.type !== "debug") return null;

  if (event.command) return make("run", `$ ${event.command}`);

  switch (event.state) {
    case "reading":
      return event.file ? make("read", `read ${event.file}`) : null;
    case "coding":
      return event.file ? make("edit", `edit ${event.file}`) : null;
    case "searching":
      return make("search", `search ${event.message ?? event.file ?? ""}`.trim());
    case "thinking":
      return event.message ? make("info", event.message) : null;
    default:
      return event.message ? make("info", event.message) : null;
  }
}

export function stateRank(state: AgentState): number {
  return STATE_PRECEDENCE[state];
}
