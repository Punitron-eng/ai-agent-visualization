import type { AgentState } from "@/lib/agent/agentTypes";

const EXACT: Record<string, AgentState> = {
  Read: "reading",
  NotebookRead: "reading",

  Glob: "searching",
  Grep: "searching",
  WebSearch: "searching",
  WebFetch: "searching",
  ToolSearch: "searching",

  Edit: "coding",
  Write: "coding",
  NotebookEdit: "coding",
  MultiEdit: "coding",
  Artifact: "coding",

  Bash: "running",
  PowerShell: "running",
  BashOutput: "running",
  KillShell: "running",
  KillBash: "running",

  Agent: "thinking",
  Task: "thinking",
  TodoWrite: "thinking",
  Skill: "thinking",
  ExitPlanMode: "thinking",
  EnterPlanMode: "thinking",
  AskUserQuestion: "waiting",
};

/**
 * Unknown tools (including every `mcp__*`) fall back to generic work rather
 * than being dropped, so a new tool never leaves the robot frozen.
 */
export function toolStateFor(toolName: string | undefined): AgentState {
  if (!toolName) return "running";
  const exact = EXACT[toolName];
  if (exact) return exact;
  if (toolName.startsWith("mcp__")) return "running";
  return "running";
}

export function isKnownTool(toolName: string | undefined): boolean {
  return Boolean(toolName && toolName in EXACT);
}
