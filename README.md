# Claude Code Companion

A live 3D office you can walk the camera through, where **every Claude Code project you work in gets a desk**, and the little
robot at that desk moves with the real session — typing while Claude edits, watching the terminal
while a command runs, waiting when Claude needs your permission.

Nothing in it is simulated. Every state, file path, command, branch and token count comes from a
real Claude Code event on this machine.

```
npm ci
npm run hooks:install     # registers observe-only hooks in ~/.claude/settings.json
npm run dev               # http://localhost:4577
```

**Setting this up on another machine? See [INSTALL.md](./INSTALL.md)** — requirements,
step-by-step setup, troubleshooting and how to remove it.

Claude Code picks the hooks up on its own — verified on v2.1.263/v2.1.267, where a session already
running began firing them without a restart. If yours does not, restart it.

---

## How Claude Code activity gets here

Two independent sources feed one normalized event stream. The visual layer never sees a Claude Code
concept — it only ever receives an `AgentEvent`.

```
Claude Code (repo A) ──http hook──┐
Claude Code (repo B) ──http hook──┤
transcript watcher (all repos) ───┼─► normalizeEvent ─► resolveProjectId(cwd) ─► ProjectRegistry
debug panel ──────────────────────┘      (AgentEvent)                            │
                                                          one state machine ─────┤
                                                          per project            ▼
                                            SSE (snapshot + patches) ─► zustand ─► office
```

### 1. Hooks (primary)

`npm run hooks:install` adds ten `type: "http"` hooks to `~/.claude/settings.json`, all pointing at
`http://127.0.0.1:4577/api/hook`:

`SessionStart` · `UserPromptSubmit` · `PreToolUse` · `PostToolUse` · `PostToolUseFailure` ·
`Notification` · `SubagentStart` · `SubagentStop` · `Stop` · `SessionEnd`

They are safe by construction:

- **`async: true`** — Claude Code fires them in the background and never waits.
- **The endpoint always answers `204` with an empty body**, never a decision object, so it is not
  capable of allowing, denying or altering anything.
- **With the companion stopped they are a background no-op.** Claude Code runs at full speed.
- `127.0.0.1`, not `localhost`, to avoid the Windows IPv6-first resolution stall.

`npm run hooks:status` reports whether they are installed; `npm run hooks:uninstall` removes exactly
the hooks this app added (matched by URL) and leaves any other hooks untouched. Both write a
timestamped backup first.

### 2. Transcript watcher (secondary)

`~/.claude/projects/<slug>/<session>.jsonl` is tailed for every recently-active project at once. It
is not a substitute for hooks; it supplies three things hooks do not expose at all:

| | |
| --- | --- |
| **thinking** | There is no thinking hook in Claude Code (verified absent in v2.1.263). The transcript does contain `{"type":"thinking"}` blocks, written as the turn happens. The text is redacted to `""` — the *presence* is the signal. |
| **model + git branch** | Present on every transcript line, on no hook payload. |
| **token usage** | From the assistant message's `usage` block. |

While hooks are live for a session, the transcript is demoted to metadata only, so the two sources
never double-drive the same state. If hooks are not installed, the transcript drives everything on
its own — the office still works, minus the "waiting for permission" state.

The transcript format is internal to Claude Code, so every field is read defensively and a parse
failure is skipped rather than thrown.

### Project identity

Routing is on **`cwd`**, canonicalized and lowercased — never on the `~/.claude/projects/<slug>`
directory name. The slug collapses both path separators and hyphens
(`D:\ithink\itl-dashboard-react` → `D--ithink-itl-dashboard-react`) and cannot be inverted, so two
different slugs can name the same repo.

A session is pinned to the project it started in, so a mid-session `cd` or a worktree move never
spawns a phantom desk. Events naming a directory that does not exist are dropped.

---

## The office

The office is a **navigable 3D room** (three.js / react-three-fiber): drag to orbit, right-drag to
pan, scroll to zoom. Clicking a desk flies the camera to it and slides in that project's detail
panel. Controls are clamped so the camera stays above the floor and inside a sane distance band —
the room cannot be lost or turned upside down.

**Three vibes**, switchable in the header and remembered per browser: *Warm studio* (dusk and
amber), *White & orange* (bright studio, coral accents) and *Cool graphite*. Switching re-skins the
scene's shared materials in place and re-points the shell's CSS variables — no rebuild, no reload.
Agent state colours are deliberately **not** themed: they are semantic, and a state that meant one
thing in one vibe and another in the next would be worse than no theme at all.

**The development floor is benching, not islands.** Each cluster is one continuous shared top with
three workstations down each side, back to back across a planted divider, a cable tray slung under
the centre line and six ergonomic task chairs. The runs lie across the room and repeat front to
back, so a project is given a *seat* on a bench rather than a table of its own — twelve projects
fill two clusters instead of scattering twelve desks over the floor.

