import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  bumpScriptVersion,
  checkScripts,
  createScript,
  discoverScripts,
  syncScriptUrls,
} from "../tools/tm-sync.mjs";

async function makeWorkspace(files) {
  const root = await mkdir(path.join(os.tmpdir(), "tm-sync-"), {
    recursive: true,
  }).then(async () => {
    const dir = await import("node:fs/promises").then(({ mkdtemp }) =>
      mkdtemp(path.join(os.tmpdir(), "tm-sync-")),
    );
    return dir;
  });

  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(root, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }

  return root;
}

const baseUserscript = `// ==UserScript==
// @name         Example Script
// @namespace    https://example.test/tampermonkey
// @version      1.2.3
// @description  Fixture
// @match        https://example.test/*
// @grant        none
// ==/UserScript==

console.log("example");
`;

test("discovers userscripts by folder id", async () => {
  const root = await makeWorkspace({
    "scripts/example/example.user.js": baseUserscript,
    "scripts/other/other.user.js": baseUserscript.replace(
      "Example Script",
      "Other Script",
    ),
  });

  const scripts = await discoverScripts(root);

  assert.deepEqual(
    scripts.map((script) => [script.id, script.relativePath]),
    [
      ["example", "scripts/example/example.user.js"],
      ["other", "scripts/other/other.user.js"],
    ],
  );
});

test("bumps one script version without touching other metadata", async () => {
  const root = await makeWorkspace({
    "scripts/example/example.user.js": baseUserscript,
  });

  const result = await bumpScriptVersion(root, "example", "patch");
  const updated = await readFile(
    path.join(root, "scripts/example/example.user.js"),
    "utf8",
  );

  assert.equal(result.previousVersion, "1.2.3");
  assert.equal(result.version, "1.2.4");
  assert.match(updated, /@version\s+1\.2\.4/);
  assert.match(updated, /@match\s+https:\/\/example\.test\/\*/);
});

test("syncs updateURL and downloadURL for GitHub raw scripts", async () => {
  const root = await makeWorkspace({
    "scripts/example/example.user.js": baseUserscript,
  });

  const [result] = await syncScriptUrls(root, {
    repo: "owner/tampermonkey-scripts",
    branch: "main",
  });
  const updated = await readFile(result.path, "utf8");

  const expectedUrl =
    "https://raw.githubusercontent.com/owner/tampermonkey-scripts/main/scripts/example/example.user.js";

  assert.equal(result.updateURL, expectedUrl);
  assert.match(updated, new RegExp(`// @updateURL\\s+${expectedUrl}`));
  assert.match(updated, new RegExp(`// @downloadURL\\s+${expectedUrl}`));
});

test("syncs URLs from tampermonkey.config.json when no repo is passed", async () => {
  const root = await makeWorkspace({
    "tampermonkey.config.json": JSON.stringify({
      repo: "owner/from-config",
      branch: "stable",
    }),
    "scripts/example/example.user.js": baseUserscript,
  });

  const [result] = await syncScriptUrls(root);

  assert.equal(
    result.updateURL,
    "https://raw.githubusercontent.com/owner/from-config/stable/scripts/example/example.user.js",
  );
});

test("check reports missing update metadata as actionable issues", async () => {
  const root = await makeWorkspace({
    "scripts/example/example.user.js": baseUserscript,
  });

  const report = await checkScripts(root);

  assert.equal(report.ok, false);
  assert.deepEqual(
    report.scripts[0].issues.map((issue) => issue.code),
    ["missing-updateURL", "missing-downloadURL"],
  );
});

test("creates a new userscript with update URLs from config", async () => {
  const root = await makeWorkspace({
    "tampermonkey.config.json": JSON.stringify({
      repo: "owner/from-config",
      branch: "main",
    }),
  });

  const result = await createScript(root, "quick-note", {
    name: "Quick Note",
    match: "https://example.test/*",
  });
  const content = await readFile(result.path, "utf8");

  assert.equal(result.relativePath, "scripts/quick-note/quick-note.user.js");
  assert.match(content, /@name\s+Quick Note/);
  assert.match(content, /@namespace\s+https:\/\/github\.com\/owner\/from-config/);
  assert.match(content, /@version\s+0\.1\.0/);
  assert.match(content, /@match\s+https:\/\/example\.test\/\*/);
  assert.match(
    content,
    /@updateURL\s+https:\/\/raw\.githubusercontent\.com\/owner\/from-config\/main\/scripts\/quick-note\/quick-note\.user\.js/,
  );
  assert.match(
    content,
    /@downloadURL\s+https:\/\/raw\.githubusercontent\.com\/owner\/from-config\/main\/scripts\/quick-note\/quick-note\.user\.js/,
  );
});

test("does not overwrite an existing userscript", async () => {
  const root = await makeWorkspace({
    "scripts/example/example.user.js": baseUserscript,
  });

  await assert.rejects(
    () => createScript(root, "example"),
    /already exists/,
  );
});
