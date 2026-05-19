---
name: tampermonkey-collection
description: Use when working in D:\Codex\Tampermonkey on multiple Tampermonkey userscripts, including creating or reorganizing scripts under per-script folders, bumping @version, adding or syncing @updateURL and @downloadURL, checking local/cloud update readiness, using GitHub raw URLs, testing with the dedicated Chrome Dev CDP profile, or updating project TODO/handoff notes.
---

# Tampermonkey Collection

Use this workspace as a multi-script collection, not a single userscript project.

## Fast Path

1. Keep each script in `scripts/<script-id>/<script-id>.user.js`.
2. Run `npm run tm:list` to confirm discovery.
3. Run `npm run tm:bump -- <script-id> patch` before publishing a behavior change.
4. Run `npm run tm:sync-urls -- --repo OWNER/REPO --branch main` after choosing the GitHub raw source.
5. Run `npm run tm:check` and `npm test` before handoff.

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

## Browser Profile

For browser checks, prefer the dedicated Chrome Dev CDP profile:

```powershell
D:\Codex\CHROME_DEV_CDP_9333.cmd --status
D:\Codex\CHROME_DEV_CDP_9333.cmd
```

Use the default daily browser profile only when explicitly requested.

## Documentation Hygiene

Keep durable project decisions in `docs/START_HERE.md`, active next steps in `docs/TODO.md`, and pause/resume state in `docs/HANDOFF.md`. Avoid version-by-version logs, stale context, and root-level instruction bloat.
