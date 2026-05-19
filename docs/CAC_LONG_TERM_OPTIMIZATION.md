# CAC Long-Term Optimization

Date: 2026-05-20

## Current Facts

- CAC means ChatGPT Auto Continue.
- Current reliable baseline from local status surfaces: `v216-single-script-merge-safe-defaults-20260510.1`.
- Registry also mentions v217-class candidates, but version number alone is not a release gate.
- Latest monitor/release evidence is stale. Treat old PASS results as historical until refreshed.
- Current state supports supervised dry-run on a dedicated runtime page; real Continue/unattended operation remains blocked unless a fresh action-time gate permits it.
- Current runtime target probe reports no registered/open runtime smoke conversation.

## Operating Model

Codex owns local integration, version control, smoke tests, GitHub publishing, and final accept/reject decisions.

WebAI/OpenPatch are contractors for large CAC work. They should return complete deliverables, not command streams and not loose patch fragments.

Reject WebAI work when it lacks:

- full changed files or exact file-by-file diff;
- version string and SHA256 manifest;
- smoke test evidence or sandbox report;
- rollback instructions;
- known risks and next self-iteration card.

## Token-Efficient Rules

- Do not read full CAC source or long ChatGPT history by default.
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
