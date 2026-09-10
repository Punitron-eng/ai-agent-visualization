import type { AgentEvent, AgentState } from "@/lib/agent/agentTypes";
import { toProjectId, normalizePath } from "@/lib/bridge/projectId";
import { toolStateFor } from "@/lib/bridge/toolStateMap";

/**
 * Raw Claude Code hook payload -> AgentEvent.
 *
 * Verified against docs and the installed binary (v2.1.263), but every field is
 * read defensively: hook payloads are an integration surface that changes
 * between versions, so an unknown shape must degrade, never throw. Notably the
 * binary contains both `tool_result` and `tool_response`, and does NOT contain
 * the documented `start_reason` / `end_reason` strings, so both spellings are
 * accepted everywhere.
 */

type Raw = Record<string, unknown>;

const WAITING_NOTIFICATIONS = new Set([
  "permission_prompt",
  "idle_prompt",
  "agent_needs_input",
  "elicitation_dialog",
  "elicitation_url_dialog",
]);

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function obj(value: unknown): Raw | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : undefined;
}

/** Shortens an absolute path to something readable on a small monitor. */
export function relativeFile(filePath: string | undefined, projectPath: string | undefined): string | undefined {
  if (!filePath) return undefined;
  const normalized = normalizePath(filePath);
  if (projectPath) {
    const base = normalizePath(projectPath);
    if (normalized.toLowerCase().startsWith(base.toLowerCase() + "/")) {
      return normalized.slice(base.length + 1);
    }
  }
  const parts = normalized.split("/");
  return parts.length > 3 ? parts.slice(-3).join("/") : normalized;
}

export interface NormalizeResult {
  event: AgentEvent | null;
  /** Populated when the payload was understood but not routable. */
  reason?: string;
}

export function normalizeHookEvent(raw: unknown, receivedAt = Date.now()): NormalizeResult {
  const payload = obj(raw);
  if (!payload) return { event: null, reason: "payload is not an object" };

  const hookEvent = str(payload.hook_event_name) ?? str(payload.hookEventName);
  const cwd = str(payload.cwd);
  const sessionId = str(payload.session_id) ?? str(payload.sessionId);

  // `cwd` is the routing key. Without it there is no workstation to attribute
  // the event to, so it is dropped rather than guessed at.
  if (!cwd) return { event: null, reason: "no cwd in payload" };
  if (!hookEvent) return { event: null, reason: "no hook_event_name in payload" };

  const projectPath = normalizePath(cwd);
  const toolInput = obj(payload.tool_input) ?? {};
  const toolName = str(payload.tool_name);

  const base: AgentEvent = {
    type: hookEvent,
    state: "thinking",
    timestamp: receivedAt,
    projectId: toProjectId(cwd),
    projectPath,
    sessionId,
    source: "debug" === str(payload.__source) ? "debug" : "hook",
    tool: toolName,
    agentType: str(payload.agent_type),
    agentId: str(payload.agent_id),
    permissionMode: str(payload.permission_mode),
    model: str(payload.model),
  };

  switch (hookEvent) {
    case "SessionStart":
      return {
        event: { ...base, state: "idle", lifecycle: "session-start", message: "session started" },
      };

    case "SessionEnd":
      return {
        event: { ...base, state: "idle", lifecycle: "session-end", message: "session ended" },
      };

    case "UserPromptSubmit": {
      // Docs name this `user_input`; older payloads used `prompt`.
      const prompt = str(payload.user_input) ?? str(payload.prompt);
      return { event: { ...base, state: "thinking", message: prompt?.slice(0, 160) } };
    }

    case "PreToolUse": {
      const state = toolStateFor(toolName);
      return { event: { ...base, state, ...describeTool(toolName, toolInput, projectPath) } };
    }

    case "PostToolUse":
      return {
        event: {
          ...base,
          state: "thinking",
          ...describeTool(toolName, toolInput, projectPath),
          message: undefined,
        },
      };

    case "PostToolUseFailure": {
      const detail =
        str(payload.error) ?? str(payload.error_output) ?? `${toolName ?? "tool"} failed`;
      return {
        event: {
          ...base,
          state: "error",
          isError: true,
          ...describeTool(toolName, toolInput, projectPath),
          message: detail.slice(0, 200),
        },
      };
    }

    case "Notification": {
      const kind = str(payload.notification_type);
      const waiting = kind ? WAITING_NOTIFICATIONS.has(kind) : true;
      return {
        event: {
          ...base,
          state: waiting ? "waiting" : "thinking",
          message: str(payload.message) ?? kind,
        },
      };
    }

    case "PermissionRequest":
      return {
        event: {
          ...base,
          state: "waiting",
          ...describeTool(toolName, toolInput, projectPath),
          message: "waiting for permission",
        },
      };

    case "Stop":
      return { event: { ...base, state: "success", message: "turn complete" } };

    case "StopFailure":
      return {
        event: {
          ...base,
          state: "error",
          isError: true,
          message: str(payload.error_type) ?? "turn failed",
        },
      };

    case "SubagentStart":
      return {
        event: {
          ...base,
          state: "thinking",
          lifecycle: "subagent-start",
          message: `${str(payload.agent_type) ?? "subagent"} started`,
        },
      };

    case "SubagentStop":
      return {
        event: {
          ...base,
          state: "thinking",
          lifecycle: "subagent-stop",
          message: `${str(payload.agent_type) ?? "subagent"} finished`,
        },
      };

    default:
      // An unrecognised event still counts as activity: it keeps the session
      // alive and refreshes metadata without asserting a state change.
      return { event: { ...base, state: "thinking", message: undefined } };
  }
}

/** Pulls the human-meaningful bit out of a tool's arguments. */
function describeTool(
  toolName: string | undefined,
  toolInput: Raw,
  projectPath: string,
): Partial<AgentEvent> {
  const filePath = str(toolInput.file_path) ?? str(toolInput.notebook_path);
  const command = str(toolInput.command);
  const pattern = str(toolInput.pattern) ?? str(toolInput.query);
  const globPath = str(toolInput.path);

  if (command) return { command: command.slice(0, 200) };
  if (filePath) return { file: relativeFile(filePath, projectPath) };
  if (pattern) return { message: `"${pattern.slice(0, 80)}"` };
  if (globPath) return { file: relativeFile(globPath, projectPath) };
  if (toolName === "Agent" || toolName === "Task") {
    const description = str(toolInput.description);
    return { message: description?.slice(0, 80) };
  }
  return {};
}

/** Synthetic events from the debug panel travel the same path as real ones. */
export function makeDebugEvent(
  projectPath: string,
  state: AgentState,
  receivedAt = Date.now(),
): AgentEvent {
  return {
    type: "debug",
    state,
    timestamp: receivedAt,
    projectId: toProjectId(projectPath),
    projectPath: normalizePath(projectPath),
    source: "debug",
    sessionId: "debug",
    message: `debug: ${state}`,
  };
}
