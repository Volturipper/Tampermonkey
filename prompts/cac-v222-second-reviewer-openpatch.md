# CAC v222 Second Independent Review

You are acting as a second independent reviewer for the ChatGPT Auto Continue
(CAC) Tampermonkey userscript package.

Attached package: `cac-ui-preserving-api-merge-v222-20260512.zip`

This is a bounded second review because the primary CAC reviewer has not
returned a package-specific marker after follow-up. Do not depend on old CAC
reviewer chat history or older v216/v219/v220/v221 decisions.

Local pre-review evidence:

- Source zip SHA256: `4b70b8d39e8ac8287a1e73944dcd22dc5105f9fc87c01cb9074a445bab5c33a1`
- Static intake: passed.
- Cross-browser package validation: `safe_defaults_candidate_ready_for_independent_review`.
- API summary for extracted v222 runtime: `readApis=16`, `commandApis=10`, `allKeys=28`.
- `SHA256SUMS.txt`: locally verified.
- Runtime size: `1,329,344` bytes, consistent with full UI scale.
- Package claims base UI: `v216-single-script-merge-safe-defaults-20260510.1`.
- Package claims API source: `v221-self-iteration-packet-candidate.1`.

Current local browser state:

- Installed runtime remains `v221-self-iteration-packet-candidate.1`.
- Exactly one CAC userscript is enabled.
- v222 is not installed.
- Dedicated runtime URL only: `https://chatgpt.com/c/69fb92be-976c-83a6-9703-84ba859e4a06`.
- Default release gate blocks install, real Continue, prompt submit, artifact auto-download, unattended operation, production install, and takeover.

Review scope:

1. Verify the package is a UI-preserving merge, not an API-only or mini-widget replacement.
2. Verify full human-facing panel parity is plausible: open/collapse, scope controls, prompt library, diagnostics/copy helpers, guarded artifact controls, manual operator actions, and status/safety indicators.
3. Verify v220/v221 API compatibility: `selfIterationPacket()`, `apiSummary()`, `statusSummary()`, `apiContract()`, and lease aliases `leaseUntil`, `until`, `acquiredAt`, `acquired_at`, `leaseId`, `lease_id`.
4. Verify `selfIterationPacket()` is read-only and text-free by default: no prompt bodies, assistant bodies, cookies, localStorage dumps, account identifiers, browser profile data, or secrets.
5. Verify one-version safety and narrow dedicated-conversation scope.
6. Verify safe defaults: clean install inert, no prompt submit, no artifact auto-download, no unattended operation, no production takeover, and mutating commands require lease/bounded receipts.
7. Treat missing `@updateURL` / `@downloadURL` as a blocker for public/raw auto-update promotion, but not necessarily for local UI/API review.

Required first line, exactly one:

`REVIEW_DECISION: ACCEPT_FOR_LOCAL_UI_API_REVIEW`

or

`REVIEW_DECISION: NEEDS_CHANGES`

Then include only:

- package_reviewed
- accepted_scope
- blocked_scope
- blocking_issues
- nonblocking_notes
- ui_parity_findings
- api_contract_findings
- auto_update_findings
- required_next_steps

If you cannot inspect the attached package, choose `REVIEW_DECISION: NEEDS_CHANGES`
and name the exact missing package/evidence. Do not provide loose patch
fragments. Do not approve production install, unattended operation, prompt
submission, artifact auto-download, takeover, broad real Continue, or public
raw auto-update promotion.
