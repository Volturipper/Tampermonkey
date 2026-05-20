#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER_PATH = path.join(ROOT, "docs", "CAC_VERSION_LEDGER.json");
const DEDICATED_RUNTIME_PREFIX = "https://chatgpt.com/c/69fb92be-976c-83a6-9703-84ba859e4a06";

function parseArgs(argv) {
  const args = {
    id: "",
    packageName: "",
    source: "",
    json: argv.includes("--json"),
    minBytes: 500000,
    help: argv.includes("--help") || argv.includes("-h"),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index] || "";
    if (arg === "--id") args.id = next();
    else if (arg.startsWith("--id=")) args.id = arg.slice("--id=".length);
    else if (arg === "--package") args.packageName = next();
    else if (arg.startsWith("--package=")) args.packageName = arg.slice("--package=".length);
    else if (arg === "--source") args.source = next();
    else if (arg.startsWith("--source=")) args.source = arg.slice("--source=".length);
    else if (arg === "--min-bytes") args.minBytes = Number(next()) || args.minBytes;
    else if (arg.startsWith("--min-bytes=")) args.minBytes = Number(arg.slice("--min-bytes=".length)) || args.minBytes;
  }
  return args;
}

function usage() {
  console.log(`CAC UI parity smoke

Usage:
  npm run cac:ui-smoke
  node tools/cac-ui-parity-smoke.mjs --id v222-ui-preserving-api-merge-candidate.1
  node tools/cac-ui-parity-smoke.mjs --source D:\\path\\runtime\\cac-userscript.user.js

Static, read-only smoke. It does not open the browser, install userscripts,
click Continue, submit prompts, or download artifacts.
`);
}

function metadataValues(content, key) {
  const values = [];
  const re = new RegExp(`^\\s*//\\s*@${key}\\s+(.+)$`, "gmi");
  let match;
  while ((match = re.exec(content))) values.push(match[1].trim());
  return values;
}

function hasAny(content, patterns) {
  return patterns.some((pattern) => {
    if (pattern instanceof RegExp) return pattern.test(content);
    return content.includes(pattern);
  });
}

function check(id, pass, detail, severity = "fail") {
  return { id, pass: Boolean(pass), severity, detail };
}

async function selectEntry(args, ledgerPath = LEDGER_PATH) {
  if (args.source) return { entry: null, source: path.resolve(args.source), ledger: null };
  const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
  const entries = Array.isArray(ledger.entries) ? ledger.entries : [];
  const entry = args.id
    ? entries.find((item) => item.id === args.id)
    : args.packageName
      ? entries.find((item) => path.basename(item.sourceZip || "") === args.packageName)
      : entries.find((item) => /waiting/i.test(`${item.reviewState || ""} ${item.installState || ""}`));
  if (!entry) throw new Error("No CAC candidate entry selected");
  if (!entry.candidateRuntimeScript) throw new Error(`Selected entry has no candidateRuntimeScript: ${entry.id}`);
  return { entry, source: entry.candidateRuntimeScript, ledger };
}

