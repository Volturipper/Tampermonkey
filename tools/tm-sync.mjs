#!/usr/bin/env node
import crypto from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const META_START = "// ==UserScript==";
const META_END = "// ==/UserScript==";

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function detectEol(content) {
  return content.includes("\r\n") ? "\r\n" : "\n";
}

function metadataLine(key, value) {
  return `// @${key.padEnd(12)} ${value}`;
}

function parseMetadata(content) {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === META_START);
  const end = lines.findIndex((line, index) => {
    return index > start && line.trim() === META_END;
  });

  if (start === -1 || end === -1) {
    throw new Error("missing userscript metadata block");
  }

  const entries = [];
  for (let index = start + 1; index < end; index += 1) {
    const match = lines[index].match(/^\s*\/\/\s*@([^\s]+)\s*(.*)$/);
    if (match) {
      entries.push({
        key: match[1],
        value: match[2].trim(),
        index,
      });
    }
  }

  return {
    start,
    end,
    entries,
    get(key) {
      return entries.find((entry) => entry.key === key)?.value;
    },
  };
}

function setMetadataValue(content, key, value) {
  const eol = detectEol(content);
  const lines = content.split(/\r?\n/);
  const metadata = parseMetadata(content);
  let end = metadata.end;
  let replaced = false;

  for (let index = metadata.start + 1; index < end; index += 1) {
    const match = lines[index].match(/^\s*\/\/\s*@([^\s]+)\s*(.*)$/);
    if (!match || match[1] !== key) {
      continue;
    }

    if (!replaced) {
      lines[index] = metadataLine(key, value);
      replaced = true;
    } else {
      lines.splice(index, 1);
      index -= 1;
      end -= 1;
    }
  }

  if (!replaced) {
    lines.splice(end, 0, metadataLine(key, value));
  }

  return lines.join(eol);
}

async function walkUserScripts(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) {
      continue;
    }

    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkUserScripts(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith(".user.js")) {
      files.push(entryPath);
    }
  }

  return files;
}

export async function discoverScripts(root = process.cwd()) {
  const workspaceRoot = path.resolve(root);
  const scriptsRoot = path.join(workspaceRoot, "scripts");
  const files = await walkUserScripts(scriptsRoot);

  return files
    .map((filePath) => {
      const relativePath = toPosixPath(path.relative(workspaceRoot, filePath));
      const fromScripts = toPosixPath(path.relative(scriptsRoot, filePath));
      const parts = fromScripts.split("/");
      const id =
        parts.length > 1
          ? parts[0]
          : path.basename(filePath, path.extname(filePath));

      return {
        id,
        path: filePath,
        relativePath,
        fileName: path.basename(filePath),
      };
    })
    .sort((a, b) => {
      return a.id.localeCompare(b.id) || a.relativePath.localeCompare(b.relativePath);
    });
}

function bumpVersion(version, bump) {
  if (/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(bump)) {
    return bump;
  }

  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`cannot ${bump} bump non-semver version "${version}"`);
  }

  const [major, minor, patch] = match.slice(1).map(Number);
  if (bump === "major") {
    return `${major + 1}.0.0`;
  }
  if (bump === "minor") {
    return `${major}.${minor + 1}.0`;
  }
  if (bump === "patch") {
    return `${major}.${minor}.${patch + 1}`;
  }

  throw new Error(`unknown bump "${bump}"`);
}

async function findScript(root, id) {
  const matches = (await discoverScripts(root)).filter((script) => script.id === id);
  if (matches.length === 0) {
    throw new Error(`userscript "${id}" was not found`);
  }
  if (matches.length > 1) {
    throw new Error(`userscript id "${id}" is ambiguous`);
  }
  return matches[0];
}

export async function bumpScriptVersion(root, id, bump = "patch") {
  const script = await findScript(root, id);
  const content = await readFile(script.path, "utf8");
  const metadata = parseMetadata(content);
  const previousVersion = metadata.get("version");

  if (!previousVersion) {
    throw new Error(`${script.relativePath} is missing @version`);
  }

  const version = bumpVersion(previousVersion, bump);
  await writeFile(script.path, setMetadataValue(content, "version", version), "utf8");

  return {
    ...script,
    previousVersion,
    version,
  };
}

