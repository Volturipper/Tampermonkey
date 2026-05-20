#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildInstallReady } from "./cac-install-ready.mjs";
import { buildLaneStatus } from "./cac-lane-status.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = {
    id: "",
    packageName: "",
    json: argv.includes("--json"),
    followupMinutes: 20,
    escalateMinutes: 60,
    fallbackMinutes: 180,
    help: argv.includes("--help") || argv.includes("-h"),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index] || "";
    if (arg === "--id") args.id = next();
    else if (arg.startsWith("--id=")) args.id = arg.slice("--id=".length);
    else if (arg === "--package") args.packageName = next();
    else if (arg.startsWith("--package=")) args.packageName = arg.slice("--package=".length);
    else if (arg === "--followup-minutes") args.followupMinutes = Number(next()) || args.followupMinutes;
    else if (arg.startsWith("--followup-minutes=")) args.followupMinutes = Number(arg.slice("--followup-minutes=".length)) || args.followupMinutes;
    else if (arg === "--escalate-minutes") args.escalateMinutes = Number(next()) || args.escalateMinutes;
    else if (arg.startsWith("--escalate-minutes=")) args.escalateMinutes = Number(arg.slice("--escalate-minutes=".length)) || args.escalateMinutes;
    else if (arg === "--fallback-minutes") args.fallbackMinutes = Number(next()) || args.fallbackMinutes;
    else if (arg.startsWith("--fallback-minutes=")) args.fallbackMinutes = Number(arg.slice("--fallback-minutes=".length)) || args.fallbackMinutes;
  }
  return args;
}

function usage() {
  console.log(`CAC review escalation decision

Usage:
  npm run cac:review-escalate
  node tools/cac-review-escalate.mjs --id v222-ui-preserving-api-merge-candidate.1
  node tools/cac-review-escalate.mjs --followup-minutes 20 --escalate-minutes 60 --fallback-minutes 180

Read-only decision helper. It does not send prompts, install userscripts, click
Continue, download artifacts, or read browser secrets.
`);
}

function minutes(ageSec) {
  return typeof ageSec === "number" ? ageSec / 60 : null;
}

function chooseDecision({ lane, installReady, thresholds }) {
  if (installReady.decision === "READY_FOR_BOUNDED_REPLACEMENT_INSTALL") {
    return {
      decision: "READY_FOR_BOUNDED_REPLACEMENT_INSTALL",
      reason: "review accepted and local readiness gates pass",
      next: "refresh_scoped_gates_then_replace_current_row_only",
    };
  }
  if (installReady.decision === "BLOCKED") {
    return {
      decision: "BLOCKED",
      reason: installReady.blockers.join(",") || "install readiness blocked",
      next: "fix_blockers_before_escalation",
    };
  }

  const heartbeatEvent = lane.reviewerHeartbeat?.event || "";
  const heartbeatAgeMin = minutes(lane.reviewerHeartbeat?.ageSec);
  const followupAlreadySent = /followup/i.test(heartbeatEvent);
  const uiSmokePass = installReady.uiSmoke?.decision === "PASS_STATIC_UI_PARITY_CANDIDATE";
  const singleVersionOk = installReady.singleVersionOk === true;
  const staticLocalFallbackEligible = uiSmokePass && singleVersionOk;

  if (heartbeatAgeMin === null) {
    return {
      decision: "SEND_FOLLOWUP",
      reason: "review waiting and heartbeat age unknown",
      next: "generate_package_specific_followup_then_send_with_cac_review_relay",
    };
  }
  if (!followupAlreadySent && heartbeatAgeMin >= thresholds.followupMinutes) {
    return {
      decision: "SEND_FOLLOWUP",
      reason: `initial review wait ${heartbeatAgeMin.toFixed(1)}m >= ${thresholds.followupMinutes}m`,
      next: "generate_package_specific_followup_then_send_with_cac_review_relay",
    };
  }
  if (followupAlreadySent && heartbeatAgeMin >= thresholds.fallbackMinutes && staticLocalFallbackEligible) {
    return {
      decision: "PREPARE_OWNER_FALLBACK_PACKET",
      reason: `followup wait ${heartbeatAgeMin.toFixed(1)}m >= ${thresholds.fallbackMinutes}m and static local gates pass`,
      next: "prepare_owner_approved_isolated_replacement_smoke_packet",
    };
  }
  if (followupAlreadySent && heartbeatAgeMin >= thresholds.escalateMinutes) {
    return {
      decision: "ESCALATE_SECOND_REVIEWER",
      reason: `followup wait ${heartbeatAgeMin.toFixed(1)}m >= ${thresholds.escalateMinutes}m`,
      next: "route_same_package_to_second_independent_reviewer_or_reviewer_clone",
    };
  }
  return {
    decision: "WAIT_REVIEW",
    reason: followupAlreadySent
      ? `followup already sent ${heartbeatAgeMin.toFixed(1)}m ago`
      : `initial review wait ${heartbeatAgeMin.toFixed(1)}m < ${thresholds.followupMinutes}m`,
    next: "switch_to_nonblocking_local_work_until_review_marker_or_heartbeat_change",
  };
}

export async function buildReviewEscalation(options = {}) {
  const thresholds = {
    followupMinutes: options.followupMinutes || 20,
    escalateMinutes: options.escalateMinutes || 60,
    fallbackMinutes: options.fallbackMinutes || 180,
  };
  const lane = options.lane || await buildLaneStatus(options.laneOptions || {});
  const installReady = options.installReady || await buildInstallReady({
    id: options.id || "",
    packageName: options.packageName || "",
    skipUiSmoke: options.skipUiSmoke === true,
  });
  const chosen = chooseDecision({ lane, installReady, thresholds });
  return {
    ok: true,
    ...chosen,
    entryId: installReady.entryId,
    package: installReady.package,
    current: installReady.current,
    reviewDecision: installReady.reviewDecision,
    installReady: installReady.decision,
    uiSmoke: installReady.uiSmoke?.decision || "",
    singleVersionOk: installReady.singleVersionOk,
    heartbeat: lane.reviewerHeartbeat || {},
    thresholds,
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

function printCompact(result) {
  console.log(`CAC_REVIEW_ESCALATE ${result.decision}`);
  console.log(`entry=${result.entryId}`);
  console.log(`package=${result.package}`);
  console.log(`current=${result.current}`);
  console.log(`review=${result.reviewDecision || "unknown"}`);
  console.log(`install_ready=${result.installReady}`);
  console.log(`ui_smoke=${result.uiSmoke || "unknown"}`);
  console.log(`single_version=${result.singleVersionOk}`);
  console.log(`heartbeat=${result.heartbeat.event || "unknown"}:${result.heartbeat.status || "unknown"} age_sec=${result.heartbeat.ageSec ?? "unknown"}`);
  console.log(`reason=${result.reason}`);
  console.log(`next=${result.next}`);
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    usage();
    return;
  }
  const result = await buildReviewEscalation(args);
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else printCompact(result);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message || String(error));
    process.exitCode = 1;
  });
}
