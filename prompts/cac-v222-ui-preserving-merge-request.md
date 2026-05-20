# CAC v222 UI-Preserving Merge Request

You are the contracted CAC maintainer/solver. Codex is the owner, local validator, integrator, and release gate.

Goal: produce a complete CAC candidate package that preserves the full human-facing CAC UI while merging the latest accepted API improvements.

## Inputs / Baselines

- Full UI baseline to preserve:
  - `D:\Gemini DL\cac-single-script-merge-20260509.zip`
  - `D:\Gemini DL\cac-cross-browser-tampermonkey-install-pack-safe-defaults-20260510.zip`
  - extracted probe paths:
    - `D:\Codex\Tampermonkey\scratch\cac-ui-source-probe\runtime\cac-userscript.user.js`
    - `D:\Codex\Tampermonkey\scratch\cac-ui-source-probe\cac-current-reviewed.user.js`
- Current accepted API-only runtime:
  - package: `cac-api-enhancement-v221-self-iteration-20260512.zip`
  - runtime: `v221-self-iteration-packet-candidate.1`
  - API smoke: 28 keys, includes `selfIterationPacket`
  - static summary now reports 16 read APIs and 10 command APIs
- Current browser state:
  - exactly one CAC userscript is enabled
  - installed only on dedicated runtime conversation `69fb92be-976c-83a6-9703-84ba859e4a06`
  - release gate still blocks real Continue, prompt submit, artifact auto-download, unattended operation, production install, and takeover

## Required Merge

Base the next package on the v216 full UI/safe-defaults implementation, not on the compact v220/v221 API-only script.

Preserve or migrate all existing human UI behavior:

- visible panel and open/close behavior
- settings
- prompt preset library
- scope controls
- diagnostics
- guarded artifact download controls
- manual operator actions
- copy/export helpers
- safety/status indicators

Merge the v220/v221 API improvements:

- `leaseUntil` / `until`
- `acquiredAt` / `acquired_at`
- current API contract/summary alignment
- `selfIterationPacket()`
- text-free status and self-iteration output: no prompt bodies, assistant bodies, cookies, localStorage dumps, account identifiers, or browser profile data

## UI/UX Constraints

- Improve UI only if low risk: clearer hierarchy, spacing, labels, disabled reasons, focus states, keyboard accessibility, and no overlapping text.
- Do not replace the full panel with a mini status widget.
- Do not add heavy build tooling unless the package includes a clear isolated build/release path.
- OSS icons/assets are allowed only if source, version, and license are pinned in the package.

## Safety Constraints

Do not enable by default:

- broad all-tabs behavior
- real Continue
- prompt submit
- artifact auto-download
- unattended operation
- production install
- takeover

Mutating commands must keep active lease checks and bounded receipts.

## Required Output

Return exactly one:

```text
decision: patch_artifact | exact_diff | needs_more_evidence | reject_current_direction
summary:
version:
base_ui_source:
api_source:
target_files:
deliverable:
sha256_manifest:
ui_parity_smoke:
api_smoke:
install_boundary:
single_version_browser_check:
release_gate_expectation:
rollback:
risks:
next_self_iteration_card:
```

If `patch_artifact`: attach a real zip/file with changed files, manifest, SHA256 list, UI parity checklist, API smoke checklist, rollback, and next self-iteration card.

If `exact_diff`: provide exact target files, function names, and complete replacement blocks. Do not provide loose fragments.

If `needs_more_evidence`: name the exact missing file(s) or evidence needed. Do not guess or rebuild the UI from scratch.

Reject your own deliverable if it drops existing full UI features, removes safety gates, or cannot be validated without Codex reading the full 1.3 MB script manually.
