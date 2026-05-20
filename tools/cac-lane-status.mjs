#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CODEX_ROOT = path.resolve(ROOT, "..");
const N8N_ROOT = path.join(CODEX_ROOT, "n8n-gpt-orchestrator");
const CAC_REPO_ROOT = path.join(CODEX_ROOT, "chatgpt-auto-continue");

const DEFAULT_FILES = {
  ledger: path.join(ROOT, "docs", "CAC_VERSION_LEDGER.json"),
  monitor: path.join(N8N_ROOT, "scratch", "cac-monitor", "latest.json"),
  runtimeTarget: path.join(N8N_ROOT, "scratch", "cac-runtime-target-latest.json"),
  releaseGate: path.join(N8N_ROOT, "scratch", "cac-release-gate-latest.json"),
  reviewGate: path.join(CAC_REPO_ROOT, "evidence", "latest", "cac-review-decision-gate-latest.json"),
  tampermonkeyVerify: path.join(N8N_ROOT, "scratch", "cac-tampermonkey-whitelist-install-latest.json"),
  reviewerHeartbeat: path.join(N8N_ROOT, "scratch", "cac-independent-review-webai-heartbeat.json"),
  secondReviewerHeartbeat: path.join(N8N_ROOT, "scratch", "openpatch-repo-reviewer-heartbeat-latest.json"),
  transferReceipts: path.join(N8N_ROOT, "scratch", "webai-transfer-receipts-latest.json"),
};

function parseArgs(argv) {
  const args = {
    json: argv.includes("--json"),
    compact: argv.includes("--compact") || !argv.includes("--json"),
    maxFreshMinutes: 15,
    help: argv.includes("--help") || argv.includes("-h"),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--max-fresh-minutes") args.maxFreshMinutes = Number(argv[++index]) || args.maxFreshMinutes;
    else if (arg.startsWith("--max-fresh-minutes=")) args.maxFreshMinutes = Number(arg.slice("--max-fresh-minutes=".length)) || args.maxFreshMinutes;
  }
  return args;
}

function usage() {
  console.log(`CAC lane status

Usage:
  npm run cac:lane
  node tools/cac-lane-status.mjs --compact
  node tools/cac-lane-status.mjs --json

Reads latest local status files only. It does not install userscripts, submit
prompts, click Continue, download artifacts, or read browser secrets.
`);
}

async function readJsonState(filePath) {
  const state = {
    path: filePath,
    exists: false,
    ok: false,
    ageSec: null,
    data: null,
    error: "",
  };
  try {
    const info = await stat(filePath);
    state.exists = info.isFile();
    state.ageSec = Math.max(0, Math.round((Date.now() - info.mtimeMs) / 1000));
    state.data = JSON.parse(await readFile(filePath, "utf8"));
    state.ok = true;
  } catch (error) {
    state.error = error.message || String(error);
  }
  return state;
}

function basename(value) {
  return value ? path.basename(value) : "";
}

function findWaitingEntries(ledger) {
  return Array.isArray(ledger?.entries)
    ? ledger.entries.filter((entry) => /waiting/i.test(`${entry.reviewState || ""} ${entry.installState || ""}`))
    : [];
}

function targetHasApi(runtimeTarget, tampermonkeyVerify) {
  const runtimeTargetProbe = runtimeTarget?.targets?.find((target) => target?.class === "approved_runtime_smoke")?.probe;
  return Boolean(
    runtimeTargetProbe?.hasApi === true ||
    tampermonkeyVerify?.verify?.targetSmoke?.hasApi === true
  );
}

function otherPagesWithApi(tampermonkeyVerify) {
  return Array.isArray(tampermonkeyVerify?.verify?.others)
    ? tampermonkeyVerify.verify.others.filter((item) => item?.smoke?.hasApi === true).length
    : null;
}

function buildNext(summary) {
  if (!summary.runtime?.singleVersionOk) return "restore_single_enabled_cac_before_any_install";
  const reviewDecision = summary.review?.decision || "";
  if (summary.waiting.length && /WAITING/i.test(reviewDecision)) {
    if (summary.transport?.secondReviewer?.event) return "wait_for_package_review_marker_via_transport_surfaces";
    return "wait_for_package_review_marker_or_send_short_followup";
  }
  if (summary.waiting.length && /ACCEPT/i.test(reviewDecision)) {
    return "refresh_gates_then_plan_replacement_install_only";
  }
  if (summary.waiting.length) return "check_waiting_candidate_gate";
  return "select_next_backlog_item_or_maintain_current_runtime";
}

