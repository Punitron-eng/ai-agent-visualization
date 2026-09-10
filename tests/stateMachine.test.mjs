import test from "node:test";
import assert from "node:assert/strict";
import { initialMachineState, reduce, tick, TIMING } from "../lib/bridge/stateMachine.ts";

const ev = (state, timestamp, extra = {}) => ({
  type: "test",
  state,
  timestamp,
  projectId: "p",
  source: "hook",
  ...extra,
});

test("wakes from idle immediately", () => {
  const s0 = initialMachineState(1000);
  const s1 = reduce(s0, ev("coding", 1010));
  assert.equal(s1.state, "coding");
});

test("min-dwell defers a competing state, then tick applies it", () => {
  let s = initialMachineState(1000);
  s = reduce(s, ev("reading", 1000));
  s = reduce(s, ev("searching", 1100)); // inside the dwell window
  assert.equal(s.state, "reading", "holds during dwell");
  assert.equal(s.fallback, "searching");

  s = tick(s, 1000 + TIMING.minDwellMs + 1);
  assert.equal(s.state, "searching", "applies the deferred state after dwell");
});

test("min-dwell does not block a state repeating itself", () => {
  let s = initialMachineState(0);
  s = reduce(s, ev("coding", 0));
  s = reduce(s, ev("coding", 50));
  assert.equal(s.state, "coding");
  assert.equal(s.fallback, undefined);
});

test("success is transient and decays to idle", () => {
  let s = initialMachineState(0);
  s = reduce(s, ev("success", 0));
  assert.equal(s.state, "success");
  s = tick(s, TIMING.successMs - 1);
  assert.equal(s.state, "success", "still celebrating");
  s = tick(s, TIMING.successMs + 1);
  assert.equal(s.state, "idle");
});

test("error is transient and outranks a normal state arriving during it", () => {
  let s = initialMachineState(0);
  s = reduce(s, ev("error", 0));
  s = reduce(s, ev("reading", 100));
  assert.equal(s.state, "error", "error stays visible");
  s = tick(s, TIMING.errorMs + 1);
  assert.equal(s.state, "reading", "then falls back to what arrived meanwhile");
});

test("a transient can replace another transient", () => {
  let s = initialMachineState(0);
  s = reduce(s, ev("success", 0));
  s = reduce(s, ev("error", 100));
  assert.equal(s.state, "error");
});

test("decays to idle after silence", () => {
  let s = initialMachineState(0);
  s = reduce(s, ev("coding", 0));
  s = tick(s, TIMING.idleAfterMs - 1);
  assert.equal(s.state, "coding");
  s = tick(s, TIMING.idleAfterMs + 1);
  assert.equal(s.state, "idle");
});

test("tick returns the same object when nothing changed", () => {
  let s = initialMachineState(0);
  s = reduce(s, ev("coding", 0));
  assert.equal(tick(s, 10), s, "identity is preserved so callers can skip work");
});

test("idle state does not decay repeatedly", () => {
  const s = initialMachineState(0);
  assert.equal(tick(s, TIMING.idleAfterMs + 5000), s);
});
