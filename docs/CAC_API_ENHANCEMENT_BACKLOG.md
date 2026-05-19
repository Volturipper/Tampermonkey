# CAC API Enhancement Backlog

Date: 2026-05-20

Read first:

```powershell
D:\Codex\CAC_API_CONTRACT_SUMMARY.cmd --no-json
```

Short summary output:

```text
D:\Codex\chatgpt-auto-continue\evidence\latest\cac-api-contract-summary-latest.md
```

## Current API Baseline

- Public runtime bridge: `window.__cgptAutoContinueAPI`
- Read APIs: `status`, `heartbeat`, `selfTest`, `metadata`, `apiContract`, `artifactDownloadState`, `receiptLog`, `leaseState`
- Command APIs: `acquireLease`, `releaseLease`, `lease.acquire`, `lease.release`, `continueNow`, `dryRunContinue`, `setSupervisedControlEnabled`, `pause`, `resume`, `stop`
- Current safety: `realContinueSupported=false`, `dryRunContinueSupported=true`, real actions blocked by default, mutating commands require active lease.

## Priority Enhancements

1. `apiSummary()`
   - Return a compact contract summary equivalent to `CAC_API_CONTRACT_SUMMARY`, but from the live page.
   - Must stay text-free: no prompt/body scraping.

2. `realContinueState`
   - Add explicit state codes:
     - `REAL_CONTINUE_UNSUPPORTED`
     - `REAL_CONTINUE_CAPABLE_NO_CANDIDATE`
     - `REAL_CONTINUE_CANDIDATE_CLICKED`
     - `REAL_CONTINUE_BLOCKED_BY_LEASE`
     - `REAL_CONTINUE_BLOCKED_BY_SCOPE`
     - `REAL_CONTINUE_BLOCKED_BY_SUPERVISION`

3. Bounded real Continue receipt
   - Add receipt fields: `nativeContinueFound`, `nativeContinueCandidates`, `candidateTexts`, `candidateSelectorsMatched`, `buttonVisible`, `buttonEnabled`, `blocker`, `actionTaken`, `actionCount`, `realActionCount`, `stateCode`.
   - Never treat composer send/submit as Continue.

4. Self-iteration packet
   - Add a read API that returns the next WebAI card: current blocker, acceptance criteria, evidence links, and required deliverable type.
   - Goal: CAC can drive maintainer/reviewer loops without Codex reading chat history.

5. Single-version browser guard
   - Status should report whether another CAC userscript/API instance is detected on the same profile/page set when possible.
   - Install/update tests must stop if multiple CAC versions are enabled.

## Acceptance Rules

- No prompt submit, artifact auto-download, unattended takeover, or broad all-tabs behavior without separate gates.
- Any mutating action needs active lease and bounded receipt.
- WebAI deliverables must be full artifact, exact diff, or exact missing evidence.
- Reviewer must confirm safety boundaries before local install/update testing.
