# CAC Review Escalation

Use this when a CAC candidate is technically ready for local review but waits
on a WebAI reviewer marker.

Current principle:

- Do not install a waiting CAC candidate just because the reviewer is slow.
- Do not keep writing custom follow-up prompts by hand.
- Do not read long ChatGPT history while waiting.
- Keep exactly one enabled CAC userscript in the browser profile.

Low-token flow:

1. `D:\Codex\CAC_LANE_STATUS.cmd --compact`
2. `D:\Codex\CAC_INSTALL_READY.cmd --id <ledger-entry>`
3. `D:\Codex\CAC_REVIEW_ESCALATE.cmd --id <ledger-entry>`

Escalation decisions:

- `WAIT_REVIEW`: reviewer follow-up was recently sent; check later.
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
