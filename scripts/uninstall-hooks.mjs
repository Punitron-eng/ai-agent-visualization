#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Removes exactly the hooks the companion added, identified by their URL, and
 * leaves every other hook and setting untouched.
 */

const HOOK_URL = process.env.COMPANION_HOOK_URL ?? "http://127.0.0.1:4577/api/hook";
const settingsPath =
  process.env.CLAUDE_SETTINGS_PATH ?? path.join(os.homedir(), ".claude", "settings.json");

if (!fs.existsSync(settingsPath)) {
  console.log(`✓ nothing to do — ${settingsPath} does not exist`);
  process.exit(0);
}

let settings;
try {
  const raw = fs.readFileSync(settingsPath, "utf8");
  settings = raw.trim() ? JSON.parse(raw) : {};
} catch (error) {
  console.error(`✗ ${settingsPath} is not valid JSON — refusing to touch it.`);
  console.error(`  ${error.message}`);
  process.exit(1);
}

const isOurs = (hook) => hook && hook.type === "http" && hook.url === HOOK_URL;
let removed = 0;

for (const [eventName, groups] of Object.entries(settings.hooks ?? {})) {
  if (!Array.isArray(groups)) continue;

  const kept = [];
  for (const group of groups) {
    const hooks = Array.isArray(group?.hooks) ? group.hooks : [];
    const remaining = hooks.filter((hook) => {
      if (!isOurs(hook)) return true;
      removed += 1;
      return false;
    });
    // Drop a group only once it is empty, so groups we share stay intact.
    if (remaining.length > 0) kept.push({ ...group, hooks: remaining });
    else if (hooks.length === 0) kept.push(group);
  }

  if (kept.length > 0) settings.hooks[eventName] = kept;
  else delete settings.hooks[eventName];
}

if (settings.hooks && Object.keys(settings.hooks).length === 0) delete settings.hooks;

if (removed === 0) {
  console.log("✓ no companion hooks found — nothing changed");
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
fs.copyFileSync(settingsPath, `${settingsPath}.bak-${stamp}`);
fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");

console.log(`• backed up ${settingsPath}.bak-${stamp}`);
console.log(`✓ removed ${removed} companion hook${removed === 1 ? "" : "s"}`);
console.log("  Restart Claude Code for the change to take effect.");