function buildRawBase({ repo, branch = "main", rawBase }) {
  if (rawBase) {
    return rawBase.replace(/\/$/, "");
  }
  if (!repo || !/^[^/\s]+\/[^/\s]+$/.test(repo)) {
    throw new Error("sync-urls requires --repo owner/repo or --raw-base URL");
  }
  return `https://raw.githubusercontent.com/${repo}/${branch}`.replace(/\/$/, "");
}

async function loadConfig(root) {
  const configPath = path.join(path.resolve(root), "tampermonkey.config.json");
  try {
    return JSON.parse(await readFile(configPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw new Error(`failed to read tampermonkey.config.json: ${error.message}`);
  }
}

function buildScriptUrl(rawBase, relativePath) {
  return `${rawBase}/${relativePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

function titleFromId(id) {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function validateScriptId(id) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error("script id must use lowercase letters, digits, and hyphens");
  }
}

function renderUserscript(metadata) {
  const lines = [
    META_START,
    metadataLine("name", metadata.name),
    metadataLine("namespace", metadata.namespace),
    metadataLine("version", metadata.version),
    metadataLine("description", metadata.description),
    metadataLine("match", metadata.match),
    metadataLine("grant", metadata.grant),
  ];

  if (metadata.updateURL) {
    lines.push(metadataLine("updateURL", metadata.updateURL));
  }
  if (metadata.downloadURL) {
    lines.push(metadataLine("downloadURL", metadata.downloadURL));
  }

  lines.push(
    META_END,
    "",
    "(() => {",
    '  "use strict";',
    "",
    "})();",
    "",
  );

  return lines.join("\n");
}

export async function createScript(root = process.cwd(), id, options = {}) {
  validateScriptId(id);

  const workspaceRoot = path.resolve(root);
  const scriptPath = path.join(workspaceRoot, "scripts", id, `${id}.user.js`);
  const relativePath = toPosixPath(path.relative(workspaceRoot, scriptPath));

  if (await fileExists(scriptPath)) {
    throw new Error(`${relativePath} already exists`);
  }

  const config = await loadConfig(root);
  const repo = options.repo ?? config.repo;
  const branch = options.branch ?? config.branch ?? "main";
  const rawBase = options.rawBase ?? config.rawBase;
  let scriptUrl;
  if (repo || rawBase) {
    scriptUrl = buildScriptUrl(buildRawBase({ repo, branch, rawBase }), relativePath);
  }

  await mkdir(path.dirname(scriptPath), { recursive: true });
  await writeFile(
    scriptPath,
    renderUserscript({
      name: options.name ?? titleFromId(id),
      namespace:
        options.namespace ??
        (repo ? `https://github.com/${repo}` : "https://github.com/Volturipper/Tampermonkey"),
      version: options.version ?? "0.1.0",
      description: options.description ?? "Tampermonkey userscript.",
      match: options.match ?? "*://*/*",
      grant: options.grant ?? "none",
      updateURL: scriptUrl,
      downloadURL: scriptUrl,
    }),
    "utf8",
  );

  return {
    id,
    path: scriptPath,
    relativePath,
    fileName: path.basename(scriptPath),
  };
}

export async function syncScriptUrls(root = process.cwd(), options = {}) {
  const config = await loadConfig(root);
  const rawBase = buildRawBase({
    repo: options.repo ?? config.repo,
    branch: options.branch ?? config.branch ?? "main",
    rawBase: options.rawBase ?? config.rawBase,
  });
  const scripts = await discoverScripts(root);
  const results = [];

  for (const script of scripts) {
    const url = buildScriptUrl(rawBase, script.relativePath);
    let content = await readFile(script.path, "utf8");
    content = setMetadataValue(content, "updateURL", url);
    content = setMetadataValue(content, "downloadURL", url);
    await writeFile(script.path, content, "utf8");

    results.push({
      ...script,
      updateURL: url,
      downloadURL: url,
    });
  }

  return results;
}

