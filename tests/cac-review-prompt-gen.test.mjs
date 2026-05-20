import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildReviewPrompt } from "../tools/cac-review-prompt-gen.mjs";

async function makeExtractedPackage() {
  const root = await mkdir(path.join(os.tmpdir(), "cac-review-prompt-"), { recursive: true }).then(async () => {
    const { mkdtemp } = await import("node:fs/promises");
    return mkdtemp(path.join(os.tmpdir(), "cac-review-prompt-"));
  });
  await mkdir(path.join(root, "runtime"), { recursive: true });
  await mkdir(path.join(root, "docs"), { recursive: true });
  await writeFile(path.join(root, "MANIFEST.json"), JSON.stringify({
    version: "v222",
    base_ui_source: "v216-full-ui",
    api_source: "v221-api",
    runtime_sha256: "runtimehash",
  }), "utf8");
  await writeFile(path.join(root, "runtime", "cac-userscript.user.js"), [
    "// ==UserScript==",
    "// @name Test",
    "// @version 1",
    "// @match https://chatgpt.com/c/example*",
    "// ==/UserScript==",
  ].join("\n"), "utf8");
  await writeFile(path.join(root, "docs", "UI_PARITY_CHECKLIST.md"), "- Visible CAC panel is still rendered\n", "utf8");
  await writeFile(path.join(root, "docs", "API_SMOKE_CHECKLIST.md"), "- selfIterationPacket() exists\n", "utf8");
  return root;
}

test("generates a concise review prompt from ledger and extracted manifest", async () => {
  const root = await makeExtractedPackage();
  const entry = {
    id: "v222-ui",
    sourceZip: "D:/Gemini DL/cac-ui-preserving-api-merge-v222-20260512.zip",
    sourceSha256: "ziphash",
    candidateRuntimeScript: path.join(root, "runtime", "cac-userscript.user.js"),
    metadataVersion: "v222",
  };
  const prompt = await buildReviewPrompt({
    ledger: { currentInstalled: { id: "v221", installState: "installed_scoped_single_enabled" } },
    entry,
  });

  assert.match(prompt, /Attached package: `cac-ui-preserving-api-merge-v222-20260512.zip`/);
  assert.match(prompt, /base_ui_source=v216-full-ui/);
  assert.match(prompt, /updateURL=missing/);
  assert.match(prompt, /REVIEW_DECISION: ACCEPT_FOR_LOCAL_UI_API_REVIEW/);
});
