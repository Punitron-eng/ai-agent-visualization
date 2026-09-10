import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { EventEmitter } from "node:events";
import type { AgentEvent } from "@/lib/agent/agentTypes";
import { cwdFromTranscriptLine, parseTranscriptLine } from "@/lib/bridge/transcriptParse";
import { tailFile, type TailHandle } from "@/lib/bridge/transcriptTail";

/**
 * Supervises transcript tails across every project at once.
 *
 * Deliberately not "the newest file globally": several repos can be active
 * simultaneously, and each needs its own live stream. Work is bounded so a
 * companion left running for hours does not accumulate watchers.
 */

const RECENT_MS = 24 * 60 * 60_000;
const MAX_CONCURRENT_TAILS = 12;
const IDLE_TAIL_MS = 10 * 60_000;
const RESCAN_MS = 5_000;

export interface SeedRecord {
  projectPath: string;
  lastActivityAt: number;
}

export function projectsRoot(): string {
  return process.env.CLAUDE_PROJECTS_DIR ?? path.join(os.homedir(), ".claude", "projects");
}

interface TailRecord {
  handle: TailHandle;
  lastActivityAt: number;
}

export class TranscriptWatcher extends EventEmitter {
  private tails = new Map<string, TailRecord>();
  private rescanTimer: NodeJS.Timeout | null = null;
  private root: string;

  constructor(root = projectsRoot()) {
    super();
    this.root = root;
  }

  start(): void {
    if (this.rescanTimer) return;
    this.rescan();
    this.rescanTimer = setInterval(() => this.rescan(), RESCAN_MS);
    this.rescanTimer.unref?.();
  }

  stop(): void {
    if (this.rescanTimer) clearInterval(this.rescanTimer);
    this.rescanTimer = null;
    for (const record of this.tails.values()) record.handle.close();
    this.tails.clear();
  }

  /**
   * One workstation per repo, recovered from history so the grid is populated
   * before anything happens. Two slug directories that resolve to the same cwd
   * (the workspace has exactly this case) collapse into one entry.
   */
  seedProjects(maxAgeMs = 30 * 24 * 60 * 60_000): SeedRecord[] {
    const byProject = new Map<string, SeedRecord>();
    const cutoff = Date.now() - maxAgeMs;

    for (const dir of this.listProjectDirs()) {
      const files = this.listTranscripts(dir);
      if (files.length === 0) continue;

      const newest = files[0];
      if (newest.mtimeMs < cutoff) continue;

      const cwd = readCwd(newest.path);
      if (!cwd) continue;
      // History can name directories that no longer exist (a renamed repo, or a
      // mistyped path that was once used). Those are not workstations.
      if (!fs.existsSync(cwd)) continue;

      const key = cwd.toLowerCase();
      const existing = byProject.get(key);
      if (!existing || newest.mtimeMs > existing.lastActivityAt) {
        byProject.set(key, { projectPath: cwd, lastActivityAt: newest.mtimeMs });
      }
    }

    return [...byProject.values()].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  }

  private rescan(): void {
    const now = Date.now();

    for (const [filePath, record] of this.tails) {
      if (now - record.lastActivityAt > IDLE_TAIL_MS || !fs.existsSync(filePath)) {
        record.handle.close();
        this.tails.delete(filePath);
      }
    }

    const candidates: { path: string; mtimeMs: number }[] = [];
    for (const dir of this.listProjectDirs()) {
      for (const file of this.listTranscripts(dir)) {
        if (now - file.mtimeMs <= RECENT_MS) candidates.push(file);
      }
    }
    candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);

    for (const candidate of candidates.slice(0, MAX_CONCURRENT_TAILS)) {
      if (this.tails.has(candidate.path)) {
        const record = this.tails.get(candidate.path);
        if (record) record.lastActivityAt = Math.max(record.lastActivityAt, candidate.mtimeMs);
        continue;
      }
      this.openTail(candidate.path);
    }
  }

  private openTail(filePath: string): void {
    const record: TailRecord = {
      lastActivityAt: Date.now(),
      handle: tailFile(filePath, {
        onLine: (line) => {
          record.lastActivityAt = Date.now();
          const events = parseTranscriptLine(line);
          for (const event of events) this.emit("event", event satisfies AgentEvent);
        },
        onError: (error) => this.emit("warn", error),
      }),
    };
    this.tails.set(filePath, record);
  }

  private listProjectDirs(): string[] {
    try {
      return fs
        .readdirSync(this.root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(this.root, entry.name));
    } catch {
      return [];
    }
  }

  private listTranscripts(dir: string): { path: string; mtimeMs: number }[] {
    try {
      return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
        .map((entry) => {
          const full = path.join(dir, entry.name);
          try {
            return { path: full, mtimeMs: fs.statSync(full).mtimeMs };
          } catch {
            return { path: full, mtimeMs: 0 };
          }
        })
        .sort((a, b) => b.mtimeMs - a.mtimeMs);
    } catch {
      return [];
    }
  }

  get activeTailCount(): number {
    return this.tails.size;
  }
}

/** Reads just enough of a transcript to learn which repo it belongs to. */
function readCwd(filePath: string): string | null {
  let fd: number | null = null;
  try {
    fd = fs.openSync(filePath, "r");
    const chunk = Buffer.alloc(64 * 1024);
    const bytes = fs.readSync(fd, chunk, 0, chunk.length, 0);
    const text = chunk.subarray(0, bytes).toString("utf8");
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      const cwd = cwdFromTranscriptLine(line);
      if (cwd) return cwd;
    }
    return null;
  } catch {
    return null;
  } finally {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch {
        /* already closed */
      }
    }
  }
}
