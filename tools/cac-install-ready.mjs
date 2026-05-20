#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildLaneStatus } from "./cac-lane-status.mjs";
import { runUiParitySmoke } from "./cac-ui-parity-smoke.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER_PATH = path.join(ROOT, "docs", "CAC_VERSION_LEDGER.json");

function parseArgs(argv) {
  const args = {
    id: "",
    packageName: "",
    json: argv.includes("--json"),
    skipUiSmoke: argv.includes("--skip-ui-smoke"),
    help: argv.includes("--help") || argv.includes("-h"),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index] || "";
    if (arg === "--id") args.id = next();
    else if (arg.startsWith("--id=")) args.id = arg.slice("--id=".length);
    else if (arg === "--package") args.packageName = next();
    else if (arg.startsWith("--package=")) args.packageName = arg.slice("--package=".length);
  }
  return args;
}

function usage() {
  console.log(`CAC install readiness

Usage:
  npm run cac:install-ready
  node tools/cac-install-ready.mjs --id v222-ui-preserving-api-merge-candidate.1
  node tools/cac-install-ready.mjs --package cac-ui-preserving-api-merge-v222-20260512.zip

Read-only decision helper. It does not install, enable, submit prompts, click
Continue, download artifacts, or read browser secrets.
`);
}

function selectEntry(ledger, args) {
  const entries = Array.isArray(ledger.entries) ? ledger.entries : [];
  if (args.id) return entries.find((entry) => entry.id === args.id) || null;
  if (args.packageName) return entries.find((entry) => path.basename(entry.sourceZip || "") === args.packageName) || null;
  return entries.find((entry) => /waiting/i.test(`${entry.reviewState || ""} ${entry.installState || ""}`)) || null;
}

function reviewAcceptsLocalInstall(decision) {
  return /ACCEPT_FOR_LOCAL_(UI_)?API_REVIEW|ACCEPT_FOR_LOCAL_UI_API_REVIEW|ACCEPT/i.test(decision || "");
}

function reviewWaiting(decision) {
  return /WAITING|NO_PACKAGE_REVIEW|NO_REVIEW/i.test(decision || "");
}

export async function buildInstallReady(options = {}) {
  const ledger = JSON.parse(await readFile(options.ledgerPath || LEDGER_PATH, "utf8"));
  const entry = options.entry || selectEntry(ledger, options);
  if (!entry) throw new Error("No CAC candidate selected");
  const lane = options.lane || await buildLaneStatus(options.laneOptions || {});
  const reviewDecision = lane.review?.decision || "";
  const blockers = [];
  const warnings = [];

  if (!lane.runtime?.singleVersionOk) blockers.push("single_version_state_not_ok");
  if (!entry.candidateRuntimeScript) blockers.push("candidate_runtime_script_missing");
  if (lane.review?.package && path.basename(entry.sourceZip || "") !== lane.review.package) {
    blockers.push("review_gate_package_mismatch");
  }
  if (reviewWaiting(reviewDecision)) blockers.push("waiting_for_independent_review");
  else if (!reviewAcceptsLocalInstall(reviewDecision)) blockers.push("independent_review_not_accepted");

  let uiSmoke = null;
  if (!options.skipUiSmoke && entry.candidateRuntimeScript) {
    uiSmoke = await runUiParitySmoke({ entry, source: entry.candidateRuntimeScript, ledger });
    if (!uiSmoke.ok) blockers.push("ui_parity_static_smoke_failed");
    if (uiSmoke.warnings.includes("update_url_present") || uiSmoke.warnings.includes("download_url_present")) {
      warnings.push("missing_update_or_download_url_blocks_public_raw_promotion");
    }
  }

  if (lane.release?.installAllowed === false) {
    warnings.push("default_release_gate_blocks_install_without_explicit_scoped_replacement_approval");
  }
  if (lane.release?.realContinueAllowed === false) warnings.push("real_continue_blocked");
  if (lane.release?.unattendedAllowed === false) warnings.push("unattended_blocked");

  const decision = blockers.length
    ? blockers.includes("waiting_for_independent_review")
      ? "WAIT_REVIEW"
      : "BLOCKED"
    : "READY_FOR_BOUNDED_REPLACEMENT_INSTALL";

  return {
    ok: decision === "READY_FOR_BOUNDED_REPLACEMENT_INSTALL",
    decision,
    entryId: entry.id,
    package: path.basename(entry.sourceZip || ""),
    current: lane.current,
    singleVersionOk: lane.runtime?.singleVersionOk === true,
    reviewDecision,
    releaseDecision: lane.release?.decision || "",
    blockers,
    warnings,
    uiSmoke: uiSmoke ? {
      decision: uiSmoke.decision,
      failures: uiSmoke.failures,
      warnings: uiSmoke.warnings,
      bytes: uiSmoke.bytes,
    } : null,
    next: decision === "WAIT_REVIEW"
      ? "wait_for_package_review_marker_or_send_short_followup"
      : decision === "READY_FOR_BOUNDED_REPLACEMENT_INSTALL"
        ? "refresh_scoped_gates_then_replace_current_row_only"
        : "fix_blockers_before_install",
    safety: {
      readOnly: true,
      noInstall: true,
      noEnable: true,
      noBrowserControl: true,
      noPromptSubmit: true,
      noRealContinue: true,
      noDownloads: true,
      noSecrets: true,
    },
  };
}

function printCompact(result) {
  console.log(`CAC_INSTALL_READY ${result.decision}`);
  console.log(`entry=${result.entryId}`);
  console.log(`package=${result.package}`);
  console.log(`current=${result.current}`);
  console.log(`single_version=${result.singleVersionOk}`);
  console.log(`review=${result.reviewDecision || "unknown"}`);
  console.log(`release=${result.releaseDecision || "unknown"}`);
  console.log(`ui_smoke=${result.uiSmoke?.decision || "skipped"}`);
  console.log(`blockers=${result.blockers.join(",") || "none"}`);
  console.log(`warnings=${result.warnings.join(",") || "none"}`);
  console.log(`next=${result.next}`);
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    usage();
    return;
  }
  const result = await buildInstallReady(args);
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else printCompact(result);
  if (result.decision === "BLOCKED") process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message || String(error));
    process.exitCode = 1;
  });
}
