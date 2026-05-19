# Handoff

Date: 2026-05-19

This is a multi-script Tampermonkey workspace, not a single userscript project.

Implemented:

- `tools/tm-sync.mjs` supports `list`, `check`, `bump`, and `sync-urls`.
- Tests live in `tests/tm-sync.test.mjs` and run with `npm test`.
- Scripts belong under `scripts/<script-id>/<script-id>.user.js`.
- `@updateURL` and `@downloadURL` are treated as required metadata.
- Open-source options are recorded in `docs/OPEN_SOURCE_RESEARCH.md`; default phase-2 build choice is `vite-plugin-monkey`.
- Dedicated browser testing preference is Chrome Dev CDP profile at `127.0.0.1:9333`.

GitHub remote is not created yet. Use a public repo for unauthenticated Tampermonkey auto-updates, then run:

```powershell
npm run tm:sync-urls -- --repo OWNER/REPO --branch main
npm run tm:check
```
