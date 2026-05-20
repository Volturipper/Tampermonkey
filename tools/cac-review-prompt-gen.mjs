#!/usr/bin/env node
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER_PATH = path.join(ROOT, "docs", "CAC_VERSION_LEDGER.json");

function parseArgs(argv) {
  const args = {
    id: "",
    packageName: "",
    mode: "ui-api",
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
    else if (arg === "--mode") args.mode = next() || args.mode;
    else if (arg.startsWith("--mode=")) args.mode = arg.slice("--mode=".length) || args.mode;
    else if (arg === "--out") args.out = next();
    else if (arg.startsWith("--out=")) args.out = arg.slice("--out=".length);
  }
  return args;
}

function usage() {
  console.log(`CAC review prompt generator

Usage:
  npm run cac:review-prompt -- --id v222-ui-preserving-api-merge-candidate.1
  node tools/cac-review-prompt-gen.mjs --package cac-ui-preserving-api-merge-v222-20260512.zip --out prompts/review.md

Reads the project CAC ledger plus extracted package manifest/checklists when
available. It writes a concise review request only; it does not send prompts,
upload files, install userscripts, or touch the browser.
`);
}

async function exists(filePath) {
  try {
    const info = await stat(filePath);
    return info.isFile();
  } catch {
    return false;
  }
}

