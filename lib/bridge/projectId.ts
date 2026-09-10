import path from "node:path";
import type { ProjectId } from "@/lib/agent/agentTypes";

/**
 * Project identity comes from `cwd`, never from the `~/.claude/projects/<slug>`
 * directory name. The slug collapses both path separators and hyphens
 * ("D:\ithink\itl-dashboard-react" -> "D--ithink-itl-dashboard-react"), so two
 * different slugs can refer to the same repo and the mapping cannot be inverted.
 */
export function toProjectId(cwd: string): ProjectId {
  return normalizePath(cwd).toLowerCase();
}

/** Absolute, forward-slashed, no trailing separator. Casing preserved. */
export function normalizePath(cwd: string): string {
  const resolved = path.resolve(cwd.trim());
  const slashed = resolved.split(path.sep).join("/").replace(/\\/g, "/");
  return slashed.length > 1 ? slashed.replace(/\/+$/, "") : slashed;
}

export function projectNameFromPath(cwd: string): string {
  const normalized = normalizePath(cwd);
  const base = normalized.split("/").filter(Boolean).pop();
  return base ?? normalized;
}

/**
 * Directory name Claude Code uses under ~/.claude/projects for a given cwd.
 * Only useful for locating files; it is deliberately never used as an identity.
 */
export function slugForPath(cwd: string): string {
  return normalizePath(cwd).replace(/[/\\:]/g, "-");
}
