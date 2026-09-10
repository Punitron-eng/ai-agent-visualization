# Installing Claude Code Companion

A live 3D office where every Claude Code project you work in gets a desk, and the robot at that
desk moves with your real session.

This guide is for setting it up on a fresh machine. It takes about five minutes.

---

## Before you start

| You need | Why | Check with |
| --- | --- | --- |
| **Node.js 20.9 or newer** | Next.js 16 requires it | `node -v` |
| **npm** | ships with Node | `npm -v` |
| **Claude Code** | this visualises *your* sessions, so it needs something to watch | `claude --version` |
| A browser with **WebGL** | the office is a real 3D scene | any current Chrome, Edge, Firefox or Safari |

Claude Code should be **v2.1 or newer** — the companion uses `type: "http"` hooks, which older
versions do not support. Built and tested against 2.1.263 and 2.1.267.

If you don't have Node: [nodejs.org](https://nodejs.org) → LTS.

**Works on Windows, macOS and Linux.** Nothing in the app hardcodes a path; it finds your Claude
Code data from your home directory.

---

## 1. Get the files

You'll receive a zip (or a git repo). Unzip it anywhere you like — your home folder, a projects
folder, wherever. The path doesn't matter.

The zip won't contain `node_modules` or `.next`; those are built in the next step.

```bash
cd path/to/claude-companion
```

> **Sending it to someone:** zip the folder but exclude `node_modules`, `.next` and
> `tsconfig.tsbuildinfo` — that's ~1 MB instead of ~700 MB. From the project folder:
> ```bash
> tar --exclude=node_modules --exclude=.next --exclude=tsconfig.tsbuildinfo \
>     -czf ../claude-companion.tar.gz .
> ```

---

## 2. Install dependencies

```bash
npm ci
```

Takes about a minute. Use `npm install` instead if `npm ci` complains about a missing lockfile.

---

## 3. Start it

For everyday use, build once and run the production server — it starts faster and uses less memory
than dev mode, which matters for something you leave open all day:

```bash
npm run build
npm start
```

Then open **http://localhost:4577**.

If you're going to modify the code, use `npm run dev` instead (same URL, hot reload).

At this point the office will show desks for projects you've used Claude Code in before, all idle.
Nothing will move yet — that's the next step.

---

## 4. Connect it to Claude Code

```bash
npm run hooks:install
```

This adds ten hooks to `~/.claude/settings.json` pointing at `http://127.0.0.1:4577/api/hook`, and
writes a timestamped backup of that file first.

Claude Code usually picks them up on its own within a few seconds. If nothing moves after a minute,
restart Claude Code.

Now open Claude Code in any project and give it something to do. A desk should light up.

### What the hooks actually do

They are observe-only and safe by construction:

- **`async: true`** — Claude Code fires them in the background and never waits for a reply.
- **The endpoint always answers `204` with an empty body**, never a decision. It is not *capable*
  of allowing, denying, delaying or altering anything Claude Code does.
- **If the companion isn't running, they're a background no-op.** Claude Code runs at full speed.
- Nothing is sent anywhere. `127.0.0.1` is your own machine; there is no network call off-box.

Check status any time:

```bash
npm run hooks:status
```

---

## 5. Try it without Claude Code

Click **debug** at the bottom right. Pick a project, then press any state button — Coding,
Running, Error, and so on.

Those buttons POST to the *same* `/api/hook` endpoint Claude Code uses, so they exercise the whole
pipeline rather than faking the UI. Useful for checking everything works before you trust it.

---

## Using it

- **Drag** to orbit, **right-drag** to pan, **scroll** to zoom.
- **Hover** a desk to see the current file, branch and model.
- **Click** a desk to fly the camera to it and open that project's real terminal output. **Esc** to
  go back.
- Switch the office **vibe** in the header — Warm studio, White & orange, Cool graphite. Your
  choice is remembered.

---

## Removing it

```bash
npm run hooks:uninstall
```

Removes exactly the hooks this app added, matched by URL, and leaves any other hooks in your
settings untouched. It backs the file up first.

After that, delete the folder. Nothing else was installed anywhere on your system.

---

## Troubleshooting

**The badge says "reconnecting"**
The page can't reach the local server. Make sure `npm start` (or `npm run dev`) is still running in
its terminal, and that you opened `http://localhost:4577`, not a different port.

**The office is empty**
You haven't used Claude Code on this machine yet, or not in the last 30 days. Open Claude Code in
any project and send a prompt — a desk appears within a second or two.

**Desks appear but nothing ever moves**
The hooks aren't reaching the companion. Run `npm run hooks:status`; if it says *not installed*,
run `npm run hooks:install`. If it says *installed* and it still doesn't move, restart Claude Code.

Only the "waiting for permission" state needs hooks specifically — if other states work but that
one never appears, the hooks aren't loaded.

**"Port 4577 is already in use"**
Something else has the port. Either stop it, or change the port in two places:

1. In `package.json`, change `-p 4577` in both the `dev` and `start` scripts.
2. Re-point the hooks at the new port:
   ```bash
   COMPANION_HOOK_URL=http://127.0.0.1:NEWPORT/api/hook npm run hooks:install
   ```
   On Windows PowerShell:
   ```powershell
   $env:COMPANION_HOOK_URL="http://127.0.0.1:NEWPORT/api/hook"; npm run hooks:install
   ```
   Run `hooks:uninstall` with the *old* URL first, or you'll be left with stale hooks.

**The 3D scene is blank or very slow**
Your browser may have hardware acceleration disabled. In Chrome, check `chrome://gpu` — if it says
software rendering, enable hardware acceleration in Settings → System. The scene will run on
software rendering, just slowly.

**Everything is stuck at "Opening the office…"**
The 3D bundle failed to load. Check the browser console; in dev mode, try deleting `.next` and
restarting.

---

## What it reads and writes

It only touches these, all on your own machine:

| Path | Access |
| --- | --- |
| `~/.claude/settings.json` | **written** by `hooks:install` / `hooks:uninstall`, with a backup each time |
| `~/.claude/projects/**/*.jsonl` | **read only** — your session transcripts, for the thinking state, model, branch and token counts |
| `http://127.0.0.1:4577` | the local server; nothing leaves your machine |

It never reads or modifies the source code of the projects it displays.
