# Tampermonkey Workspace

This workspace is a collection for multiple Tampermonkey userscripts.

## Layout

- `scripts/<script-id>/<script-id>.user.js`: one script project per folder.
- `tools/tm-sync.mjs`: no-dependency version and update URL helper.
- `skills/tampermonkey-collection/`: project-specific reusable Codex skill.
- `docs/TODO.md` and `docs/HANDOFF.md`: only durable decisions and next steps.

## Common Commands

```powershell
npm test
npm run tm:list
npm run tm:check
npm run tm:new -- my-script --name "My Script" --match "https://example.com/*"
npm run tm:bump -- example-versioned patch
npm run tm:sync-urls -- --repo OWNER/REPO --branch main
```

`tm:sync-urls` writes both `@updateURL` and `@downloadURL` to GitHub raw URLs. It also reads `tampermonkey.config.json` when present; keep `tampermonkey.config.example.json` as the tracked template.

## Git Decision

Use Git for this workspace. Tampermonkey update checks depend on stable, versioned script URLs, so Git history plus GitHub raw URLs are the lowest-friction local/cloud sync path.

Remote: https://github.com/Volturipper/Tampermonkey

This repo is public for unauthenticated cross-browser update URLs. Private GitHub raw URLs can fail from browser extension update checks.

## Build Tool Policy

Start with plain `.user.js` plus `tools/tm-sync.mjs`. If a script needs TypeScript, imports, CSS, framework UI, generated metadata, or a dev server, isolate a build package inside that script folder and prefer `vite-plugin-monkey`.

See `docs/OPEN_SOURCE_RESEARCH.md` for the researched options and phase rule.

## Research And Review Delegation

Use Codex for local repo work: code edits, tests, Git, release checks, and durable project files.

Use Web AI/CAC for broad or deep research, design alternatives, long reviews, and iterative critique when the expected output is large enough to save Codex context. For small focused lookups, Codex should decide whether direct browsing is cheaper than outsourcing.

## CAC Long-Term Work

CAC optimization is a long-term goal for this workspace. Before touching CAC source or browser state, read `docs/CAC_LONG_TERM_OPTIMIZATION.md`.

Default stance:

- use CAC/OpenPatch/WebAI delivery tools before reading long source;
- require complete WebAI artifacts or exact diffs, not loose patch fragments;
- use GitHub raw update URLs for update testing only after local gates pass;
- keep exactly one CAC userscript version enabled in a browser profile.

Current bounded runtime target:

```text
https://chatgpt.com/c/69fb92be-976c-83a6-9703-84ba859e4a06
```

As of 2026-05-20, v220 has replaced v219 on that dedicated runtime page in the Chrome Dev profile. Use explicit `--url` / `--conversation-id` with CAC Tampermonkey verify/install helpers; the generic verify default points at an older maintainer page and can produce a false failure.

Current installed CAC runtime: `v220-lease-alias-candidate.1`. Verified state: one enabled CAC userscript, target page API present, other ChatGPT pages without CAC API, API smoke passed, supervised dry-run passed, lease gate passed, default release gate still blocks real Continue, unattended operation, production install, and takeover. Plan GitHub raw auto-update testing only from this single-version scoped state.

Public raw update source for CAC v220 workspace testing:

```text
scripts/cac-v220-runtime/cac-v220-runtime.user.js
https://raw.githubusercontent.com/Volturipper/Tampermonkey/main/scripts/cac-v220-runtime/cac-v220-runtime.user.js
```

Do not use `Volturipper/chatgpt-auto-continue-review` raw URLs for cross-browser Tampermonkey update checks; that repo is private, so unauthenticated raw URLs return 404.

## Browser Testing

Prefer the dedicated Chrome Dev CDP profile:

```powershell
D:\Codex\CHROME_DEV_CDP_9333.cmd --status
D:\Codex\CHROME_DEV_CDP_9333.cmd
```

Use proxy only when network access needs it:

```powershell
$env:HTTPS_PROXY = "http://127.0.0.1:7897"
$env:HTTP_PROXY = "http://127.0.0.1:7897"
```