function issue(code, message) {
  return { code, message };
}

function sha256(content) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

export async function checkScripts(root = process.cwd()) {
  const scripts = await discoverScripts(root);
  const reports = [];

  for (const script of scripts) {
    const issues = [];
    let metadata;

    try {
      metadata = parseMetadata(await readFile(script.path, "utf8"));
    } catch (error) {
      reports.push({
        ...script,
        issues: [issue("metadata-block", error.message)],
      });
      continue;
    }

    for (const key of ["name", "namespace", "version"]) {
      if (!metadata.get(key)) {
        issues.push(issue(`missing-${key}`, `missing @${key}`));
      }
    }

    const version = metadata.get("version");
    if (version && !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
      issues.push(issue("invalid-version", "@version should use x.y.z semver"));
    }

    for (const key of ["updateURL", "downloadURL"]) {
      const value = metadata.get(key);
      if (!value) {
        issues.push(issue(`missing-${key}`, `missing @${key}`));
      } else if (!/^https?:\/\//.test(value)) {
        issues.push(issue(`invalid-${key}`, `@${key} should be an http(s) URL`));
      }
    }

    reports.push({
      ...script,
      issues,
    });
  }

  const scriptsRootExists = await fileExists(path.join(path.resolve(root), "scripts"));
  return {
    ok: scriptsRootExists && scripts.length > 0 && reports.every((script) => script.issues.length === 0),
    scripts: reports,
  };
}

