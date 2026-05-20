# CAC Long-Term Optimization

Date: 2026-05-20

## Current Facts

- CAC means ChatGPT Auto Continue.
- Current runtime facts must come from the local status surfaces and `docs/START_HERE.md`, not from this planning note.
- Current installed public CAC test lane is the public workspace script under `scripts/cac-v220-runtime/` with GitHub raw update URLs; newer v221 artifacts are candidate packages until package-specific review and local gates pass.
- Version number alone is not a release gate. Promotion requires package hash, independent review, local checks, scoped install/update smoke, and release gate.
- The current v220/v221 API candidates are not UI-complete. The full human-facing UI baseline is the v216 single-script merge/safe-defaults package recorded in `docs/CAC_UI_UX_ROADMAP.md`.
- Real Continue, unattended operation, production install, and takeover remain blocked unless a fresh action-time gate explicitly permits a bounded test.

## Operating Model

Codex owns local integration, version control, smoke tests, GitHub publishing, and final accept/reject decisions.

WebAI/OpenPatch are contractors for large CAC work. They should return complete deliverables, not command streams and not loose patch fragments.

CAC's strategic value is the self-iteration loop: Codex defines acceptance criteria, CAC keeps WebAI role pages moving, WebAI returns artifacts, Codex/other WebAI roles review, and CAC asks for the next correction until a candidate passes gates.

OpenPatch/WebAI Transfer are the default bridge for large WebAI work. Codex
should not spend context reading long WebAI conversations or reconstructing
answers from page text. WebAI must hand back a file/zip/GitHub commit/receipt
or a short marker-bearing status packet that local tools can verify.

Reject WebAI work when it lacks:

- full changed files or exact file-by-file diff;
- version string and SHA256 manifest;
- smoke test evidence or sandbox report;
- rollback instructions;
- known risks and next self-iteration card.

## Token-Efficient Rules

- Do not read full CAC source or long ChatGPT history by default.
- Do not treat a WebAI page as an in-context collaborator for long dialog.
  Treat it as an async worker behind OpenPatch/WebAI Transfer, then harvest
  compact receipts, markers, manifests, and artifacts.
- For CAC API questions, run `D:\Codex\CAC_API_CONTRACT_SUMMARY.cmd --no-json` and read `D:\Codex\chatgpt-auto-continue\evidence\latest\cac-api-contract-summary-latest.md` first.
- Drive API changes from `docs/CAC_API_ENHANCEMENT_BACKLOG.md`; do not open the large script until the summary/backlog is insufficient.
- Start with `CAC_TOOL_INVENTORY`, `CAC_MONITOR`, n8n latest gates, version registry, role registry, and curated handoff docs.
- Read source only by targeted search, function/symbol slice, or WebAI-provided exact file reference.
- Package context for WebAI instead of pasting long files into Codex chat.

## Version Governance

Use a strict promote path:

```text
candidate -> WebAI maintainer artifact -> independent review -> local static checks -> isolated install smoke -> supervised dry-run -> GitHub raw/update test -> release gate -> promote
```

Each promoted candidate needs:

- `@version` increment;
- `@updateURL` and `@downloadURL`;
- package SHA256;
- one enabled CAC version per browser profile;
- release-gate decision;
- rollback URL or previous raw version.

## GitHub And Auto-Update Testing

Use GitHub raw URLs to test Tampermonkey update behavior, but only in the dedicated Chrome Dev profile first.

Before any CAC install/update test:

1. Verify Chrome Dev CDP profile:

```powershell
D:\Codex\CHROME_DEV_CDP_9333.cmd --status
```

2. Verify only one CAC userscript is enabled in that profile.
3. If multiple CAC scripts are enabled, stop and resolve the conflict before testing.
4. Register or choose a dedicated runtime smoke conversation; never test real CAC behavior on maintainer/reviewer pages.
5. Run install precheck, API smoke, supervised control smoke, lease gate, and release gate.

Do not use the user's daily browser profile for CAC version tests unless explicitly requested.

## WebAI Work Packages

Use existing CAC/OpenPatch tooling first:

- `D:\Codex\WEBAI_ASSET_INTAKE.cmd`
- `D:\Codex\WEBAI_CHATGPT_DIRECT_SEND.cmd`
- `D:\Codex\WEB_AI_TRANSFER_DELIVER.cmd`
- `D:\Codex\CAC_REVIEW_RELAY.cmd`
- `D:\Codex\CAC_CROSS_BROWSER_PACK_VALIDATE.cmd`
- `D:\Codex\OPENPATCH_REVIEW_RELAY.cmd`
- `D:\Codex\N8N_WEB_AI_ROLE_REGISTRY_LATEST.cmd --project chatgpt-auto-continue`

Primary role:

- Maintainer/solver: `cac-maintainer-agent-api`
- Reviewer: `cac-independent-reviewer`
- Runtime smoke page: dedicated runtime only, not a WebAI outsourcing page.

## Next Phase

1. Refresh Chrome Dev profile and role heartbeats.
2. Send a stricter WebAI maintainer request requiring a full artifact or exact diff.
3. Intake the returned package with hashes.
4. Send package to independent reviewer.
5. Validate locally in an isolated profile with exactly one CAC version enabled.
6. Publish only after fresh gates pass.
7. Use CAC to continue the maintainer/reviewer loop only when the previous WebAI response satisfies the delivery contract or clearly names missing evidence.
