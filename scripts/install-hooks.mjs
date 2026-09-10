#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Registers the companion's observe-only hooks in ~/.claude/settings.json.
 *
 * Ownership is tracked by the hook URL rather than by adding a marker field, so
 * nothing unrecognised is ever written into Claude Code's settings. That makes
 * both the merge and the uninstall exact and idempotent.
 */

const HOOK_URL = process.env.COMPANION_HOOK_URL ?? "http://127.0.0.1:4577/api/hook";
const settingsPath =
  process.env.CLAUDE_SETTINGS_PATH ?? path.join(os.homedir(), ".claude", "settings.json");
const configPath = path.join(import.meta.dirname, "hooks.config.json");

const statusOnly = process.argv.includes("--status");

function readSettings() {
  if (!fs.existsSync(settingsPath)) return { settings: {}, existed: false };
  const raw = fs.readFileSync(settingsPath, "utf8");
  try {
    return { settings: raw.trim() ? JSON.parse(raw) : {}, existed: true, raw };
  } catch (error) {
    console.error(`✗ ${settingsPath} is not valid JSON — refusing to touch it.`);
    console.error(`  ${error.message}`);
    process.exit(1);
  }
}

const isOurs = (hook) => hook && hook.type === "http" && hook.url === HOOK_URL;

function countInstalled(settings) {
  let count = 0;
  for (const groups of Object.values(settings.hooks ?? {})) {
    if (!Array.isArray(groups)) continue;
    for (const group of groups) {
      for (const hook of group?.hooks ?? []) if (isOurs(hook)) count += 1;
    }
  }
  return count;
}

const { settings, existed } = readSettings();

if (statusOnly) {
  const installed = countInstalled(settings);
  console.log(`settings: ${settingsPath}`);
  console.log(`endpoint: ${HOOK_URL}`);
  console.log(
    installed > 0
      ? `status:   installed (${installed} hook${installed === 1 ? "" : "s"})`
      : "status:   not installed",
  );
  process.exit(0);
}

const desired = JSON.parse(fs.readFileSync(configPath, "utf8")).hooks;

// The config file carries the default endpoint. Point every entry at the URL
// actually in effect, so COMPANION_HOOK_URL genuinely relocates the hooks
// rather than only changing what this script reports.
for (const groups of Object.values(desired)) {
  for (const group of groups) {
    for (const hook of group.hooks ?? []) {
      if (hook.type === "http") hook.url = HOOK_URL;
    }
  }
}

// Back up before the first modification, never on a no-op reinstall.
if (countInstalled(settings) === 0 && existed) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${settingsPath}.bak-${stamp}`;
  fs.copyFileSync(settingsPath, backupPath);
  console.log(`• backed up  ${backupPath}`);
}

settings.hooks ??= {};
let added = 0;

for (const [eventName, desiredGroups] of Object.entries(desired)) {
  const existingGroups = Array.isArray(settings.hooks[eventName])
    ? settings.hooks[eventName]
    : (settings.hooks[eventName] = []);

  for (const desiredGroup of desiredGroups) {
    const alreadyThere = existingGroups.some((group) =>
      (group?.hooks ?? []).some((hook) => isOurs(hook)),
    );
    if (alreadyThere) continue;
    existingGroups.push(structuredClone(desiredGroup));
    added += 1;
  }
}

fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");

console.log(`• settings   ${settingsPath}`);
console.log(`• endpoint   ${HOOK_URL}`);
console.log(
  added === 0
    ? "✓ already installed — nothing changed"
    : `✓ added ${added} observe-only hook${added === 1 ? "" : "s"}`,
);
console.log("");
console.log("  These hooks are async and the endpoint always answers 204 with an empty");
console.log("  body, so they cannot block, delay, or influence a Claude Code session.");
console.log("  With the companion stopped they are a background no-op.");
console.log("");
console.log("  Claude Code picks these up on its own; restart it only if it does not.");
console.log("  Undo at any time with: npm run hooks:uninstall");