**The social wing runs across the back**: two glass meeting rooms and a recreation room, all in the
same architectural language — full-height glazing, slim dark frames, a glass door, a ceiling
fixture. Meeting 01 and Meeting 02 are one `<MeetingRoom />` rendered twice from a configuration
array (which table it is furnished with, seat count, whiteboard text, which way the door swings);
their boards read *IDEAS → PRODUCTS → IMPACT* and *PLAN → BUILD → SHIP*.

**Meeting 02 is the collaboration room**, and it is about human + AI: a `<CollaborationTable />`,
four `<OfficeChair />` — two to a side, none on the ends — and one `<MacBookCodingStation />`, a
laptop a size up from the ones on the benches, turned toward the camera with Claude Code running on
it. The display is a live canvas: code lands line by line, the terminal scrolls through *Building…*,
*Running tests…*, *Changes detected…*, the caret blinks and the agent's progress bar fills. Seven
redraws a second, not sixty — enough to read as a working machine, cheap enough to be free.

**The chill room has a carrom board**, and four free agents playing it. They are not projects and
never claim to be — they are the crowd that makes the room feel occupied. Two take shots, two watch;
everyone breathes, shifts their weight and leans in as the play moves, so nobody reads as frozen.
The four are generated from an `agents` array, and the bodies are the same robot rig the project
agents use rather than a second character. Hovering names the rooms (*PLANNING*, *COLLABORATION*,
*FREE AGENTS*, *BREAK TIME*); clicking the chill room eases the camera down to the height of the
game.

The floor is laid out along the engineering cycle — **plan → build → test → review → deploy** —
rather than as decorative rooms. Every zone earns its place:

| Zone | Comes alive when |
| --- | --- |
| **Development** (middle) | one seat per detected project |
| **Test & Debug** (front) | a real test command is running |
| **Git & Review** (front) | a real `git` / `gh` command is running |
| **Deploy** (front) | a real build or deploy command is running |
| **Meeting 01** (back) | any project is `thinking` |
| **Meeting 02** (back) | collaboration — the second glass room |
| **Chill** (back) | a project is `waiting` on you — and the carrom game |

Seats are assigned first-come and never reshuffle, so a project stays where you last saw it. Bench
runs are added as the project count grows, and the plate widens with them.

**Monitors show miniature developer interfaces**, drawn to canvas textures and chosen by state: a code editor
with a tab strip and caret while coding, a terminal with a progress bar while running, a query pane
while searching, a red header on error. Nothing is baked into an image.

The **workflow bar** in the header reads the same live signals — `git push` lights Push, `npm test`
lights Test, `npm run build` lights Deploy — so the office tells the story of the current pass
without inventing progress.

**Hover** a workstation to light it and reveal its current file, branch and model; everything else
dims. **Click** to fly the camera to that desk and open its real terminal output alongside.

Information is tiered deliberately: a desk tag shows the project name and a state dot, and nothing
more until you hover it. With a dozen desks on screen, anything more permanent turns the office
into a wall of text.

### States

`idle · thinking · reading · searching · coding · running · waiting · success · error`

| Event | State |
| --- | --- |
| `UserPromptSubmit` | thinking |
| `PreToolUse` Read / NotebookRead | reading |
| `PreToolUse` Glob / Grep / WebSearch / WebFetch | searching |
| `PreToolUse` Edit / Write / NotebookEdit | coding |
| `PreToolUse` Bash / PowerShell | running |
| `PreToolUse` Agent / Task / Skill / TodoWrite | thinking |
| any other tool, including `mcp__*` | running |
| `Notification` permission_prompt / idle_prompt / agent_needs_input | waiting |
| `PostToolUseFailure`, `StopFailure` | error (3 s, then decays) |
| `Stop` | success (2.5 s, then idle) |
| 20 s of silence | idle |

**Thinking is a derived state** — the gap between tool calls, corroborated by transcript thinking
blocks. It is not a hook, and the code does not pretend otherwise.

A **350 ms minimum dwell** stops a burst of parallel tool calls from strobing the robot; waking from
idle is exempt so the first move is instant. When one project has several sessions it stays one
desk, and the aggregate state is the most attention-worthy of them
(`error > waiting > success > coding > running > searching > reading > thinking > idle`).

---

## Testing every animation without Claude Code

The **debug** button (bottom right) opens a project selector and one button per state. Each button
`POST`s to the real `/api/hook` endpoint, so pressing one exercises the entire pipeline — transport,
normalizer, registry, state machine, SSE, render — rather than poking the store directly.

Drive two different projects into two different states at once to see that they are genuinely
independent.

