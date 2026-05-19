# Open Source Options

Checked on 2026-05-19.

## Decision

Keep the current no-dependency `tools/tm-sync.mjs` for phase 1. It covers the immediate workspace need: multiple plain `.user.js` files, version bumping, `@updateURL`, `@downloadURL`, and GitHub raw URL sync.

Adopt a mature build tool only when a real script needs modules, TypeScript, CSS imports, frontend framework code, generated metadata, or a dev server. Do not install build dependencies globally; isolate per script folder.

## Candidates

| Tool | Fit | Current signal | Use when |
| --- | --- | --- | --- |
| `vite-plugin-monkey` / `create-monkey` | Best default for modern built userscripts | MIT, npm `vite-plugin-monkey@8.0.5`, GitHub `lisonge/vite-plugin-monkey` about 1975 stars, pushed 2026-05-12 | A script needs TypeScript, ESM imports, CSS handling, HMR, generated metadata, or framework UI |
| `webpack-userscript` | Mature Webpack-specific option | MIT, npm `3.2.3`, GitHub `momocow/webpack-userscript` about 213 stars, pushed 2024-12-23 | A script already uses Webpack or needs its metadata/proxy/dev-server pipeline |
| `rollup-plugin-userscript` | Small Rollup plugin from Violentmonkey org | MIT, npm `1.1.0`, GitHub `violentmonkey/rollup-plugin-userscript` about 20 stars, pushed 2025-11-25 | A lightweight Rollup build is enough and automatic `@grant` collection is valuable |
| `generator-userscript` | Violentmonkey scaffold path | Violentmonkey docs recommend it for modern syntax projects using Babel/Rollup | Starting a standalone modern userscript project and accepting Yeoman/Rollup scaffold |

## Relevant Findings

- Tampermonkey documents `@version`, `@updateURL`, and `@downloadURL` as userscript header keys. That validates making those metadata fields first-class checks in this workspace.
- Violentmonkey docs split userscripts into metadata plus program code, and note that native userscripts are single-file browser-executed JavaScript. That supports keeping plain scripts simple until a build step is justified.
- `vite-plugin-monkey` targets Tampermonkey, Violentmonkey, Greasemonkey, and ScriptCat. It supports Vite features, TypeScript, automatic `@grant`, generated userscript comments, `metaFileName`, and install/preview flows.
- `webpack-userscript` can prepend userscript headers, generate `.meta.js`, resolve `downloadURL` and `updateURL`, validate headers, and support local proxy scripts for Tampermonkey development.
- `rollup-plugin-userscript` focuses on parsing metadata and automatically adding `@grant` for used `GM_*` functions.

## Phase Rule

1. Plain script: keep `scripts/<id>/<id>.user.js` plus `tools/tm-sync.mjs`.
2. Built script: create an isolated package inside `scripts/<id>/`, preferably with `vite-plugin-monkey`.
3. Do not migrate all scripts to a build stack just because one script needs it.

## Sources

- https://www.tampermonkey.net/documentation.php?locale=en
- https://github.com/lisonge/vite-plugin-monkey
- https://www.npmjs.com/package/vite-plugin-monkey
- https://github.com/momocow/webpack-userscript
- https://www.npmjs.com/package/webpack-userscript
- https://github.com/violentmonkey/rollup-plugin-userscript
- https://www.npmjs.com/package/rollup-plugin-userscript
- https://violentmonkey.github.io/guide/creating-a-userscript/
- https://violentmonkey.github.io/guide/using-modern-syntax/
