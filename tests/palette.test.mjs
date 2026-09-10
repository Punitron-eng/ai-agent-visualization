import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { STATE_COLOR } from "../lib/agent/palette.ts";

/**
 * WebGL materials read `palette.ts`; DOM elements read `globals.css`. Nothing
 * enforces that at runtime, so it is enforced here — a state whose accent
 * drifts between the two would show one colour on the robot and another on
 * its label.
 */
const css = fs.readFileSync(path.join(import.meta.dirname, "..", "app", "globals.css"), "utf8");

test("every agent state has an accent in globals.css matching palette.ts", () => {
  for (const [state, hex] of Object.entries(STATE_COLOR)) {
    const rule = new RegExp(
      `\\[data-state="${state}"\\]\\s*\\{\\s*--accent:\\s*(#[0-9a-fA-F]{3,8})\\s*;`,
    );
    const found = css.match(rule);
    assert.ok(found, `globals.css has no --accent rule for state "${state}"`);
    assert.equal(
      found[1].toLowerCase(),
      hex.toLowerCase(),
      `accent for "${state}" differs: css ${found[1]} vs palette ${hex}`,
    );
  }
});
