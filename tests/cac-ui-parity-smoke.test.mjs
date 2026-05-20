import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runUiParitySmoke } from "../tools/cac-ui-parity-smoke.mjs";

async function writeRuntime(content) {
  const root = await mkdir(path.join(os.tmpdir(), "cac-ui-smoke-"), { recursive: true }).then(async () => {
    const { mkdtemp } = await import("node:fs/promises");
    return mkdtemp(path.join(os.tmpdir(), "cac-ui-smoke-"));
  });
  const filePath = path.join(root, "runtime.user.js");
  await writeFile(filePath, content, "utf8");
  return filePath;
}

function fullFixture() {
  return `// ==UserScript==
// @name CAC
// @version 1
// @match https://chatgpt.com/c/69fb92be-976c-83a6-9703-84ba859e4a06*
// ==/UserScript==
const PANEL_ID = 'cgpt-auto-continue-panel-v83';
const x = 'togglePanel panelCollapsed setPanelCollapsed ac-only-this ac-allow-all ac-pause-this PROMPT_PRESET prompt library Copy diagnostics diagnostics artifactAutoDownloadEnabled Download newest manual guarded artifact continueNow dryRunContinue __cgptAutoContinueAPI selfIterationPacket apiSummary statusSummary';
const config = { artifactAutoDownloadEnabled: false, promptSubmitEnabled: false, unattendedOperationEnabled: false, productionInstallEnabled: false };
${"/* filler */\n".repeat(50)}`;
}

test("passes static UI parity markers and warns on missing update metadata", async () => {
  const source = await writeRuntime(fullFixture());
  const result = await runUiParitySmoke({ source, minBytes: 100 });

  assert.equal(result.ok, true);
  assert.equal(result.decision, "PASS_STATIC_UI_PARITY_CANDIDATE");
  assert.deepEqual(result.failures, []);
  assert.deepEqual(result.warnings, ["update_url_present", "download_url_present"]);
});

test("fails when candidate is too small or lacks panel markers", async () => {
  const source = await writeRuntime(`// ==UserScript==
// @match https://chatgpt.com/*
// ==/UserScript==
const config = {};
`);
  const result = await runUiParitySmoke({ source, minBytes: 100 });

  assert.equal(result.ok, false);
  assert.ok(result.failures.includes("full_ui_scale"));
  assert.ok(result.failures.includes("dedicated_match"));
  assert.ok(result.failures.includes("panel_runtime_markers"));
});
