import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";

// Lets `node --test` resolve the project's "@/*" path alias and TypeScript's
// extensionless imports, so the bridge modules can be unit-tested directly.
const root = path.resolve(import.meta.dirname, "..");
const CANDIDATES = ["", ".ts", ".tsx", ".mjs", ".js", "/index.ts", "/index.js"];

function resolveTarget(base) {
  for (const suffix of CANDIDATES) {
    const candidate = base + suffix;
    if (suffix === "" && !path.extname(candidate)) continue;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = resolveTarget(path.join(root, specifier.slice(2)));
      if (target) return { url: pathToFileURL(target).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
