import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateLedger } from "../tools/cac-version-ledger.mjs";

async function makeWorkspace(files) {
  const root = await mkdir(path.join(os.tmpdir(), "cac-ledger-"), {
    recursive: true,
  }).then(async () => {
    const { mkdtemp } = await import("node:fs/promises");
    return mkdtemp(path.join(os.tmpdir(), "cac-ledger-"));
  });

  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(root, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }

  return root;
}

function hash(content) {
  return createHash("sha256").update(content).digest("hex");
}

function ledgerFor(entry) {
  return {
    schema: "cac.version_ledger.v1",
    currentInstalled: {
      id: entry.id,
      rawSha256: entry.rawSha256,
    },
    entries: [entry],
  };
}

test("validates ledger file references and expected hashes", async () => {
  const sourceZipContent = "zip fixture";
  const scriptContent = "userscript fixture";
  const root = await makeWorkspace({
    "packages/candidate.zip": sourceZipContent,
    "scripts/cac/cac.user.js": scriptContent,
  });

  const entry = {
    id: "current",
    kind: "current_public_api_runtime",
    sourceZip: "packages/candidate.zip",
    sourceSha256: hash(sourceZipContent),
    scriptPath: "scripts/cac/cac.user.js",
    rawSha256: hash(scriptContent),
    uiCompleteness: "api_only_not_ui_complete",
    reviewState: "accepted_for_local_api_review",
    installState: "installed_scoped_single_enabled",
  };

  const result = await validateLedger(ledgerFor(entry), { root });

  assert.deepEqual(result.issues, []);
  assert.equal(result.fileChecks.length, 2);
  assert.equal(result.fileChecks.every((check) => check.ok), true);
});

test("reports missing referenced files and hash mismatches", async () => {
  const root = await makeWorkspace({
    "scripts/cac/cac.user.js": "changed script",
  });

  const entry = {
    id: "current",
    kind: "current_public_api_runtime",
    sourceZip: "packages/missing.zip",
    sourceSha256: hash("expected zip"),
    scriptPath: "scripts/cac/cac.user.js",
    rawSha256: hash("expected script"),
    uiCompleteness: "api_only_not_ui_complete",
    reviewState: "accepted_for_local_api_review",
    installState: "installed_scoped_single_enabled",
  };

  const result = await validateLedger(ledgerFor(entry), { root });

  assert.deepEqual(result.issues, [
    "missing_file:current:sourceZip",
    "sha256_mismatch:current:scriptPath",
  ]);
});