export async function runUiParitySmoke(options = {}) {
  const args = {
    id: options.id || "",
    packageName: options.packageName || "",
    source: options.source || "",
    minBytes: options.minBytes || 500000,
  };
  const selected = options.entry && options.source
    ? { entry: options.entry, source: options.source, ledger: options.ledger || null }
    : await selectEntry(args, options.ledgerPath || LEDGER_PATH);
  const info = await stat(selected.source);
  const content = await readFile(selected.source, "utf8");
  const matches = metadataValues(content, "match");
  const includes = metadataValues(content, "include");
  const updateUrls = metadataValues(content, "updateURL");
  const downloadUrls = metadataValues(content, "downloadURL");

  const checks = [
    check("full_ui_scale", info.size >= args.minBytes, `bytes=${info.size}; min=${args.minBytes}`),
    check("dedicated_match", matches.some((value) => value.startsWith(DEDICATED_RUNTIME_PREFIX)), matches.join(",") || "no @match"),
    check("no_broad_include", includes.length === 0, includes.join(",") || "no @include"),
    check("no_broad_chatgpt_match", !matches.some((value) => /^https:\/\/chatgpt\.com\/\*$/.test(value) || /^https:\/\/chatgpt\.com\/\*/.test(value)), matches.join(",") || "no @match"),
    check("panel_runtime_markers", hasAny(content, ["PANEL_ID", "cgpt-auto-continue-panel", "panelCollapsed"]), "panel id/state markers"),
    check("panel_open_collapse", hasAny(content, ["togglePanel", "panelCollapsed", "setPanelCollapsed"]), "open/collapse markers"),
    check("scope_controls", hasAny(content, ["ac-only-this", "ac-allow-all", "ac-pause-this", "Only this chat", "Allow all", "Pause this chat"]), "scope control markers"),
    check("prompt_library", hasAny(content, ["PROMPT_PRESET", "prompt library", "promptPreset", "Prompt preset"]), "prompt library markers"),
    check("diagnostics_helpers", hasAny(content, ["Copy diagnostics", "diagnostics", "copyDiagnostics", "health summary"]), "diagnostic/copy markers"),
    check("artifact_controls", hasAny(content, ["artifactAutoDownloadEnabled", "Download newest", "artifact download"]), "artifact control markers"),
    check("manual_operator_actions", hasAny(content, ["manual guarded artifact", "continueNow", "dryRunContinue"]), "manual/supervised action markers"),
    check("api_bridge", hasAny(content, ["__cgptAutoContinueAPI", "selfIterationPacket", "apiSummary", "statusSummary"]), "API bridge markers"),
    check("safe_default_artifact_off", hasAny(content, ["artifactAutoDownloadEnabled: false", "artifactAutoDownloadEnabled = false"]), "artifact auto-download off"),
    check("safe_default_prompt_submit_off", hasAny(content, ["promptSubmitEnabled: false", "promptSubmitEnabled = false"]), "prompt submit off"),
    check("safe_default_unattended_off", hasAny(content, ["unattendedOperationEnabled: false", "unattendedOperationEnabled = false"]), "unattended off"),
    check("safe_default_production_off", hasAny(content, ["productionInstallEnabled: false", "productionInstallEnabled = false"]), "production off"),
    check("missing_update_url", updateUrls.length > 0, updateUrls.join(",") || "missing @updateURL", "warn"),
    check("missing_download_url", downloadUrls.length > 0, downloadUrls.join(",") || "missing @downloadURL", "warn"),
  ];

  const failures = checks.filter((item) => !item.pass && item.severity === "fail");
  const warnings = checks.filter((item) => !item.pass && item.severity === "warn");
  return {
    ok: failures.length === 0,
    decision: failures.length ? "NEEDS_CHANGES_STATIC_UI_PARITY" : "PASS_STATIC_UI_PARITY_CANDIDATE",
    entryId: selected.entry?.id || "",
    source: selected.source,
    bytes: info.size,
    checks,
    failures: failures.map((item) => item.id),
    warnings: warnings.map((item) => item.id),
    safety: {
      readOnly: true,
      noBrowserControl: true,
      noInstall: true,
      noPromptSubmit: true,
      noDownloads: true,
      noSecrets: true,
    },
  };
}

function printCompact(result) {
  console.log(`CAC_UI_PARITY_SMOKE ${result.ok ? "PASS" : "CHECK"}`);
  console.log(`decision=${result.decision}`);
  console.log(`entry=${result.entryId || "source"}`);
  console.log(`bytes=${result.bytes}`);
  console.log(`failures=${result.failures.join(",") || "none"}`);
  console.log(`warnings=${result.warnings.join(",") || "none"}`);
  console.log(`source=${result.source}`);
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    usage();
    return;
  }
  const result = await runUiParitySmoke(args);
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else printCompact(result);
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message || String(error));
    process.exitCode = 1;
  });
}
