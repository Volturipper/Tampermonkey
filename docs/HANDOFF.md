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
- CAC long-term plan: `docs/CAC_LONG_TERM_OPTIMIZATION.md`.
- CAC WebAI full-deliverable request template: `prompts/cac-webai-full-deliverable-request.md`.
- 2026-05-20: sent the full-deliverable request to `cac-maintainer-agent-api` with `WEBAI_CHATGPT_DIRECT_SEND`; receipt is `D:\Codex\n8n-gpt-orchestrator\scratch\webai-chatgpt-direct-send-latest.json`.
- CAC API summary tool: `D:\Codex\CAC_API_CONTRACT_SUMMARY.cmd --no-json`, output `D:\Codex\chatgpt-auto-continue\evidence\latest\cac-api-contract-summary-latest.md`.
- CAC API enhancement backlog: `docs/CAC_API_ENHANCEMENT_BACKLOG.md`.
- 2026-05-20: maintainer page had artifact-ready wording but no downloadable candidate; sent `prompts/cac-api-enhancement-deliverable-followup.md`.

GitHub remote: https://github.com/Volturipper/Tampermonkey

After editing a script, run:

```powershell
npm run tm:sync-urls
npm run tm:check
```
