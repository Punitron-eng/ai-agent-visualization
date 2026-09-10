import type { AgentEvent } from "@/lib/agent/agentTypes";
import { toProjectId, normalizePath } from "@/lib/bridge/projectId";
import { relativeFile } from "@/lib/bridge/normalizeEvent";
import { toolStateFor } from "@/lib/bridge/toolStateMap";

/**
 * Session transcript (~/.claude/projects/<slug>/<session>.jsonl) -> AgentEvent.
 *
 * This is a deliberately secondary source. It exists because it carries three
 * things hooks do not expose at all:
 *   - thinking blocks (there is no thinking hook; verified absent in v2.1.263)
 *   - the model id and git branch
 *   - token usage
 *
 * The file is append-only newline-delimited JSON and is flushed as the turn
 * happens (verified by live-tailing a running session). Its shape is internal
 * to Claude Code, so every access here is defensive and a parse failure is
 * simply skipped.
 */

type Raw = Record<string, unknown>;

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function obj(value: unknown): Raw | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : undefined;
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function parseTranscriptLine(line: string, receivedAt = Date.now()): AgentEvent[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return [];
  }

  const entry = obj(parsed);
  if (!entry) return [];

  const cwd = str(entry.cwd);
  if (!cwd) return []; // Bookkeeping lines (mode, atis-latch, ...) carry no cwd.

  const projectPath = normalizePath(cwd);
  const timestamp = parseTimestamp(entry.timestamp) ?? receivedAt;

  const base: Omit<AgentEvent, "type" | "state"> = {
    timestamp,
    projectId: toProjectId(cwd),
    projectPath,
    sessionId: str(entry.sessionId) ?? str(entry.session_id),
    source: "transcript",
    gitBranch: str(entry.gitBranch),
  };

  const type = str(entry.type);

  if (type === "assistant") {
    const message = obj(entry.message);
    if (!message) return [];
    const model = str(message.model);
    const tokens = readUsage(message.usage);
    const events: AgentEvent[] = [];

    for (const block of arr(message.content)) {
      const content = obj(block);
      const blockType = str(content?.type);

      if (blockType === "thinking") {
        // The thinking text is redacted to "" (signature only) — its presence,
        // not its content, is the signal.
        events.push({
          ...base,
          type: "transcript:thinking",
          state: "thinking",
          model,
          tokens,
        });
      } else if (blockType === "tool_use") {
        const toolName = str(content?.name);
        const input = obj(content?.input) ?? {};
        events.push({
          ...base,
          type: "transcript:tool_use",
          state: toolStateFor(toolName),
          tool: toolName,
          model,
          tokens,
          ...describe(input, projectPath),
        });
      } else if (blockType === "text") {
        events.push({
          ...base,
          type: "transcript:text",
          state: "thinking",
          model,
          tokens,
        });
      }
    }

    if (events.length === 0 && (model || tokens)) {
      events.push({ ...base, type: "transcript:meta", state: "thinking", model, tokens });
    }
    return events;
  }

  if (type === "user") {
    const message = obj(entry.message);
    const content = arr(message?.content);
    const results = content
      .map(obj)
      .filter((block): block is Raw => Boolean(block) && str(block?.type) === "tool_result");

    if (results.length > 0) {
      const failed = results.some((block) => block.is_error === true);
      return [
        {
          ...base,
          type: failed ? "transcript:tool_error" : "transcript:tool_result",
          state: failed ? "error" : "thinking",
          isError: failed,
          message: failed ? "tool failed" : undefined,
        },
      ];
    }

    if (typeof message?.content === "string") {
      return [{ ...base, type: "transcript:prompt", state: "thinking" }];
    }
  }

  return [];
}

function describe(input: Raw, projectPath: string): Partial<AgentEvent> {
  const command = str(input.command);
  if (command) return { command: command.slice(0, 200) };
  const filePath = str(input.file_path) ?? str(input.notebook_path);
  if (filePath) return { file: relativeFile(filePath, projectPath) };
  const pattern = str(input.pattern) ?? str(input.query);
  if (pattern) return { message: `"${pattern.slice(0, 80)}"` };
  return {};
}

function readUsage(value: unknown): AgentEvent["tokens"] {
  const usage = obj(value);
  if (!usage) return undefined;
  const input =
    (num(usage.input_tokens) ?? 0) +
    (num(usage.cache_read_input_tokens) ?? 0) +
    (num(usage.cache_creation_input_tokens) ?? 0);
  const output = num(usage.output_tokens) ?? 0;
  if (input === 0 && output === 0) return undefined;
  return { input, output };
}

function parseTimestamp(value: unknown): number | undefined {
  const raw = str(value);
  if (!raw) return undefined;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** First line of a transcript that reveals which repo it belongs to. */
export function cwdFromTranscriptLine(line: string): string | null {
  try {
    const entry = obj(JSON.parse(line));
    return str(entry?.cwd) ?? null;
  } catch {
    return null;
  }
}