async function readJsonIfExists(filePath) {
  if (!filePath || !(await exists(filePath))) return null;
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readTextIfExists(filePath) {
  if (!filePath || !(await exists(filePath))) return "";
  return readFile(filePath, "utf8");
}

function findEntry(ledger, args) {
  const entries = Array.isArray(ledger?.entries) ? ledger.entries : [];
  if (args.id) return entries.find((entry) => entry.id === args.id) || null;
  if (args.packageName) return entries.find((entry) => path.basename(entry.sourceZip || "") === args.packageName) || null;
  return entries.find((entry) => /waiting/i.test(`${entry.reviewState || ""} ${entry.installState || ""}`)) || null;
}

async function findExtractRoot(entry) {
  let cursor = entry?.candidateRuntimeScript ? path.dirname(entry.candidateRuntimeScript) : "";
  for (let depth = 0; cursor && depth < 6; depth += 1) {
    if (await exists(path.join(cursor, "MANIFEST.json"))) return cursor;
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return "";
}

function metadataValue(header, key) {
  const match = header.match(new RegExp(`^\\s*//\\s*@${key}\\s+(.+)$`, "mi"));
  return match ? match[1].trim() : "";
}

async function runtimeHeader(entry) {
  if (!entry?.candidateRuntimeScript || !(await exists(entry.candidateRuntimeScript))) return "";
  const content = await readFile(entry.candidateRuntimeScript, "utf8");
  const end = content.indexOf("// ==/UserScript==");
  return end >= 0 ? content.slice(0, end + "// ==/UserScript==".length) : content.slice(0, 2500);
}

export async function buildReviewPrompt({ ledger, entry, mode = "ui-api" }) {
  if (!entry) throw new Error("No CAC ledger entry selected");
  const extractRoot = await findExtractRoot(entry);
  const manifest = await readJsonIfExists(path.join(extractRoot, "MANIFEST.json"));
  const gate = await readJsonIfExists(path.join(extractRoot, "decisions", "cac-ui-preserving-api-merge-gate.json"));
  const uiChecklist = await readTextIfExists(path.join(extractRoot, "docs", "UI_PARITY_CHECKLIST.md"));
  const apiChecklist = await readTextIfExists(path.join(extractRoot, "docs", "API_SMOKE_CHECKLIST.md"));
  const header = await runtimeHeader(entry);
  const updateUrl = metadataValue(header, "updateURL");
  const downloadUrl = metadataValue(header, "downloadURL");
  const matchLine = metadataValue(header, "match");
  const packageName = path.basename(entry.sourceZip || "");
  const current = ledger?.currentInstalled || {};

  const checks = [
    `package=${packageName}`,
    `candidate=${entry.id}`,
    `source_sha256=${entry.sourceSha256 || "unknown"}`,
    `runtime_sha256=${entry.runtimeSha256 || manifest?.runtime_sha256 || "unknown"}`,
    `metadata_version=${entry.metadataVersion || manifest?.version || "unknown"}`,
    `match=${matchLine || "unknown"}`,
    `updateURL=${updateUrl || "missing"}`,
    `downloadURL=${downloadUrl || "missing"}`,
    `base_ui_source=${manifest?.base_ui_source || gate?.base_ui_source || "unknown"}`,
    `api_source=${manifest?.api_source || gate?.api_source || "unknown"}`,
  ];

  const scope = mode === "api"
    ? "API compatibility, text-free read APIs, lease aliases, one-version safety, and safe defaults."
    : "UI parity preservation, v221 API compatibility, text-free selfIterationPacket, one-version safety, safe defaults, and auto-update metadata readiness.";

  const uiHints = uiChecklist
    .split(/\r?\n/)
    .filter((line) => /^- /.test(line))
    .slice(0, 8)
    .map((line) => line.replace(/^- /, ""))
    .join("; ");
  const apiHints = apiChecklist
    .split(/\r?\n/)
    .filter((line) => /^- /.test(line))
    .slice(0, 8)
    .map((line) => line.replace(/^- /, ""))
    .join("; ");

  return `# CAC Independent Review Request

You are the independent reviewer for a ChatGPT Auto Continue Tampermonkey userscript package.

Attached package: \`${packageName}\`

Review scope: ${scope}

Local facts:

${checks.map((item) => `- ${item}`).join("\n")}
- current_installed=${current.id || "unknown"}
- current_install_state=${current.installState || "unknown"}

Reviewer checks:

- Verify this is not a loose patch fragment.
- Verify dedicated-conversation scope and one-version replacement safety.
- Verify clean install remains inert.
- Verify no prompt submit, artifact auto-download, unattended operation, production install, takeover, or broad all-tabs behavior is approved by default.
- Verify mutating commands remain lease/bounded-receipt guarded.
- Verify read APIs are text-free and do not expose prompt bodies, assistant bodies, cookies, localStorage dumps, account identifiers, or browser profile data.
- For UI-preserving candidates, verify full panel parity is plausible and no mini-widget replacement occurred.
- Treat missing \`@updateURL\` / \`@downloadURL\` as a blocker for public/raw auto-update promotion, even if local UI/API review can proceed.

UI checklist hints: ${uiHints || "not provided"}

API checklist hints: ${apiHints || "not provided"}

Required output:

- Start with exactly one marker:
  - \`REVIEW_DECISION: ACCEPT_FOR_LOCAL_UI_API_REVIEW\`
  - \`REVIEW_DECISION: NEEDS_CHANGES\`
- Include: \`package_reviewed\`, \`accepted_scope\`, \`blocked_scope\`, \`blocking_issues\`, \`nonblocking_notes\`, \`ui_parity_findings\`, \`api_contract_findings\`, \`auto_update_findings\`, and \`required_next_steps\`.

Do not approve production install, unattended operation, prompt submission, artifact auto-download, takeover, broad real Continue, or public raw auto-update promotion.
`;
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    usage();
    return;
  }
  const ledger = JSON.parse(await readFile(LEDGER_PATH, "utf8"));
  const entry = findEntry(ledger, args);
  const prompt = await buildReviewPrompt({ ledger, entry, mode: args.mode });
  if (args.out) {
    await writeFile(path.resolve(args.out), prompt, "utf8");
  }
  if (args.json) {
    console.log(JSON.stringify({ ok: true, entryId: entry.id, package: path.basename(entry.sourceZip || ""), out: args.out || "", prompt }, null, 2));
  } else {
    console.log(prompt);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message || String(error));
    process.exitCode = 1;
  });
}
