# CAC API Enhancement Deliverable Follow-Up

Your latest response appears artifact-ready, but Codex found no downloadable file candidate.

Codex is the owner, validator, and integrator. WebAI is the contracted CAC maintainer. Do not command Codex to run local actions. Return a concrete deliverable.

Use this short API context first:

- API summary command: `D:\Codex\CAC_API_CONTRACT_SUMMARY.cmd --no-json`
- API summary file: `D:\Codex\chatgpt-auto-continue\evidence\latest\cac-api-contract-summary-latest.md`
- Current runtime bridge: `window.__cgptAutoContinueAPI`
- Current read APIs: `status`, `heartbeat`, `selfTest`, `metadata`, `apiContract`, `artifactDownloadState`, `receiptLog`, `leaseState`
- Current command APIs: `acquireLease`, `releaseLease`, `lease.acquire`, `lease.release`, `continueNow`, `dryRunContinue`, `setSupervisedControlEnabled`, `pause`, `resume`, `stop`
- Current safety: `realContinueSupported=false`, `dryRunContinueSupported=true`, real actions blocked by default, mutating commands require active lease.

## Required Decision

Return exactly one:

```text
decision: patch_artifact | exact_diff | needs_more_evidence | reject_current_direction
```

## API Enhancement Goal

Make CAC API stronger for WebAI self-iteration without making agents read the large userscript:

- expose compact API contract/status summaries;
- separate unsupported/no-candidate/clicked real Continue states;
- provide receipts that reviewers can validate;
- preserve one-CAC-version-per-browser safety;
- keep prompt submit, artifact auto-download, unattended takeover, and broad all-tabs defaults blocked unless separately gated.

## Acceptance Bar

If `patch_artifact`: attach a real zip/file with changed files, manifest, SHA256 list, smoke checklist, rollback, and next self-iteration card.

If `exact_diff`: provide exact target files, function names, and complete replace/insert snippets. Do not give vague patch advice.

If `needs_more_evidence`: name the exact missing source/evidence file and why it is necessary.

If output is long, split by whole feature or whole file. Do not send random fragments.