export async function buildLaneStatus(options = {}) {
  const files = options.files || DEFAULT_FILES;
  const states = {};
  for (const [key, filePath] of Object.entries(files)) {
    states[key] = await readJsonState(filePath);
  }

  const ledger = states.ledger.data || {};
  const currentEntry = Array.isArray(ledger.entries)
    ? ledger.entries.find((entry) => entry.id === ledger.currentInstalled?.id)
    : null;
  const waiting = findWaitingEntries(ledger);
  const releaseGate = states.releaseGate.data || {};
  const reviewGate = states.reviewGate.data || {};
  const tm = states.tampermonkeyVerify.data || {};
  const runtimeTarget = states.runtimeTarget.data || {};
  const monitor = states.monitor.data || {};
  const enabledCount = tm.tampermonkey_after?.enabled_count ?? null;
  const otherApiCount = otherPagesWithApi(tm);
  const hasTargetApi = targetHasApi(runtimeTarget, tm);
  const singleVersionOk = enabledCount === 1 && hasTargetApi === true && (otherApiCount === 0 || otherApiCount === null);
  const staleLimit = (options.maxFreshMinutes || 15) * 60;

  const summary = {
    ok: true,
    generatedAt: new Date().toISOString(),
    current: ledger.currentInstalled?.id || "",
    currentRuntime: monitor.cac_version || currentEntry?.runtimeVersion || "",
    currentUi: currentEntry?.uiCompleteness || ledger.currentInstalled?.uiCompleteness || "",
    currentInstallState: currentEntry?.installState || ledger.currentInstalled?.installState || "",
    waiting: waiting.map((entry) => ({
      id: entry.id,
      package: basename(entry.sourceZip),
      reviewState: entry.reviewState || "",
      installState: entry.installState || "",
      reviewGate: entry.reviewGate || "",
    })),
    monitor: {
      decision: states.monitor.ok ? "FILE_OK" : "MISSING",
      ageSec: states.monitor.ageSec,
      fresh: states.monitor.ageSec !== null ? states.monitor.ageSec <= staleLimit : false,
      heartbeatVersion: monitor.cac_version || "",
    },
    runtime: {
      openChatgptCount: runtimeTarget.open_chatgpt_count ?? null,
      approvedRuntimeCount: runtimeTarget.approved_runtime_count ?? null,
      targetHasApi: hasTargetApi,
      otherPagesWithApi: otherApiCount,
      enabledCount,
      singleVersionOk,
    },
    release: {
      decision: releaseGate.decision || "",
      installAllowed: releaseGate.gates?.installAllowed === true,
      realContinueAllowed: releaseGate.gates?.realContinueAllowed === true,
      unattendedAllowed: releaseGate.gates?.unattendedAllowed === true,
      blockers: Array.isArray(releaseGate.blockers) ? releaseGate.blockers : [],
    },
    review: {
      decision: reviewGate.gate?.decision || reviewGate.decision || "",
      package: reviewGate.requiredPackage || reviewGate.gate?.requiredPackage || "",
      markerCount: reviewGate.gate?.markerCount ?? null,
      next: reviewGate.gate?.acceptableNextAction || reviewGate.next || "",
    },
    reviewerHeartbeat: {
      event: states.reviewerHeartbeat.data?.latest?.event || states.reviewerHeartbeat.data?.event || "",
      status: states.reviewerHeartbeat.data?.latest?.status || states.reviewerHeartbeat.data?.status || "",
      ageSec: states.reviewerHeartbeat.ageSec,
    },
    transport: {
      secondReviewer: {
        event: states.secondReviewerHeartbeat.data?.latest?.event || states.secondReviewerHeartbeat.data?.latest_event || "",
        chatUrl: states.secondReviewerHeartbeat.data?.latest?.chat_url || "",
        ageSec: states.secondReviewerHeartbeat.ageSec,
        targetRepo: states.secondReviewerHeartbeat.data?.latest?.target_repo || "",
      },
      webaiTransfer: {
        decision: states.transferReceipts.data?.decision || "",
        sendReceiptOk: states.transferReceipts.data?.summary?.sendReceiptOk ?? null,
        downloadReceiptOk: states.transferReceipts.data?.summary?.downloadReceiptOk ?? null,
        gaps: Array.isArray(states.transferReceipts.data?.summary?.gaps) ? states.transferReceipts.data.summary.gaps : [],
        ageSec: states.transferReceipts.ageSec,
      },
    },
    paths: Object.fromEntries(Object.entries(files).map(([key, filePath]) => [key, filePath])),
  };
  summary.next = buildNext(summary);
  return summary;
}

function printCompact(summary) {
  const waiting = summary.waiting.map((entry) => entry.id).join(",") || "none";
  console.log(`CAC_LANE_STATUS ${summary.runtime.singleVersionOk ? "OK" : "CHECK"}`);
  console.log(`current=${summary.current}`);
  console.log(`runtime=${summary.currentRuntime}`);
  console.log(`ui=${summary.currentUi}`);
  console.log(`waiting=${waiting}`);
  console.log(`single_version=${summary.runtime.singleVersionOk} enabled=${summary.runtime.enabledCount ?? "unknown"} target_api=${summary.runtime.targetHasApi} other_api=${summary.runtime.otherPagesWithApi ?? "unknown"}`);
  console.log(`release=${summary.release.decision || "unknown"} install=${summary.release.installAllowed} real=${summary.release.realContinueAllowed} unattended=${summary.release.unattendedAllowed}`);
  console.log(`review=${summary.review.decision || "unknown"} package=${summary.review.package || "unknown"} markers=${summary.review.markerCount ?? "unknown"}`);
  console.log(`monitor_fresh=${summary.monitor.fresh} monitor_age_sec=${summary.monitor.ageSec ?? "unknown"}`);
  console.log(`heartbeat=${summary.reviewerHeartbeat.event || "unknown"}:${summary.reviewerHeartbeat.status || "unknown"}`);
  console.log(`transport_second_reviewer=${summary.transport.secondReviewer.event || "none"} age_sec=${summary.transport.secondReviewer.ageSec ?? "unknown"}`);
  console.log(`transport_webai=${summary.transport.webaiTransfer.decision || "unknown"} send_ok=${summary.transport.webaiTransfer.sendReceiptOk ?? "unknown"} download_ok=${summary.transport.webaiTransfer.downloadReceiptOk ?? "unknown"}`);
  console.log(`next=${summary.next}`);
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    usage();
    return;
  }
  const summary = await buildLaneStatus({ maxFreshMinutes: args.maxFreshMinutes });
  if (args.json) console.log(JSON.stringify(summary, null, 2));
  else printCompact(summary);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message || String(error));
    process.exitCode = 1;
  });
}
