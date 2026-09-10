/**
 * The contract between the Claude Code integration and everything that draws.
 * Nothing below this file knows what a "hook" or a "transcript" is.
 */

export type AgentState =
  | "idle"
  | "thinking"
  | "reading"
  | "searching"
  | "coding"
  | "running"
  | "waiting"
  | "success"
  | "error";

export const AGENT_STATES: readonly AgentState[] = [
  "idle",
  "thinking",
  "reading",
  "searching",
  "coding",
  "running",
  "waiting",
  "success",
  "error",
] as const;

/**
 * When several sessions share one project, the workstation shows the most
 * "attention-worthy" of them. Higher wins.
 */
export const STATE_PRECEDENCE: Record<AgentState, number> = {
  error: 90,
  waiting: 80,
  success: 70,
  coding: 60,
  running: 50,
  searching: 40,
  reading: 30,
  thinking: 20,
  idle: 0,
};

/** Canonical absolute path, lowercased. Derived from `cwd`, never from a directory slug. */
export type ProjectId = string;

export type EventSourceKind = "hook" | "transcript" | "debug";

export interface AgentEvent {
  /** Raw `hook_event_name`, or `transcript:*`, or `debug`. */
  type: string;
  state: AgentState;
  message?: string;
  file?: string;
  command?: string;
  timestamp: number;

  projectId: ProjectId;
  projectPath?: string;
  sessionId?: string;
  source: EventSourceKind;

  tool?: string;
  agentType?: string;
  agentId?: string;
  model?: string;
  gitBranch?: string;
  permissionMode?: string;
  isError?: boolean;
  /** Set by SessionEnd / SubagentStop so the registry can drop bookkeeping. */
  lifecycle?: "session-start" | "session-end" | "subagent-start" | "subagent-stop";
  tokens?: TokenUsage;
  /**
   * Carries metadata only: refresh model / branch / tokens and keep the session
   * alive, but take no part in the state machine. Used when a second source
   * echoes work the authoritative source is already reporting.
   */
  metaOnly?: boolean;
}

export interface TokenUsage {
  input: number;
  output: number;
}

export type MonitorLineKind = "read" | "search" | "edit" | "run" | "info" | "ok" | "fail";

export interface MonitorLine {
  id: string;
  kind: MonitorLineKind;
  text: string;
  timestamp: number;
}

export interface SessionInfo {
  sessionId: string;
  state: AgentState;
  startedAt: number;
  lastActivityAt: number;
  model?: string;
  permissionMode?: string;
  /** Live subagent ids, from SubagentStart / SubagentStop. */
  subagents: string[];
}

export interface ProjectRuntime {
  id: ProjectId;
  /** Real cwd with original casing. */
  path: string;
  /** Folder basename, e.g. "itl-dashboard-react". */
  name: string;
  state: AgentState;
  sessions: Record<string, SessionInfo>;
  activeSessionId?: string;
  file?: string;
  command?: string;
  model?: string;
  gitBranch?: string;
  lastActivityAt: number;
  /** Newest last, capped. */
  terminal: MonitorLine[];
  tokens?: TokenUsage;
  /** True until the project has produced any live event this run. */
  seeded: boolean;
}

/** Wire format on the SSE channel. */
export type BridgeMessage =
  | { type: "snapshot"; projects: ProjectRuntime[]; serverStartedAt: number }
  | { type: "patch"; projects: ProjectRuntime[] }
  | { type: "removed"; projectIds: ProjectId[] }
  | { type: "hello"; serverStartedAt: number };
