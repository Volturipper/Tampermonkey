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
- 2026-05-20: harvested `cac-api-enhancement-v219-20260512.zip` from maintainer WebAI. Local intake now has `cac-api-enhancement` profile; cross-browser validator accepts `decisions/*gate.json` as blocker mapping when safe defaults pass.
- Local validation passed for the v219 package: `WEBAI_ASSET_INTAKE --profile cac-api-enhancement` ok; `CAC_CROSS_BROWSER_PACK_VALIDATE` ok with `decision=safe_defaults_candidate_ready_for_independent_review`.
- Sent the v219 package to CAC independent reviewer through `D:\Codex\CAC_REVIEW_RELAY.cmd send-api-enhancement-review --yes-send --json`. Heartbeat confirmed attachment `cac-api-enhancement-v219-20260512.zip`.
- Added `D:\Codex\CAC_REVIEW_DECISION_GATE.cmd --no-json` for marker-only reviewer checks. Current result after follow-up: `WAITING_NO_REVIEW_DECISION`; no reviewer `REVIEW_DECISION` marker yet.
- Sent short reviewer follow-up from `prompts/cac-api-enhancement-review-followup.md` using the dedicated Chrome Dev CDP page. The robust send path increased message count, but assistant count had not increased at the last check.
- Reviewer later returned `REVIEW_DECISION: ACCEPT_FOR_LOCAL_API_REVIEW`. Static local API review is summarized in `docs/CAC_V219_LOCAL_API_REVIEW.md`.
- Tool fixes during local API review: candidate API summary now parses v219 `Object.freeze` API objects; direct zip validation now extracts zip sources correctly.
- 2026-05-20: reopened the registered dedicated runtime page `https://chatgpt.com/c/69fb92be-976c-83a6-9703-84ba859e4a06`; `CAC_RUNTIME_TARGET list --probe` reports `approved_runtime_count=1`.
- 2026-05-20: disabled the previously enabled v216 CAC in the Chrome Dev Tampermonkey profile, then installed v219 only on the dedicated runtime URL. Latest scoped verify: `enabled_count=1`, `target_has_api=true`, `other_pages_with_api=0`, runtime SHA256 `0336b7dfca6c8f20145f168536813f2952301db52672f47703898fccd7ff35dd`.
- 2026-05-20: v219 API smoke passed with 27 keys; supervised dry-run passed with `zero_real_actions=true`; fast-track bounded real smoke passed with `actionTaken=none`, `actionCount=0`, `realClickCount=0`, `promptSubmits=0`, `downloads=0`.
- Tool fix during runtime smoke: `CAC_LEASE_GATE` now accepts v219 `leaseUntil` / `acquiredAt` fields as well as older `until` / `acquired_at`, and accepts explicit zero-action dry-run evidence. Root mirror: `D:\Codex\tools\cac-lease-gate.mjs`; git capsule source: `D:\Codex\chatgpt-auto-continue\tools\sources\cac-lease-gate.mjs`.
- Pitfall: do not use generic `D:\Codex\CAC_TAMPERMONKEY_WHITELIST_INSTALL.cmd --verify-only` for this v219 state; it defaults to an old maintainer URL and will falsely report target API missing. Use explicit `--url` and `--conversation-id` for the runtime page.
- Current default release gate still blocks install/real Continue/unattended/takeover by policy unless owner override is passed. Owner-override read-only gate can clear policy blockers for bounded tests, but do not start unattended/takeover/production.
- Refreshed `CAC_MONITOR` heartbeat and `cac-version-registry.json` for `v219-api-enhancement-candidate.1`; `CAC_MONITOR status --json` now reports `decision=ACTIVE` and the v219 registry entry.
- 2026-05-20 heartbeat: sent maintainer feedback prompt `prompts/cac-v219-runtime-feedback-next-candidate.md` to `cac-maintainer-agent-api`, requesting the next complete candidate keep `leaseUntil` / `acquiredAt` and add backward-compatible `until` / `acquired_at` aliases. Direct-send receipt: `D:\Codex\n8n-gpt-orchestrator\scratch\webai-chatgpt-direct-send-latest.json`.
- Updated existing heartbeat automation `cac-webai-harvest-check` to monitor both maintainer deliverables and reviewer decisions through `CAC_WEBAI_DELIVERABLE_GATE` / `CAC_REVIEW_DECISION_GATE`.
- 2026-05-20: harvested maintainer candidate `cac-api-enhancement-v220-lease-alias-20260512.zip`, SHA256 `0190c7de51f2c0ac24b4a3c67e43e32179824e853cb7b49a480bcfe268907062`. Latest accepted intake target: `D:\Codex\n8n-gpt-orchestrator\received-assets\20260520-031928-cac-api-enhancement-v220-lease-alias-20260512.zip`.
- Tool fix: `D:\Codex\tools\webai-asset-intake.mjs` now supports required path alternatives for the `cac-api-enhancement` profile, so v219 `docs/API_ENHANCEMENT.md` / `patches/v218_to_v219_api_enhancement.diff` and v220 `docs/API_CONTRACT.md` / `patches/v219_to_v220_lease_alias.diff` both pass. Backup: `D:\Codex\tools\webai-asset-intake.mjs.bak-20260520-0320-v220-required-groups`.
- v220 static checks only: `WEBAI_ASSET_INTAKE --profile cac-api-enhancement` passed with `required_ok=true`; `CAC_CROSS_BROWSER_PACK_VALIDATE` passed with `decision=safe_defaults_candidate_ready_for_independent_review`; `CAC_API_CONTRACT_SUMMARY --source <v220 runtime script>` passed with 27 keys. Targeted grep confirmed `leaseUntil`, `until`, `acquiredAt`, and `acquired_at` are present. v220 is not installed yet.
- 2026-05-20: updated `D:\Codex\n8n-gpt-orchestrator\prompts\cac-api-enhancement-independent-review-20260520.md` from the stale v219 request to v220 review scope; backup is `D:\Codex\n8n-gpt-orchestrator\prompts\cac-api-enhancement-independent-review-20260520.md.bak-20260520-0345-v220`.
- Sent v220 to the independent reviewer with `D:\Codex\CAC_REVIEW_RELAY.cmd send-api-enhancement-review --attach-file "D:\Gemini DL\cac-api-enhancement-v220-lease-alias-20260512.zip" --yes-send --json`. The wrapper first left the prompt in the composer; a scoped manual send-button click through CDP cleared the composer and started reviewer streaming. Do not treat the old `CAC_REVIEW_DECISION_GATE` marker as v220 acceptance until a new v220-specific decision is observed.
- v220 reviewer returned `REVIEW_DECISION: ACCEPT_FOR_LOCAL_API_REVIEW`. `CAC_REVIEW_DECISION_GATE` now reports `markers=2` and the selected marker is the latest one (`assistantOffsetFromEnd=1`).
- Tool fix: `CAC_REVIEW_DECISION_GATE` now prefers the latest package-referenced marker instead of the first package marker, avoiding stale v219 acceptance when a v220 marker exists. Root mirror: `D:\Codex\tools\cac-review-decision-gate.mjs`; git capsule source: `D:\Codex\chatgpt-auto-continue\tools\sources\cac-review-decision-gate.mjs`. Backups use suffix `.bak-20260520-0350-latest-marker`.
- 2026-05-20: replaced v219 with v220 on the dedicated runtime page only. Command sequence: `CAC_TAMPERMONKEY_WHITELIST_INSTALL --disable-enabled-cac`, then scoped `--script <v220 extracted runtime> --url https://chatgpt.com/c/69fb92be-976c-83a6-9703-84ba859e4a06 --conversation-id 69fb92be-976c-83a6-9703-84ba859e4a06 --yes-install`. Latest verify: `enabled_count_after=1`, version `v220-lease-alias-candidate.1`, script SHA256 `0c3a6b1108c42223fae8ac0948f81a7dc2e18d083a2e72f4d03e5ee988bb8a27`, `target_has_api=true`, `other_pages_with_api=0`, `leaseAliasesPresent=true`.
- v220 smoke after install: `CAC_API_SMOKE` passed with 27 keys; `CAC_SUPERVISED_CONTROL_SMOKE` passed with `dryRunContinueOk=true` and `zeroRealActions=true`; `CAC_LEASE_GATE` passed with `LEASE_DRY_RUN_READY_REAL_BLOCKED`; default `CAC_RELEASE_GATE` still reports `SUPERVISED_DRY_RUN_READY_REAL_BLOCKED`. `CAC_API_HEARTBEAT_INGEST` refreshed monitor state; `CAC_MONITOR status --json` now reports v220 `decision=ACTIVE`, `monitorable=true`, and `supervised_ready=true`. Version registry backup: `D:\Codex\n8n-gpt-orchestrator\config\cac-version-registry.json.bak-20260520-0450-v220`.

GitHub remote: https://github.com/Volturipper/Tampermonkey

After editing a script, run:

```powershell
npm run tm:sync-urls
npm run tm:check
```
