# CAC v221 Self-Iteration Packet Request

Goal: produce a complete CAC API enhancement candidate that helps WebAI/CAC drive its own maintainer and reviewer loop without Codex reading long ChatGPT history or the large CAC userscript.

Current runtime baseline:

- Installed runtime: `v220-lease-alias-candidate.1`
- Tampermonkey metadata: `2026.5.221`
- Public raw update URL: `https://raw.githubusercontent.com/Volturipper/Tampermonkey/main/scripts/cac-v220-runtime/cac-v220-runtime.user.js`
- Current live API smoke: 27 keys, including `apiSummary`, `statusSummary`, `receiptSummary`, `realContinueProbe`, `realContinueScenario`, `machineState`, and `supervisorState`.
- Current release gate remains dry-run only: no real Continue, prompt submit, artifact auto-download, unattended operation, production install, or takeover.

Important gap:

- `D:\Codex\CAC_API_CONTRACT_SUMMARY.cmd --no-json` still summarizes an older v216 source/evidence surface with 18 keys and `realContinueSupported=false`.
- The next candidate must keep the live API and low-token summary surfaces aligned so future agents read a compact, current summary instead of opening the large source.

Required deliverable:

Return a complete zip/package, not loose patch fragments. Include:

- updated runtime userscript;
- exact patch/diff from v220 to v221;
- updated API contract documentation;
- smoke checklist;
- rollback notes;
- next self-iteration card;
- SHA256 manifest;
- gate/decision JSON describing allowed scope and forbidden behaviors.

Required API enhancement:

Add read-only `selfIterationPacket()` to `window.__cgptAutoContinueAPI`.

Suggested schema: `cac.self_iteration_packet.v1`

Minimum fields:

- `schema`, `version`, `build`, `generatedAt`
- `currentState`: compact status, blocker, stateCode, lease state, single-version state if known
- `api`: key count, read APIs, command APIs, safety flags
- `evidence`: latest local evidence names/paths that Codex should inspect, without secrets
- `acceptanceCriteria`: concrete checks required before install/update promotion
- `requiredDeliverableType`: `complete_package`, `exact_diff`, or `missing_evidence`
- `nextWebAIRequest`: concise maintainer/reviewer instruction text
- `forbiddenActions`: real Continue, prompt submit, artifact auto-download, unattended operation, production install, takeover unless separately gated
- `notes`: short text only; no prompt/body scraping and no chat history extraction

Integration requirements:

- Add `selfIterationPacket` to `apiContract`, `apiSummary`, `metadata` if applicable, and the exported key set.
- Keep `apiSummary()` and `statusSummary()` text-free and safe.
- Preserve lease aliases: `leaseUntil` / `until` and `acquiredAt` / `acquired_at`.
- Preserve scoped `@match` to the dedicated runtime URL only.
- Preserve single-version safety expectations: installing/updating must not enable a second CAC version.
- Mutating commands must still require active lease and bounded receipts.

Summary-tool requirement:

Update the low-token contract summary path so it can summarize the current v220/v221 API surface rather than stale v216 evidence. Acceptable approaches:

- update `CAC_API_CONTRACT_SUMMARY` source selection to support the v220/v221 runtime script/package; or
- add a new small summary artifact generated from the package that Codex can read first.

Acceptance checks expected from you before delivery:

- static metadata check: narrow match only, no broad ChatGPT match;
- `node --check` or equivalent syntax check;
- API key count includes the new `selfIterationPacket` read API;
- `selfIterationPacket()` returns no prompt text, no user message body, no cookies/secrets/localStorage dumps;
- dry-run smoke shows zero real actions;
- release gate still blocks real Continue, prompt submit, artifact auto-download, unattended operation, production install, and takeover by default.

Reviewer focus after delivery:

- safety boundaries;
- no secret/text scraping;
- self-iteration packet usefulness;
- summary surface freshness;
- single-version update/install behavior.
