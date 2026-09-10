import test from "node:test";
import assert from "node:assert/strict";
import { normalizeHookEvent, makeDebugEvent } from "../lib/bridge/normalizeEvent.ts";

const CWD = "D:\\ithink\\itl-dashboard-react";
const base = (over) => ({
  session_id: "s1",
  transcript_path: "t",
  cwd: CWD,
  permission_mode: "default",
  ...over,
});

const norm = (payload) => normalizeHookEvent(payload, 1000);

test("routes on cwd, not on any slug", () => {
  const { event } = norm(base({ hook_event_name: "SessionStart" }));
  assert.equal(event.projectId, "d:/ithink/itl-dashboard-react");
  assert.equal(event.projectPath, "D:/ithink/itl-dashboard-react");
});

test("a payload without cwd is dropped rather than guessed at", () => {
  const { event, reason } = norm({ hook_event_name: "PreToolUse", tool_name: "Read" });
  assert.equal(event, null);
  assert.match(reason, /cwd/);
});

test("non-object payloads are rejected safely", () => {
  for (const bad of [null, undefined, 42, "string", [1, 2]]) {
    assert.equal(norm(bad).event, null);
  }
});

test("tool names map to states", () => {
  const cases = [
    ["Read", "reading"],
    ["Grep", "searching"],
    ["Glob", "searching"],
    ["Edit", "coding"],
    ["Write", "coding"],
    ["Bash", "running"],
    ["Agent", "thinking"],
  ];
  for (const [tool, expected] of cases) {
    const { event } = norm(base({ hook_event_name: "PreToolUse", tool_name: tool, tool_input: {} }));
    assert.equal(event.state, expected, `${tool} should be ${expected}`);
  }
});

test("an unknown tool still produces activity instead of freezing", () => {
  const { event } = norm(
    base({ hook_event_name: "PreToolUse", tool_name: "mcp__future__doThing", tool_input: {} }),
  );
  assert.equal(event.state, "running");
});

test("an unknown event type degrades without throwing", () => {
  const { event } = norm(base({ hook_event_name: "SomeFutureEvent" }));
  assert.ok(event);
  assert.equal(event.type, "SomeFutureEvent");
});

test("file paths are shown relative to the project", () => {
  const { event } = norm(
    base({
      hook_event_name: "PreToolUse",
      tool_name: "Edit",
      tool_input: { file_path: CWD + "\\components\\Hero.tsx" },
    }),
  );
  assert.equal(event.file, "components/Hero.tsx");
});

test("commands are captured for Bash", () => {
  const { event } = norm(
    base({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "npm run build" } }),
  );
  assert.equal(event.command, "npm run build");
  assert.equal(event.state, "running");
});

test("UserPromptSubmit accepts both documented and legacy field names", () => {
  assert.equal(norm(base({ hook_event_name: "UserPromptSubmit", user_input: "a" })).event.message, "a");
  assert.equal(norm(base({ hook_event_name: "UserPromptSubmit", prompt: "b" })).event.message, "b");
});

test("Notification maps only input-blocking types to waiting", () => {
  const waiting = norm(
    base({ hook_event_name: "Notification", notification_type: "permission_prompt" }),
  ).event;
  assert.equal(waiting.state, "waiting");

  const other = norm(
    base({ hook_event_name: "Notification", notification_type: "auth_success" }),
  ).event;
  assert.equal(other.state, "thinking");
});

test("failure events become error and carry the reason", () => {
  const { event } = norm(
    base({ hook_event_name: "PostToolUseFailure", tool_name: "Bash", error: "exit code 1" }),
  );
  assert.equal(event.state, "error");
  assert.equal(event.isError, true);
  assert.match(event.message, /exit code 1/);
});

test("Stop celebrates, SessionEnd tears down", () => {
  assert.equal(norm(base({ hook_event_name: "Stop" })).event.state, "success");
  assert.equal(norm(base({ hook_event_name: "SessionEnd" })).event.lifecycle, "session-end");
});

test("subagent lifecycle is tracked", () => {
  const { event } = norm(
    base({ hook_event_name: "SubagentStart", agent_id: "a1", agent_type: "Explore" }),
  );
  assert.equal(event.lifecycle, "subagent-start");
  assert.equal(event.agentId, "a1");
});

test("debug events share the identity rules of real ones", () => {
  const event = makeDebugEvent(CWD, "coding", 500);
  assert.equal(event.source, "debug");
  assert.equal(event.state, "coding");
  assert.equal(event.projectId, "d:/ithink/itl-dashboard-react");
});