async function fetchText(url, { fetchImpl, timeoutMs }) {
  const init = {};
  if (fetchImpl === fetch && typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
    init.signal = AbortSignal.timeout(timeoutMs);
  }

  const response = await fetchImpl(url, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

export async function checkRawUrls(root = process.cwd(), options = {}) {
  const scripts = await discoverScripts(root);
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = Number(options.timeoutMs ?? 20000);
  const reports = [];

  for (const script of scripts) {
    const issues = [];
    const localContent = await readFile(script.path, "utf8");
    let localMetadata;

    try {
      localMetadata = parseMetadata(localContent);
    } catch (error) {
      reports.push({
        ...script,
        ok: false,
        issues: [issue("metadata-block", error.message)],
        urls: [],
      });
      continue;
    }

    const localVersion = localMetadata.get("version") || "";
    const updateURL = localMetadata.get("updateURL") || "";
    const downloadURL = localMetadata.get("downloadURL") || "";
    const urls = [
      ["updateURL", updateURL],
      ["downloadURL", downloadURL],
    ].filter(([, value]) => value);

    for (const key of ["updateURL", "downloadURL"]) {
      const value = localMetadata.get(key);
      if (!value) {
        issues.push(issue(`missing-${key}`, `missing @${key}`));
      } else if (!/^https?:\/\//.test(value)) {
        issues.push(issue(`invalid-${key}`, `@${key} should be an http(s) URL`));
      }
    }

    if (updateURL && downloadURL && updateURL !== downloadURL) {
      issues.push(issue("raw-url-mismatch", "@updateURL and @downloadURL should point to the same raw script for simple update checks"));
    }

    const fetched = [];
    const seen = new Map();
    for (const [key, url] of urls) {
      if (seen.has(url)) {
        fetched.push({ key, url, ...seen.get(url) });
        continue;
      }

      try {
        const remoteContent = await fetchText(url, { fetchImpl, timeoutMs });
        const remoteMetadata = parseMetadata(remoteContent);
        const remoteVersion = remoteMetadata.get("version") || "";
        const item = {
          ok: true,
          version: remoteVersion,
          sha256: sha256(remoteContent),
          bytes: Buffer.byteLength(remoteContent, "utf8"),
        };
        seen.set(url, item);
        fetched.push({ key, url, ...item });

        if (localVersion && remoteVersion !== localVersion) {
          issues.push(issue("remote-version-mismatch", `${key} version ${remoteVersion || "<missing>"} does not match local ${localVersion}`));
        }
      } catch (error) {
        const item = {
          ok: false,
          error: error.message,
        };
        seen.set(url, item);
        fetched.push({ key, url, ...item });
        issues.push(issue(`fetch-${key}`, `${url}: ${error.message}`));
      }
    }

    reports.push({
      ...script,
      ok: issues.length === 0,
      version: localVersion,
      urls: fetched,
      issues,
    });
  }

  return {
    ok: scripts.length > 0 && reports.every((script) => script.ok),
    scripts: reports,
  };
}

function parseOptions(args) {
  const options = {};
  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
    const value = inlineValue ?? args[index + 1];
    if (inlineValue === undefined) {
      index += 1;
    }
    options[rawKey] = value;
  }

  return { options, positional };
}

function printHelp() {
  console.log(`Tampermonkey script collection helper

Usage:
  node tools/tm-sync.mjs list
  node tools/tm-sync.mjs check
  node tools/tm-sync.mjs new <script-id> [--name "Script Name"] [--match URL]
  node tools/tm-sync.mjs bump <script-id> [patch|minor|major|x.y.z]
  node tools/tm-sync.mjs sync-urls --repo <owner/repo> [--branch main]
  node tools/tm-sync.mjs sync-urls --raw-base <https://raw.example/base>
  node tools/tm-sync.mjs raw-check
`);
}

async function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  const root = process.cwd();

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "list") {
    const scripts = await discoverScripts(root);
    for (const script of scripts) {
      console.log(`${script.id}\t${script.relativePath}`);
    }
    return;
  }

  if (command === "check") {
    const report = await checkScripts(root);
    if (report.scripts.length === 0) {
      console.error("No userscripts found under scripts/");
    }
    for (const script of report.scripts) {
      if (script.issues.length === 0) {
        console.log(`ok ${script.relativePath}`);
      } else {
        for (const item of script.issues) {
          console.error(`${script.relativePath}: ${item.code}: ${item.message}`);
        }
      }
    }
    process.exitCode = report.ok ? 0 : 1;
    return;
  }

  if (command === "raw-check") {
    const report = await checkRawUrls(root);
    if (report.scripts.length === 0) {
      console.error("No userscripts found under scripts/");
    }
    for (const script of report.scripts) {
      if (script.issues.length === 0) {
        const first = script.urls.find((item) => item.ok);
        console.log(`ok ${script.relativePath} version=${first?.version || script.version} sha256=${first?.sha256 || ""}`);
      } else {
        for (const item of script.issues) {
          console.error(`${script.relativePath}: ${item.code}: ${item.message}`);
        }
      }
    }
    process.exitCode = report.ok ? 0 : 1;
    return;
  }

  if (command === "bump") {
    const [id, bump = "patch"] = rest;
    if (!id) {
      throw new Error("bump requires <script-id>");
    }
    const result = await bumpScriptVersion(root, id, bump);
    console.log(`${result.id}: ${result.previousVersion} -> ${result.version}`);
    return;
  }

  if (command === "new") {
    const { options, positional } = parseOptions(rest);
    const [id] = positional;
    if (!id) {
      throw new Error("new requires <script-id>");
    }
    const result = await createScript(root, id, {
      name: options.name,
      namespace: options.namespace,
      version: options.version,
      description: options.description,
      match: options.match,
      grant: options.grant,
      repo: options.repo,
      branch: options.branch,
      rawBase: options["raw-base"],
    });
    console.log(`created ${result.relativePath}`);
    return;
  }

  if (command === "sync-urls") {
    const { options } = parseOptions(rest);
    const results = await syncScriptUrls(root, {
      repo: options.repo,
      branch: options.branch,
      rawBase: options["raw-base"],
    });
    for (const result of results) {
      console.log(`${result.id}: ${result.updateURL}`);
    }
    return;
  }

  throw new Error(`unknown command "${command}"`);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
