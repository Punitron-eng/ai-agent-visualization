import { existsSync } from "node:fs";
import type { AgentEvent, BridgeMessage, ProjectId, ProjectRuntime } from "@/lib/agent/agentTypes";
import { ProjectRegistry } from "@/lib/bridge/projectRegistry";
import { TranscriptWatcher } from "@/lib/bridge/transcriptWatcher";

/**
 * Process-wide singleton wiring the two real event sources into the registry.
 *
 * Held on globalThis because `next dev` re-evaluates modules on HMR; a plain
 * module-level instance would be recreated and leak its watchers.
 */

type Listener = (message: BridgeMessage) => void;

/** Hooks win over the transcript for this long after a session's last hook. */
const HOOK_AUTHORITY_MS = 90_000;

export interface Bridge {
  registry: ProjectRegistry;
  watcher: TranscriptWatcher;
  subscribe(listener: Listener): () => void;
  ingest(event: AgentEvent): void;
  snapshot(): ProjectRuntime[];
  readonly startedAt: number;
  readonly stats: { hookEvents: number; transcriptEvents: number; debugEvents: number };
  dispose(): void;
}

declare global {
  var __claudeCompanionBridge: Bridge | undefined;
}

function createBridge(): Bridge {
  const registry = new ProjectRegistry();
  const watcher = new TranscriptWatcher();
  const listeners = new Set<Listener>();
  const stats = { hookEvents: 0, transcriptEvents: 0, debugEvents: 0 };
  /** sessionId -> last hook timestamp, for source arbitration. */
  const lastHookAt = new Map<string, number>();

  const broadcast = (message: BridgeMessage): void => {
    for (const listener of listeners) {
      try {
        listener(message);
      } catch {
        // A broken client must never take down the bridge.
      }
    }
  };

  registry.on("patch", (projects: ProjectRuntime[]) => {
    broadcast({ type: "patch", projects });
  });
  registry.on("removed", (projectIds: ProjectId[]) => {
    broadcast({ type: "removed", projectIds });
  });

  /**
   * A workstation is only created for a directory that actually exists.
   * Claude Code always sends a real cwd, so this only ever rejects a malformed
   * sender — but without it one bad payload leaves a phantom desk in the office
   * for the rest of the session. Cached, so it costs one stat per project.
   */
  const realPaths = new Map<ProjectId, boolean>();
  const isRealProject = (event: AgentEvent): boolean => {
    const cached = realPaths.get(event.projectId);
    if (cached !== undefined) return cached;
    const path = event.projectPath ?? event.projectId;
    let exists = false;
    try {
      exists = existsSync(path);
    } catch {
      exists = false;
    }
    realPaths.set(event.projectId, exists);
    if (!exists) console.warn("[companion] ignoring events for missing path:", path);
    return exists;
  };

  const ingest = (event: AgentEvent): void => {
    if (!isRealProject(event)) return;

    if (event.source === "hook") {
      stats.hookEvents += 1;
      if (event.sessionId) lastHookAt.set(event.sessionId, event.timestamp);
    } else if (event.source === "debug") {
      stats.debugEvents += 1;
    } else {
      stats.transcriptEvents += 1;

      // When hooks are installed they are the lower-latency, better-defined
      // source, so the transcript is demoted to what only it can provide:
      // thinking, model, branch and token usage. Without hooks (or once they
      // fall silent) the transcript drives everything on its own.
      const hookAt = event.sessionId ? lastHookAt.get(event.sessionId) : undefined;
      const hooksAuthoritative = hookAt !== undefined && event.timestamp - hookAt < HOOK_AUTHORITY_MS;
      if (hooksAuthoritative && event.type !== "transcript:thinking") {
        // Metadata only. Crucially this must not reach the state machine: the
        // transcript records a tool call as soon as it is issued, so treating
        // it as a state event would knock a long-running command back to
        // "thinking" seconds before it actually finishes.
        registry.ingest({
          ...event,
          type: "transcript:meta",
          metaOnly: true,
          file: undefined,
          command: undefined,
          message: undefined,
        });
        return;
      }
    }

    registry.ingest(event);
  };

  watcher.on("event", ingest);
  watcher.on("warn", () => {
    // Transcript reading is best-effort; a locked or vanished file is normal.
  });

  for (const seed of watcher.seedProjects()) {
    registry.seed(seed.projectPath, seed.lastActivityAt);
  }

  registry.start();
  watcher.start();

  return {
    registry,
    watcher,
    ingest,
    snapshot: () => registry.snapshot(),
    startedAt: registry.startedAt,
    stats,
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      registry.stop();
      watcher.stop();
      listeners.clear();
    },
  };
}

export function getBridge(): Bridge {
  globalThis.__claudeCompanionBridge ??= createBridge();
  return globalThis.__claudeCompanionBridge;
}
