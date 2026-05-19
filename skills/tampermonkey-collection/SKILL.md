---
name: tampermonkey-collection
description: Use when working in D:\Codex\Tampermonkey on multiple Tampermonkey userscripts, including creating or reorganizing scripts under per-script folders, bumping @version, adding or syncing @updateURL and @downloadURL, checking local/cloud update readiness, using GitHub raw URLs, testing with the dedicated Chrome Dev CDP profile, or updating project TODO/handoff notes.
---

# Tampermonkey Collection

Use this workspace as a multi-script collection, not a single userscript project.

## Fast Path

1. Keep each script in `scripts/<script-id>/<script-id>.user.js`.
2. Run `npm run tm:list` to confirm discovery.
3. Run `npm run tm:new -- <script-id> --name "Script Name" --match "https://example.com/*"` for a plain new script.
4. Run `npm run tm:bump -- <script-id> patch` before publishing a behavior change.
5. Run `npm run tm:sync-urls -- --repo OWNER/REPO --branch main` after choosing the GitHub raw source.
6. Run `npm run tm:check` and `npm test` before handoff.

`tm:sync-urls` can read `tampermonkey.config.json` when present. Keep only `tampermonkey.config.example.json` tracked unless the real config is intentionally shared.

## Update Metadata

Require these metadata fields for installable scripts:

```javascript
// @version      0.1.0
// @updateURL    https://raw.githubusercontent.com/OWNER/REPO/main/scripts/<id>/<id>.user.js
// @downloadURL  https://raw.githubusercontent.com/OWNER/REPO/main/scripts/<id>/<id>.user.js
```

Read `references/metadata-urls.md` only when unsure about Tampermonkey update URL behavior.

## Git And Cloud Sync

Use Git for this project. Prefer a public GitHub repo for unauthenticated cross-browser updates because private raw URLs can fail in extension update checks.

Do not create a remote unless repo name and visibility are clear. After creating or changing the remote, run URL sync again so script metadata matches the canonical raw path.

## Build Tool Policy

Read `docs/OPEN_SOURCE_RESEARCH.md` before adding a build pipeline. Keep plain scripts on `tools/tm-sync.mjs`; prefer an isolated per-script `vite-plugin-monkey` package only when TypeScript, imports, CSS, generated metadata, or dev-server behavior are needed.

## Delegation Policy

Keep Codex focused on local repo actions: code, tests, Git, release checks, and durable docs. Consider Web AI/CAC for broad research, design alternatives, long reviews, or iterative critique when the expected output would consume more Codex context than a local focused lookup.

## CAC Work

For ChatGPT Auto Continue work, read `docs/CAC_LONG_TERM_OPTIMIZATION.md` before touching source or browser state. Use `D:\Codex\CAC_API_CONTRACT_SUMMARY.cmd --no-json` before reading CAC API code, then use `docs/CAC_API_ENHANCEMENT_BACKLOG.md` for API priorities. Use existing CAC status/gate commands and WebAI/OpenPatch delivery tools before reading long CAC code. For GitHub raw auto-update testing, require the dedicated Chrome Dev profile and exactly one enabled CAC userscript version in that browser profile. Treat CAC as the mechanism for WebAI self-iteration: maintainers produce complete artifacts, reviewers critique, Codex validates, then CAC continues the loop.

## Browser Profile

For browser checks, prefer the dedicated Chrome Dev CDP profile:

```powershell
D:\Codex\CHROME_DEV_CDP_9333.cmd --status
D:\Codex\CHROME_DEV_CDP_9333.cmd
```

Use the default daily browser profile only when explicitly requested.

## Documentation Hygiene

Keep durable project decisions in `docs/START_HERE.md`, active next steps in `docs/TODO.md`, and pause/resume state in `docs/HANDOFF.md`. Avoid version-by-version logs, stale context, and root-level instruction bloat.
