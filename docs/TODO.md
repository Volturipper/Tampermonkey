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

- [ ] Add the first real userscript under `scripts/<script-id>/`.
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
- [ ] Plan GitHub raw auto-update testing for CAC only after preserving current single-version scoped state.
- [ ] Refresh CAC WebAI role heartbeats before outsourcing the next CAC artifact.
- [ ] Use CAC to drive the maintainer/reviewer self-iteration loop after each acceptable WebAI deliverable.
- [ ] Drive CAC API enhancements from `docs/CAC_API_ENHANCEMENT_BACKLOG.md`.
- [ ] Use `vite-plugin-monkey` only when a script needs build features.

## Maintenance Rules

- Keep root context lean; avoid version logs and stale run details.
- Record durable decisions in `docs/START_HERE.md`.
- Record active next steps in this file only when they affect future work.
- Update `docs/HANDOFF.md` before pausing a meaningful work session.
