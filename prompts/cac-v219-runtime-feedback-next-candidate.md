# CAC v219 Runtime Feedback And Next Candidate Request

You are the CAC maintainer role. Codex is the local integration owner and validator.

Current bounded runtime result:

- Candidate: `cac-api-enhancement-v219-20260512.zip`
- Runtime version: `v219-api-enhancement-candidate.1`
- Runtime page only: `https://chatgpt.com/c/69fb92be-976c-83a6-9703-84ba859e4a06`
- Tampermonkey state: exactly one CAC userscript enabled in the Chrome Dev profile
- Other open ChatGPT pages with CAC API: 0
- API smoke: passed, 27 keys
- Supervised dry-run: passed, `zero_real_actions=true`
- Fast-track bounded real smoke: passed with no real click:
  - `actionTaken=none`
  - `actionCount=0`
  - `realClickCount=0`
  - `promptSubmits=0`
  - `downloads=0`

Local integration finding:

- v219 returns lease fields as `leaseUntil` and `acquiredAt`.
- Existing local gate tooling had expected older names: `until` and `acquired_at`.
- Codex patched the local gate to accept both forms, so the current runtime smoke now passes.

Please produce the next complete CAC candidate package or an explicit no-change decision.

Required next-candidate behavior:

- Keep the v219 `leaseUntil` / `acquiredAt` fields.
- Add backward-compatible aliases in lease API responses:
  - `until` should equal `leaseUntil`.
  - `acquired_at` should equal `acquiredAt`.
- Keep safe defaults: no broad default enable, no prompt submit, no artifact auto-download, no unattended operation, no production takeover.
- Keep the runtime scoped to the dedicated conversation unless explicitly configured otherwise.
- Keep `@updateURL` and `@downloadURL` metadata usable for future cross-browser update tests if this is packaged as a userscript.

Required deliverable format:

- Prefer a downloadable zip.
- Include:
  - `runtime/cac-userscript.user.js`
  - package manifest with version and SHA256
  - smoke checklist
  - rollback note
  - self-iteration card
  - concise decision JSON
- If no code change is needed, return a clear `NO_CHANGE_DECISION` with exact evidence and why the alias is already present.

Do not tell Codex to run local commands. Return complete artifacts or exact replacement files.
