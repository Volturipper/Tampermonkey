#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildInstallReady } from "./cac-install-ready.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER_PATH = path.join(ROOT, "docs", "CAC_VERSION_LEDGER.json");

function parseArgs(argv) {
  const args = {
    id: "",
    packageName: "",
    out: "",
    json: argv.includes("--json"),
    help: argv.includes("--help") || argv.includes("-h"),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index] || "";
    if (arg === "--id") args.id = next();
    else if (arg.startsWith("--id=")) args.id = arg.slice("--id=".length);
    else if (arg === "--package") args.packageName = next();
    else if (arg.startsWith("--package=")) args.packageName = arg.slice("--package=".length);
    else if (arg === "--out") args.out = next();
    else if (arg.startsWith("--out=")) args.out = arg.slice("--out=".length);
  }
  return args;
}

function usage() {
  console.log(`CAC review follow-up generator

Usage:
  npm run cac:review-followup -- --id v222-ui-preserving-api-merge-candidate.1
  node tools/cac-review-followup.mjs --package cac-ui-preserving-api-merge-v222-20260512.zip --out prompts/followup.md

Generates a short package-specific reviewer follow-up when install readiness is
waiting on review. It does not send prompts, install userscripts, click
Continue, download artifacts, or read browser secrets.
`);
}

function selectEntry(ledger, args) {
  const entries = Array.isArray(ledger.entries) ? ledger.entries : [];
  if (args.id) return entries.find((entry) => entry.id === args.id) || null;
  if (args.packageName) return entries.find((entry) => path.basename(entry.sourceZip || "") === args.packageName) || null;
  return entries.find((entry) => /waiting/i.test(`${entry.reviewState || ""} ${entry.installState || ""}`)) || null;
}

export function buildFollowupPrompt({ installReady, entry }) {
  const packageName = installReady.package || path.basename(entry?.sourceZip || "");
  const reviewDecision = installReady.reviewDecision || "";
  const uiSmoke = installReady.uiSmoke?.decision || "";
  const warnings = Array.isArray(installReady.warnings) ? installReady.warnings : [];
  return `# CAC v222 Review Decision Follow-up

Please answer the prior attached package review for:

\`${packageName}\`

Current local gate still reports:

- review_decision=${reviewDecision || "unknown"}
- install_ready=${installReady.decision || "unknown"}
- ui_smoke=${uiSmoke || "unknown"}
- single_version=${installReady.singleVersionOk === true}
- current_installed=${installReady.current || "unknown"}
- warnings=${warnings.join(",") || "none"}

Do not review older v216/v219/v220/v221 packages unless they directly affect this exact v222 package.

Required first line, exactly one:

\`REVIEW_DECISION: ACCEPT_FOR_LOCAL_UI_API_REVIEW\`

or

\`REVIEW_DECISION: NEEDS_CHANGES\`

Then include only:

- package_reviewed
- accepted_scope
- blocked_scope
- blocking_issues
- nonblocking_notes
- ui_parity_findings
- api_contract_findings
- auto_update_findings
- required_next_steps

If changes are needed, ask for a complete corrected package, exact replacement files, or exact missing evidence. Do not provide loose patch fragments.

Do not approve production install, unattended operation, prompt submission, artifact auto-download, takeover, broad real Continue, or public raw auto-update promotion.
`;
}

export async function buildReviewFollowup(options = {}) {
  const ledger = JSON.parse(await readFile(options.ledgerPath || LEDGER_PATH, "utf8"));
  const entry = options.entry || selectEntry(ledger, options);
  if (!entry) throw new Error("No CAC candidate selected");
  const installReady = options.installReady || await buildInstallReady({
    id: entry.id,
    packageName: path.basename(entry.sourceZip || ""),
  });
  const prompt = buildFollowupPrompt({ installReady, entry });
  const shouldSend = installReady.decision === "WAIT_REVIEW";
  return {
    ok: true,
    shouldSend,
    reason: shouldSend ? "waiting_for_review_marker" : `install_ready_decision_${installReady.decision}`,
    entryId: entry.id,
    package: path.basename(entry.sourceZip || ""),
    installReady: installReady.decision,
    prompt,
    safety: {
      readOnly: true,
      noPromptSubmit: true,
      noBrowserControl: true,
      noInstall: true,
      noDownloads: true,
      noSecrets: true,
    },
  };
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    usage();
    return;
  }
  const result = await buildReviewFollowup(args);
  if (args.out) {
    const outPath = path.resolve(args.out);
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, result.prompt, "utf8");
    result.out = outPath;
  }
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (args.out) {
    console.log(`CAC_REVIEW_FOLLOWUP ${result.shouldSend ? "READY" : "SKIP"}`);
    console.log(`entry=${result.entryId}`);
    console.log(`package=${result.package}`);
    console.log(`install_ready=${result.installReady}`);
    console.log(`out=${result.out}`);
    console.log(`reason=${result.reason}`);
  } else {
    console.log(result.prompt);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message || String(error));
    process.exitCode = 1;
  });
}
