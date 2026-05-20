# CAC v222 UI-Preserving API Merge Independent Review

You are the independent reviewer for a ChatGPT Auto Continue (CAC) Tampermonkey userscript package.

Attached package: `cac-ui-preserving-api-merge-v222-20260512.zip`

Local pre-review evidence:

- Source zip SHA256: `4b70b8d39e8ac8287a1e73944dcd22dc5105f9fc87c01cb9074a445bab5c33a1`
- `WEBAI_ASSET_INTAKE --profile cac-api-enhancement`: passed after profile update.
- `CAC_CROSS_BROWSER_PACK_VALIDATE`: passed with `safe_defaults_candidate_ready_for_independent_review`.
- `CAC_API_CONTRACT_SUMMARY --source <v222 runtime>`: passed with `readApis=16`, `commandApis=10`, `allKeys=28`.
- `SHA256SUMS.txt`: locally verified against the extracted files.
- Runtime file size: `1,329,344` bytes, consistent with full UI scale rather than mini API-only runtime.
- Manifest version: `v222-ui-preserving-api-merge-candidate.1`.
- Base UI source claimed by package: `v216-single-script-merge-safe-defaults-20260510.1`.
- API source claimed by package: `v221-self-iteration-packet-candidate.1`.

Current live browser state before any v222 install:

- Chrome Dev profile only: `D:\Codex\n8n-gpt-orchestrator\browser-profiles\chrome-dev-ai-collab`, CDP `127.0.0.1:9333`.
- Installed runtime remains v221 API-only: `v221-self-iteration-packet-candidate.1`.
- Exactly one CAC userscript is enabled.
- Dedicated runtime URL only: `https://chatgpt.com/c/69fb92be-976c-83a6-9703-84ba859e4a06`.
- Target runtime page has CAC API; other ChatGPT pages must have no CAC API exposure.
- Release gate still blocks install, real Continue, prompt submit, artifact auto-download, unattended operation, production install, and takeover by default.

Review scope:

1. Verify the package is a UI-preserving merge, not an API-only or mini-widget replacement.
2. Verify v216 full human-facing panel capabilities are plausibly preserved: open/collapse, scope controls, prompt library, diagnostics, copy/export helpers, guarded artifact controls, manual operator actions, status/safety indicators.
3. Verify v220/v221 API improvements are present and backward-compatible:
   - `window.__cgptAutoContinueAPI.selfIterationPacket()`
   - `apiSummary()`, `statusSummary()`, `apiContract()`
   - lease aliases `leaseUntil`, `until`, `acquiredAt`, `acquired_at`, `leaseId`, `lease_id`
4. Verify `selfIterationPacket()` is read-only and text-free by default:
   - no prompt bodies
   - no assistant body text
   - no cookies
   - no localStorage dumps
   - no account identifiers
   - no browser profile data
5. Verify one-version safety and dedicated-conversation scope:
   - no broad all-tabs default
   - no second CAC version should be enabled beside current v221 during replacement testing
   - install, if later accepted, must replace v221 on only the dedicated runtime page
6. Verify safe defaults:
   - clean install inert
   - no prompt submit by default
   - no artifact auto-download by default
   - no unattended operation by default
   - no production takeover by default
   - mutating commands require lease/bounded receipts or equivalent guard
7. Check package metadata for auto-update readiness:
   - current candidate header has a narrow `@match`
   - current candidate does not appear to include `@updateURL` or `@downloadURL`
   - decide whether that is acceptable for local UI/API review only, and require it before public/raw auto-update promotion.
8. Reject loose patch fragments. If changes are needed, ask for a complete corrected package, exact replacement files, or exact missing evidence.

Required output:

- Start with one exact marker:
  - `REVIEW_DECISION: ACCEPT_FOR_LOCAL_UI_API_REVIEW`
  - `REVIEW_DECISION: NEEDS_CHANGES`
- Include:
  - `package_reviewed`
  - `accepted_scope`
  - `blocked_scope`
  - `blocking_issues`
  - `nonblocking_notes`
  - `ui_parity_findings`
  - `api_contract_findings`
  - `auto_update_findings`
  - `required_next_steps`

Do not approve production install, unattended operation, prompt submission, artifact auto-download, takeover, broad real Continue, or public raw auto-update promotion.
