# Handoff

Date: 2026-05-19

This is a multi-script Tampermonkey workspace, not a single userscript project.

Implemented:

- `tools/tm-sync.mjs` supports `list`, `check`, `bump`, and `sync-urls`.
- `tools/tm-sync.mjs` also supports `new` for plain script scaffolding.
- Tests live in `tests/tm-sync.test.mjs` and run with `npm test`.
- Scripts belong under `scripts/<script-id>/<script-id>.user.js`.
- `@updateURL` and `@downloadURL` are treated as required metadata.
- Open-source options are recorded in `docs/OPEN_SOURCE_RESEARCH.md`; default phase-2 build choice is `vite-plugin-monkey`.
- Broad research/design/review can be delegated to Web AI/CAC; simple focused checks stay local when that is cheaper.
- Dedicated browser testing preference is Chrome Dev CDP profile at `127.0.0.1:9333`.

GitHub remote: https://github.com/Volturipper/Tampermonkey

After editing a script, run:

```powershell
npm run tm:sync-urls
npm run tm:check
```