```bash
# Or from a shell — note forward slashes, Windows backslashes need escaping in JSON
curl -X POST http://127.0.0.1:4577/api/hook -H "Content-Type: application/json" \
  -d '{"session_id":"t1","cwd":"D:/ithink/itl-dashboard-react","hook_event_name":"PreToolUse","tool_name":"Edit","tool_input":{"file_path":"D:/ithink/itl-dashboard-react/app/page.tsx"}}'
```

`npm test` covers the pure modules: the state machine's dwell, transient decay and idle drift; the
identity rules including the lossy-slug case; and the normalizer's handling of every event type plus
malformed input.

---

## Layout

```
lib/agent/agentTypes.ts        the contract: AgentState, AgentEvent, ProjectRuntime
lib/bridge/                    plain Node, no Next imports — liftable to a standalone process
  bus.ts                       singleton on globalThis (survives dev HMR); source arbitration
  projectId.ts                 cwd -> canonical identity
  projectRegistry.ts           per-project state, sessions, timers, terminal buffer
  stateMachine.ts              pure (state, event) => state
  toolStateMap.ts              tool name -> state
  normalizeEvent.ts            the only module that knows Claude Code's payload shape
  transcriptWatcher.ts         supervises many tails at once
  transcriptTail.ts            one file: fs.watch + stat-poll fallback (Windows needs both)
  transcriptParse.ts           jsonl line -> AgentEvent
app/api/{hook,events,projects} POST receiver · SSE stream · snapshot + health
store/agentStore.ts            zustand, keyed by project
components/office3d/           three.js scene: resources · workstation · robot · labels
  studio/                      the shell and its furniture: floor · walls · benches · lights
  studio/social/               the back wing: glass rooms · meeting rooms · chill · carrom · agents
components/office/             shared floor plan (layout.ts) used by both renderers
materials/officeMaterials.ts   the one shared geometry + material pool for the shell and furniture
config/officeLayout.ts         shell dimensions, plant spots, ceiling light runs
lib/agent/stations.ts          where an agent stands, and the route it walks to get there
components/character/          the robot rig; motion/stateVariants.ts holds ALL per-state animation
components/shell/              sidebar · header · activity strip · workspace
scripts/                       hook install / uninstall / status
```

Animation config lives only in `components/character/motion/stateVariants.ts`. Adding a state means
one entry there plus one line in `toolStateMap` and the state machine — no event code changes.

---

## Performance

Built to sit alongside VS Code and Claude Code for hours.

**The 3D scene**, roughly in order of impact:

- **Three render regimes, not two.** *Working* (an agent busy, or hover, or focus) runs at full
  rate. *Quiet* (everyone idle, tab visible) throttles to 20fps — the roamers still walk, since
  they integrate delta, at roughly a third of the GPU time. *Hidden tab* parks the loop completely
  and draws nothing. Verified by instrumenting the mode: it reports `always`, `quiet` and
  `parked` correctly.

  Continuous roaming and a fully-parked idle loop cannot both be true; throttling is the
  compromise that keeps the room alive without burning a GPU on an empty office.
- **Shared geometry and materials** (`components/office3d/resources.ts`). Every desk, robot and
  plant draws from one module-level pool, so the scene is a fixed handful of GPU resources whether
  four projects are open or twenty. The few materials that animate per instance take an explicit
  private clone — mutating a shared one would drive every object tinted by that state.
- **No shadow maps anywhere.** Contact shadows are unlit discs; screen and lamp glow are additive
  sprites, not lights and not a bloom pass.
- **Six lights total**, three of them cheap directional/hemisphere.
- **Monitor screens are canvas textures cached per state** — drawn once each, never per frame, and
  shared by every monitor showing that state.
- **Device pixel ratio clamped to 1.6**, so a 4K panel does not quadruple the fill cost.
- **three.js is loaded client-side only** (`next/dynamic`, `ssr: false`), keeping it out of the
  initial payload.
- The canvas **stays mounted across focus changes** — tearing down and rebuilding a WebGL context
  is the most expensive thing this app could do.

**Everything else:**

- All animation pauses when the tab is hidden (`visibilitychange`).
- Each workstation subscribes only to its own store slice, so an event in repo A does not re-render
  repo B; server-side patches are coalesced on a 60 ms tick.
- Transcript tails are capped (12 concurrent, files touched in the last 24 h) and closed after
  10 minutes idle.
- Terminal history capped per project; stale sessions and long-dead projects are evicted with their
  timers.
- `prefers-reduced-motion` is respected.

---

## Not built yet

- Desktop shell (Tauri/Electron), always-on-top, compact mode — deliberately deferred until the core
  worked.
- Mobile is usable but not designed for; the office has a minimum width and scrolls below it.
- The sidebar's Projects and Activity tabs are navigation placeholders — the Workspace tab is the
  product.
