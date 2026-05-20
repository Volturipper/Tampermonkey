# TODO

## Current

- [x] Create multi-script workspace layout.
- [x] Add no-dependency `tm-sync` helper for discovery, version bumping, URL sync, and checks.
- [x] Research mature open-source userscript build/sync options and record phase rule.
- [x] Record Web AI/CAC delegation rule for deep research/design/review.
- [x] Add project-specific reusable skill.
- [x] Initialize local Git.
- [x] Add a plain userscript scaffold command for multi-script growth.
- [x] Create public GitHub remote and push `main`.

## Next Phase

- [x] Add the first real userscript under `scripts/<script-id>/`.
- [x] Harvest CAC maintainer WebAI artifact for API enhancement v219.
- [x] Add local intake/validation support for the `cac-api-enhancement` package shape.
- [x] Add marker-only reviewer decision gate for v219 review.
- [x] Send short reviewer follow-up requesting exact `REVIEW_DECISION`.
- [x] Harvest CAC independent reviewer decision for `cac-api-enhancement-v219-20260512.zip`.
- [x] Complete static local API review summary for v219.
- [x] Select/register a dedicated CAC runtime smoke conversation before any v219 install/update testing.
- [x] Enforce one enabled CAC version per browser profile before any GitHub raw auto-update test.
- [x] Run bounded v219 runtime smoke in the dedicated Chrome Dev profile.
- [x] Refresh CAC monitor heartbeat/version registry so status surfaces no longer describe v216 as current.
- [x] Feed v219 runtime findings back into the CAC maintainer loop: keep `leaseUntil` support and add backward-compatible `until` / `acquired_at` aliases in the next CAC candidate.
- [x] Harvest the maintainer response to `prompts/cac-v219-runtime-feedback-next-candidate.md`; accepted complete package `cac-api-enhancement-v220-lease-alias-20260512.zip`.
- [x] Make `WEBAI_ASSET_INTAKE --profile cac-api-enhancement` accept both v219 and v220 API-enhancement package shapes.
- [x] Run static v220 intake, cross-browser package validation, API contract summary, and targeted lease-alias check without installing v220.
- [x] Send or route v220 for independent review; focus on lease alias compatibility, one-version safety, and safe defaults.
- [x] Harvest a new v220-specific independent reviewer marker; reviewer returned `REVIEW_DECISION: ACCEPT_FOR_LOCAL_API_REVIEW`.
- [x] Fix `CAC_REVIEW_DECISION_GATE` stale-marker selection so latest package-referenced marker wins.
- [x] Install v220 only after review/gates pass, replacing v219 on the dedicated runtime page so only one CAC version remains enabled.
- [x] Run v220 API smoke, supervised dry-run smoke, lease gate, heartbeat ingest, scoped Tampermonkey verify, and default release gate refresh.
- [x] Plan GitHub raw auto-update testing for CAC only after preserving current single-version scoped state.
- [x] Publish CAC v220 runtime into this public Tampermonkey workspace with public raw `@updateURL` / `@downloadURL`.
- [x] After pushing the public script, verify unauthenticated raw fetch returns public metadata version `2026.5.220`.
- [x] Replace the installed v220 metadata with the public-update variant while preserving exactly one enabled CAC row in the Chrome Dev Tampermonkey profile.
- [x] Add reusable public raw preflight command `npm run tm:raw-check`.
- [x] Add reusable CAC version ledger command `npm run cac:versions`.
- [x] Plan the next GitHub raw auto-update test from the restored single-version state; do not enable another CAC version alongside `2026.5.220`.
- [x] Execute the planned CAC raw auto-update test with a metadata-only version bump on the existing public script URL.
- [x] Refresh CAC WebAI role heartbeats before outsourcing the next CAC artifact.
- [x] Select next CAC API enhancement: `v221-self-iteration-packet` plus current contract-summary alignment.
- [x] Route `prompts/cac-v221-self-iteration-packet-request.md` to the CAC maintainer as a complete package request.
- [x] Harvest CAC maintainer response for `v221-self-iteration-packet`; accepted complete package `cac-api-enhancement-v221-self-iteration-20260512.zip`.
- [x] Run static v221 intake, cross-browser package validation, contract-summary check, and targeted `selfIterationPacket` check without installing v221.
- [x] Route v221 for independent review; focus on read-only/text-free `selfIterationPacket`, current contract-summary alignment, one-version safety, and safe defaults.
- [x] Send a v221-specific reviewer follow-up prompt after the package decision gate still waited for a fresh marker.
- [x] Enhance `npm run cac:versions` so the CAC version ledger checks recorded local source files and SHA256s instead of requiring manual path/hash inspection.
- [x] Harvest the v221 independent reviewer decision with `CAC_REVIEW_DECISION_GATE --package "cac-api-enhancement-v221-self-iteration-20260512.zip"`; reviewer returned `ACCEPT_FOR_LOCAL_API_REVIEW`.
- [x] Replace v220 with v221 only on the dedicated runtime page, preserving exactly one enabled CAC userscript.
- [x] Run v221 API smoke, supervised dry-run smoke, lease gate, heartbeat ingest, scoped Tampermonkey verify, monitor gate, and default release gate refresh.
- [x] Fix `CAC_API_CONTRACT_SUMMARY` so v221 `READ_API_NAMES.slice()` / `COMMAND_API_NAMES.slice()` are summarized as 16 read APIs and 10 command APIs instead of `unknown`.
- [x] Send `prompts/cac-v222-ui-preserving-merge-request.md` to the CAC maintainer for a full UI-preserving merge package.
- [x] Harvest the v222 UI-preserving maintainer response with `CAC_WEBAI_DELIVERABLE_GATE --project chatgpt-auto-continue --role maintainer --no-json`; accepted complete package `cac-ui-preserving-api-merge-v222-20260512.zip`.
- [x] Run v222 static intake, cross-browser package validation, SHA256SUMS verification, contract-summary check, and targeted UI/API/safety marker checks without installing v222.
- [x] Route v222 to the independent reviewer with `CAC_REVIEW_RELAY`, attaching `cac-ui-preserving-api-merge-v222-20260512.zip`.
- [x] Add low-token continuation helper `npm run cac:lane` so future turns start from one compact status surface instead of several separate gate reads.
- [x] Add `npm run cac:review-prompt` to generate reviewer prompts from ledger/package metadata and avoid hand-written package/hash/scope drift.
- [ ] Harvest a fresh package-specific v222 reviewer decision with `CAC_REVIEW_DECISION_GATE --package "cac-ui-preserving-api-merge-v222-20260512.zip" --no-json`.
- [ ] Restore CAC user-facing UI as a first-class requirement: base the next full candidate on the existing v216 single-script merge/safe-defaults UI, not a new mini panel.
- [ ] Improve CAC panel UI/UX from `docs/CAC_UI_UX_ROADMAP.md`: preserve full UI, use OSS assets only with pinned source/license, and plan frontend/controller/API decoupling.
- [ ] Use CAC to drive the maintainer/reviewer self-iteration loop after each acceptable WebAI deliverable.
- [ ] Drive CAC API enhancements from `docs/CAC_API_ENHANCEMENT_BACKLOG.md`.
- [ ] Use `vite-plugin-monkey` only when a script needs build features.

## Maintenance Rules

- Keep root context lean; avoid version logs and stale run details.
- Record durable decisions in `docs/START_HERE.md`.
- Record active next steps in this file only when they affect future work.
- Update `docs/HANDOFF.md` before pausing a meaningful work session.
