import test from "node:test";
import assert from "node:assert/strict";
import {
  toProjectId,
  normalizePath,
  projectNameFromPath,
  slugForPath,
} from "../lib/bridge/projectId.ts";

test("windows and posix separators produce the same identity", () => {
  assert.equal(
    toProjectId("D:\\ithink\\itl-dashboard-react"),
    toProjectId("D:/ithink/itl-dashboard-react"),
  );
});

test("identity is case-insensitive, which Windows paths require", () => {
  assert.equal(toProjectId("D:/IThink/ITL-Dashboard-React"), toProjectId("d:/ithink/itl-dashboard-react"));
});

test("a trailing separator does not create a second workstation", () => {
  assert.equal(toProjectId("D:/ithink/next-table/"), toProjectId("D:/ithink/next-table"));
});

test("display path keeps its original casing", () => {
  assert.equal(normalizePath("D:\\ithink\\ITL-Website"), "D:/ithink/ITL-Website");
});

test("project name is the folder basename", () => {
  assert.equal(projectNameFromPath("D:\\ithink\\itl-dashboard-vue"), "itl-dashboard-vue");
});

test("distinct repos stay distinct", () => {
  assert.notEqual(
    toProjectId("D:/ithink/itl-dashboard-react"),
    toProjectId("D:/ithink/itl-dashboard-vue"),
  );
});

test("the transcript slug is lossy, which is why it is never the identity", () => {
  // Both of these collapse to the same slug, so a slug cannot be inverted back
  // to a path. Identity therefore comes from `cwd`, never from the directory.
  assert.equal(slugForPath("D:/ithink/itl-dashboard-react"), "D--ithink-itl-dashboard-react");
  assert.equal(slugForPath("D:/ithink-itl/dashboard-react"), "D--ithink-itl-dashboard-react");
  assert.notEqual(
    toProjectId("D:/ithink/itl-dashboard-react"),
    toProjectId("D:/ithink-itl/dashboard-react"),
  );
});
