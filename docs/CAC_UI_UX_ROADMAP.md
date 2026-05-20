# CAC UI/UX Roadmap

Date: 2026-05-20

Purpose: CAC is a human-facing Tampermonkey product as well as an AI/API bridge. UI work must improve the existing complete panel experience, not replace it with a small API status widget.

## Current Baseline

- Full UI source to preserve:
  - `D:\Gemini DL\cac-single-script-merge-20260509.zip`
  - `D:\Gemini DL\cac-cross-browser-tampermonkey-install-pack-safe-defaults-20260510.zip`
  - extracted probe: `D:\Codex\Tampermonkey\scratch\cac-ui-source-probe\runtime\cac-userscript.user.js`
- Current public v220/v221 candidates are compact API candidates. Treat them as API test candidates only, not UI-complete releases.
- Keep exactly one CAC userscript enabled in a browser profile during runtime tests.

## UI Goals

- Preserve existing complex functionality: panel, settings, prompt presets, scope controls, diagnostics, guarded artifact download controls, safety status, manual operator actions, and copy/export helpers.
- Improve appearance without changing safety semantics: clearer hierarchy, tighter spacing, consistent iconography, readable typography, accessible colors, focus states, and reduced visual noise.
- Improve interaction quality: predictable collapsed/expanded states, obvious enabled/blocked reasons, safer primary actions, keyboard accessibility, tooltips for dense controls, and visible feedback for copy/export/test actions.
- Add UI parity smoke: panel visible, core controls present, disabled/blocked states clear, no overlapping text, no broken labels, no accidental real action buttons enabled by default.

## Open-Source Reuse

- Prefer mature OSS UI assets and patterns after a focused research pass, but do not add a heavy build stack unless it clearly pays for itself.
- Good candidate categories for WebAI/design outsourcing:
  - icon set for dense controls
  - lightweight CSS/token system
  - accessible tooltip/popover patterns
  - panel layout and segmented-control patterns
  - visual QA checklist for browser userscripts
- Any borrowed asset must have license recorded and version/source pinned in the package.

## Architecture Direction

Short term:

- Keep a single Tampermonkey userscript for install/update reliability.
- Refactor internally into clear modules or sections:
  - `ui`: rendering, layout, styles, interaction state
  - `controller`: safe commands, gates, receipts, lease logic
  - `runtime-api`: `window.__cgptAutoContinueAPI`
  - `storage`: settings, prompt library, UI state
  - `adapters`: ChatGPT DOM, WebAI/Codex handoff, artifact candidates

Medium term:

- Use a thin UI layer over a stable controller/API contract.
- Allow WebAI/Codex to test via API without parsing panel text.
- Allow humans to operate through the panel without needing DevTools/API knowledge.

Long term:

- Consider frontend/backend separation only when it reduces real complexity:
  - userscript as page adapter and UI host
  - local service or extension backend for version management, logs, packaging, and multi-page orchestration
  - optional external web UI for dashboards/history
- Do not move secrets, cookies, or private page data into UI or logs.

## Outsourcing Packet Requirements

When sending this to WebAI/SubA, ask for a complete deliverable, not loose patch fragments:

- UI audit of the existing 1.3 MB full UI script.
- Component inventory and interaction map.
- Low-risk visual refresh plan preserving all existing controls.
- Exact patch or replacement files with before/after screenshots if possible.
- UI parity smoke checklist and accessibility checklist.
- Explicit list of unchanged safety gates.

Reject deliverables that:

- replace the full panel with a mini status widget;
- drop prompt presets, scope controls, diagnostics, artifact controls, or manual operator flows without justification;
- enable real Continue, artifact download, prompt submit, unattended behavior, or broad all-tabs behavior by default;
- provide vague design suggestions without exact implementation artifacts.
