# CAC Review Escalation

Use this when a CAC candidate is technically ready for local review but waits
on a WebAI reviewer marker.

Current principle:

- Do not install a waiting CAC candidate just because the reviewer is slow.
- Do not keep writing custom follow-up prompts by hand.
- Do not read long ChatGPT history while waiting.
- Do not pull WebAI long conversation text into Codex. Use OpenPatch/GitHub
  delivery or WebAI Transfer/file relay, then harvest compact heartbeat,
  receipt, marker, manifest, and package surfaces.
- Keep exactly one enabled CAC userscript in the browser profile.

Low-token flow:

1. `D:\Codex\CAC_LANE_STATUS.cmd --compact`
2. `D:\Codex\CAC_INSTALL_READY.cmd --id <ledger-entry>`
3. `D:\Codex\CAC_REVIEW_ESCALATE.cmd --id <ledger-entry>`

Escalation decisions:

- `WAIT_REVIEW`: reviewer follow-up was recently sent; do not dead-wait in
  Codex. Treat the WebAI reviewer as an async queue, let heartbeat/marker
  surfaces wake the lane, and switch to nonblocking local work.
- `SEND_FOLLOWUP`: generate a package-specific follow-up and send through
  `CAC_REVIEW_RELAY`.
- `ESCALATE_SECOND_REVIEWER`: route the same package to a second independent
  reviewer or reviewer clone.
- `PREPARE_OWNER_FALLBACK_PACKET`: prepare an owner-approved isolated
  replacement smoke packet only after a longer wait and only when static local
  gates pass.
- `READY_FOR_BOUNDED_REPLACEMENT_INSTALL`: review accepted and local gates say
  replacement can be planned.

For v222, the current smart path is not to install yet. Static UI smoke passes,
but the review decision gate still waits for a package-specific marker.

Second reviewer route used for v222:

1. Generate a self-contained prompt that does not depend on old CAC reviewer
   history: `prompts/cac-v222-second-reviewer-openpatch.md`.
2. Send the same zip to the reviewer clone with scoped Chrome Dev CDP control:
   `D:\Codex\OPENPATCH_CHATGPT_CONTROL.cmd send-prompt --url "https://chatgpt.com/c/69fc8023-bbd0-83aa-8428-8151a8ebb35f" --attach-file "D:\Gemini DL\cac-ui-preserving-api-merge-v222-20260512.zip" --prompt-file "D:\Codex\Tampermonkey\prompts\cac-v222-second-reviewer-openpatch.md" --heartbeat --heartbeat-path "scratch\openpatch-repo-reviewer-heartbeat-latest.json" --event task_sent`.
3. Accept the send only when the composer is cleared and the user-message or
   total message count increases. `ok=true` with non-zero `inputBytes` is a
   false-positive submit and must not advance the lane.
4. Check that reviewer clone only through compact surfaces:
   `D:\Codex\N8N_WEB_AI_ROLE_HEARTBEAT_LATEST.cmd --profile openpatch-repo-reviewer`
   and `D:\Codex\CAC_REVIEW_DECISION_GATE.cmd --url "https://chatgpt.com/c/69fc8023-bbd0-83aa-8428-8151a8ebb35f" --package "cac-ui-preserving-api-merge-v222-20260512.zip" --no-json`.
