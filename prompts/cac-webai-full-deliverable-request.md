# CAC WebAI Full Deliverable Request

You are the contracted CAC maintainer/solver. Codex is the owner, local validator, integrator, and release gate.

Do not command Codex to click pages, install scripts, read browser history, change gates, or run real Continue. Return a deliverable Codex can validate.

## Context

- Current reliable baseline: `v216-single-script-merge-safe-defaults-20260510.1`.
- Current known blocker: supervised dry-run works, but production/autonomous readiness is blocked by native real Continue support, candidate detection, runtime smoke registration, and stale evidence.
- Browser rule: exactly one CAC userscript version may be enabled in a test profile.
- GitHub raw `@updateURL` / `@downloadURL` should be used for update testing after local gates pass.

## Required Output

Return exactly one:

```text
decision: patch_artifact | exact_diff | needs_more_evidence | reject_current_direction
summary:
version:
target_files:
deliverable:
sha256_manifest:
install_boundary:
single_version_browser_check:
smoke_tests:
release_gate_expectation:
rollback:
risks:
next_self_iteration_card:
```

## Acceptance Bar

- Prefer a complete userscript/package over scattered snippets.
- If code is too long for reliable WebAI output, split by one whole feature or one whole source file, not random patches.
- Include sandbox/static/smoke evidence when possible.
- Include exact missing evidence if you cannot proceed.
- Do not broaden match rules, enable all-tab behavior, submit prompts, auto-download artifacts, or claim unattended readiness without bounded receipts.
