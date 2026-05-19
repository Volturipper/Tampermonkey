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
