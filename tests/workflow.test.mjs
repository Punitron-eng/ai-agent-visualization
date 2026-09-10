import test from "node:test";
import assert from "node:assert/strict";
import { classifyCommand, STEP_BITS } from "../store/agentStore.ts";

/**
 * These regexes were silently corrupted once by shell escaping, which made the
 * workflow bar stop lighting up. They are cheap to pin down.
 */

test("git commands map to the Push step", () => {
  for (const command of [
    "git push origin feature/migration",
    "git status",
    "  git commit -m 'wip'",
    "gh pr create",
  ]) {
    assert.equal(classifyCommand(command), STEP_BITS.push, command);
  }
});

test("git wins over words that appear inside a commit message", () => {
  assert.equal(classifyCommand('git commit -m "add tests for build"'), STEP_BITS.push);
});

test("test runners map to the Test step", () => {
  for (const command of ["npm test", "npx vitest run", "pytest -q", "npm run test:unit"]) {
    assert.equal(classifyCommand(command), STEP_BITS.test, command);
  }
});

test("build and deploy commands map to the Deploy step", () => {
  for (const command of ["npm run build", "vercel deploy", "docker compose up"]) {
    assert.equal(classifyCommand(command), STEP_BITS.deploy, command);
  }
});

test("an unrecognised command still counts as work rather than vanishing", () => {
  assert.equal(classifyCommand("ls -la"), STEP_BITS.test);
  assert.equal(classifyCommand(""), STEP_BITS.test);
});
