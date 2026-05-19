# Tampermonkey Workspace

This workspace is a collection for multiple Tampermonkey userscripts.

## Layout

- `scripts/<script-id>/<script-id>.user.js`: one script project per folder.
- `tools/tm-sync.mjs`: no-dependency version and update URL helper.
- `skills/tampermonkey-collection/`: project-specific reusable Codex skill.
- `docs/TODO.md` and `docs/HANDOFF.md`: only durable decisions and next steps.

## Common Commands

```powershell
npm test
npm run tm:list
npm run tm:check
npm run tm:bump -- example-versioned patch
npm run tm:sync-urls -- --repo OWNER/REPO --branch main
```

`tm:sync-urls` writes both `@updateURL` and `@downloadURL` to GitHub raw URLs. It also reads `tampermonkey.config.json` when present; keep `tampermonkey.config.example.json` as the tracked template.

## Git Decision

Use Git for this workspace. Tampermonkey update checks depend on stable, versioned script URLs, so Git history plus GitHub raw URLs are the lowest-friction local/cloud sync path.

Do not create a remote blindly. For unauthenticated cross-browser update URLs, use a public GitHub repo or another public raw file host. Private GitHub raw URLs can fail from browser extension update checks.

Suggested first remote command after choosing visibility:

```powershell
gh repo create Volturipper/Tampermonkey --public --source . --remote origin --push
```

## Browser Testing

Prefer the dedicated Chrome Dev CDP profile:

```powershell
D:\Codex\CHROME_DEV_CDP_9333.cmd --status
D:\Codex\CHROME_DEV_CDP_9333.cmd
```

Use proxy only when network access needs it:

```powershell
$env:HTTPS_PROXY = "http://127.0.0.1:7897"
$env:HTTP_PROXY = "http://127.0.0.1:7897"
```
