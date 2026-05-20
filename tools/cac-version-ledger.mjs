#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER_PATH = path.join(ROOT, "docs", "CAC_VERSION_LEDGER.json");

function parseArgs(argv) {
  return {
    json: argv.includes("--json"),
    strict: argv.includes("--strict"),
    help: argv.includes("--help") || argv.includes("-h"),
  };
}

function usage() {
  console.log(`CAC version ledger

Usage:
  npm run cac:versions
  node tools/cac-version-ledger.mjs --json
  node tools/cac-version-ledger.mjs --strict
`);
}

function validateLedger(ledger) {
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
  return issues;
}

function summarize(ledger, issues) {
  const entries = Array.isArray(ledger.entries) ? ledger.entries : [];
  const current = entries.find((entry) => entry.id === ledger.currentInstalled?.id);
  const waiting = entries.filter((entry) => /waiting/i.test(`${entry.reviewState || ""} ${entry.installState || ""}`));
  const uiBaselines = entries.filter((entry) => /^full_/i.test(entry.kind) || /full_panel/i.test(entry.uiCompleteness || ""));
  const installed = entries.filter((entry) => /^installed(?:_|$)/i.test(entry.installState || ""));

  console.log(`CAC_VERSION_LEDGER ${issues.length ? "CHECK" : "OK"}`);
  console.log(`entries=${entries.length} installed=${installed.length} ui_baselines=${uiBaselines.length} waiting=${waiting.length}`);
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
  const issues = validateLedger(ledger);
  if (args.json) {
    console.log(JSON.stringify({ ok: issues.length === 0, issues, ledger }, null, 2));
  } else {
    summarize(ledger, issues);
  }
  if (args.strict && issues.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exitCode = 1;
});
