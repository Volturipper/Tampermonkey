#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER_PATH = path.join(ROOT, "docs", "CAC_VERSION_LEDGER.json");

function parseArgs(argv) {
  return {
    json: argv.includes("--json"),
    strict: argv.includes("--strict"),
    noFileChecks: argv.includes("--no-file-checks"),
    help: argv.includes("--help") || argv.includes("-h"),
  };
}

function usage() {
  console.log(`CAC version ledger

Usage:
  npm run cac:versions
  node tools/cac-version-ledger.mjs --json
  node tools/cac-version-ledger.mjs --strict
  node tools/cac-version-ledger.mjs --no-file-checks
`);
}

function resolveLedgerPath(root, value) {
  if (!value) return "";
  return path.isAbsolute(value) ? value : path.join(root, value);
}

async function sha256(filePath) {
  const hash = createHash("sha256");
  hash.update(await readFile(filePath));
  return hash.digest("hex");
}

async function checkEntryFiles(root, entry) {
  const checks = [];
  const candidates = [
    ["sourceZip", entry.sourceZip, entry.sourceSha256],
    ["localProbeScript", entry.localProbeScript, ""],
    ["scriptPath", entry.scriptPath, entry.rawSha256],
    ["candidateRuntimeScript", entry.candidateRuntimeScript, ""],
  ];

  for (const [key, value, expectedSha256] of candidates) {
    if (!value) continue;
    const filePath = resolveLedgerPath(root, value);
    const check = {
      entryId: entry.id || "<unknown>",
      key,
      path: filePath,
      exists: false,
      sha256: "",
      expectedSha256: expectedSha256 || "",
      ok: false,
    };
    try {
      const info = await stat(filePath);
      check.exists = info.isFile();
      check.bytes = check.exists ? info.size : 0;
      if (check.exists && expectedSha256) check.sha256 = await sha256(filePath);
      check.ok = check.exists && (!expectedSha256 || check.sha256 === expectedSha256);
    } catch {
      check.exists = false;
    }
    checks.push(check);
  }

  return checks;
}

export async function validateLedger(ledger, options = {}) {
  const root = options.root || ROOT;
  const includeFileChecks = options.fileChecks !== false;
  const issues = [];
  if (ledger?.schema !== "cac.version_ledger.v1") issues.push("schema_mismatch");
  if (!ledger?.currentInstalled?.id) issues.push("missing_current_installed");
  const entries = Array.isArray(ledger?.entries) ? ledger.entries : [];
  if (!entries.length) issues.push("no_entries");
  const ids = new Set();
  for (const entry of entries) {
    for (const key of ["id", "kind", "uiCompleteness", "reviewState", "installState"]) {
      if (!entry[key]) issues.push(`missing_${key}:${entry.id || "<unknown>"}`);
    }
    if (ids.has(entry.id)) issues.push(`duplicate_id:${entry.id}`);
    ids.add(entry.id);
  }
  const current = entries.find((entry) => entry.id === ledger?.currentInstalled?.id);
  if (!current) issues.push(`current_not_in_entries:${ledger?.currentInstalled?.id || "<missing>"}`);
  if (
    current?.rawSha256 &&
    ledger?.currentInstalled?.rawSha256 &&
    current.rawSha256 !== ledger.currentInstalled.rawSha256
  ) {
    issues.push(`current_raw_sha256_mismatch:${current.id}`);
  }

  const fileChecks = [];
  if (includeFileChecks) {
    for (const entry of entries) fileChecks.push(...await checkEntryFiles(root, entry));
    for (const check of fileChecks) {
      if (!check.exists) issues.push(`missing_file:${check.entryId}:${check.key}`);
      else if (check.expectedSha256 && check.sha256 !== check.expectedSha256) {
        issues.push(`sha256_mismatch:${check.entryId}:${check.key}`);
      }
    }
  }

  return { issues, fileChecks };
}

function summarize(ledger, result) {
  const { issues, fileChecks } = result;
  const entries = Array.isArray(ledger.entries) ? ledger.entries : [];
  const current = entries.find((entry) => entry.id === ledger.currentInstalled?.id);
  const waiting = entries.filter((entry) => /waiting/i.test(`${entry.reviewState || ""} ${entry.installState || ""}`));
  const uiBaselines = entries.filter((entry) => /^full_/i.test(entry.kind) || /full_panel/i.test(entry.uiCompleteness || ""));
  const installed = entries.filter((entry) => /^installed(?:_|$)/i.test(entry.installState || ""));
  const missingFiles = fileChecks.filter((check) => !check.exists);
  const shaMismatches = fileChecks.filter((check) => check.expectedSha256 && check.exists && check.sha256 !== check.expectedSha256);

  console.log(`CAC_VERSION_LEDGER ${issues.length ? "CHECK" : "OK"}`);
  console.log(`entries=${entries.length} installed=${installed.length} ui_baselines=${uiBaselines.length} waiting=${waiting.length}`);
  if (fileChecks.length) {
    console.log(`file_checks=${fileChecks.length} missing_files=${missingFiles.length} sha256_mismatches=${shaMismatches.length}`);
  }
  console.log(`current=${ledger.currentInstalled?.id || ""}`);
  if (current) {
    console.log(`current_runtime=${current.runtimeVersion || ""}`);
    console.log(`current_ui=${current.uiCompleteness || ""}`);
    console.log(`current_review=${current.reviewState || ""}`);
  }
  if (waiting.length) console.log(`waiting=${waiting.map((entry) => entry.id).join(",")}`);
  if (uiBaselines.length) console.log(`ui_baseline=${uiBaselines.map((entry) => entry.id).join(",")}`);
  if (issues.length) console.log(`issues=${issues.join(",")}`);
  console.log(`ledger=${LEDGER_PATH}`);
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    usage();
    return;
  }

  const ledger = JSON.parse(await readFile(LEDGER_PATH, "utf8"));
  const result = await validateLedger(ledger, { fileChecks: !args.noFileChecks });
  if (args.json) {
    console.log(JSON.stringify({ ok: result.issues.length === 0, ...result, ledger }, null, 2));
  } else {
    summarize(ledger, result);
  }
  if (args.strict && result.issues.length) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message || String(error));
    process.exitCode = 1;
  });
}
