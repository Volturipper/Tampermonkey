import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildLaneStatus } from "../tools/cac-lane-status.mjs";

async function workspace() {
  const root = await mkdir(path.join(os.tmpdir(), "cac-lane-status-"), { recursive: true }).then(async () => {
    const { mkdtemp } = await import("node:fs/promises");
    return mkdtemp(path.join(os.tmpdir(), "cac-lane-status-"));
  });
  return root;
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

test("summarizes current runtime, waiting review, and single-version state", async () => {
  const root = await workspace();
  const files = {
    ledger: path.join(root, "ledger.json"),
    monitor: path.join(root, "monitor.json"),
    runtimeTarget: path.join(root, "runtime.json"),
    releaseGate: path.join(root, "release.json"),
    reviewGate: path.join(root, "review.json"),
    tampermonkeyVerify: path.join(root, "tm.json"),
    reviewerHeartbeat: path.join(root, "heartbeat.json"),
    secondReviewerHeartbeat: path.join(root, "second-heartbeat.json"),
    transferReceipts: path.join(root, "transfer.json"),
  };
  await writeJson(files.ledger, {
    schema: "cac.version_ledger.v1",
    currentInstalled: { id: "v221" },
    entries: [
      { id: "v221", kind: "api", uiCompleteness: "api_only", reviewState: "accepted", installState: "installed_scoped_single_enabled", runtimeVersion: "v221" },
      { id: "v222", kind: "ui_candidate", sourceZip: "D:/Gemini DL/cac-v222.zip", uiCompleteness: "full_ui_candidate", reviewState: "sent_to_independent_reviewer_waiting_decision", installState: "not_installed_waiting_review" },
    ],
  });
  await writeJson(files.monitor, { cac_version: "v221" });
  await writeJson(files.runtimeTarget, { open_chatgpt_count: 3, approved_runtime_count: 1, targets: [{ class: "approved_runtime_smoke", probe: { hasApi: true } }] });
  await writeJson(files.releaseGate, { decision: "SUPERVISED_DRY_RUN_READY_REAL_BLOCKED", gates: { installAllowed: false, realContinueAllowed: false, unattendedAllowed: false }, blockers: ["install_not_allowed"] });
  await writeJson(files.reviewGate, { gate: { decision: "WAITING_NO_PACKAGE_REVIEW_DECISION", requiredPackage: "cac-v222.zip", markerCount: 4 } });
  await writeJson(files.tampermonkeyVerify, { tampermonkey_after: { enabled_count: 1 }, verify: { targetSmoke: { hasApi: true }, others: [{ smoke: { hasApi: false } }] } });
  await writeJson(files.reviewerHeartbeat, { event: "task_sent", status: "waiting_for_v222" });
  await writeJson(files.secondReviewerHeartbeat, { latest: { event: "task_sent", chat_url: "https://chatgpt.com/c/second", target_repo: "Volturipper/openpatch-review-relay-20260506" } });
  await writeJson(files.transferReceipts, { decision: "ATTENTION", summary: { sendReceiptOk: false, downloadReceiptOk: true, gaps: ["latest_send_receipt_stale"] } });

  const summary = await buildLaneStatus({ files, maxFreshMinutes: 60 });

  assert.equal(summary.current, "v221");
  assert.equal(summary.waiting[0].id, "v222");
  assert.equal(summary.runtime.singleVersionOk, true);
  assert.equal(summary.review.decision, "WAITING_NO_PACKAGE_REVIEW_DECISION");
  assert.equal(summary.transport.secondReviewer.event, "task_sent");
  assert.equal(summary.transport.webaiTransfer.downloadReceiptOk, true);
  assert.equal(summary.next, "wait_for_package_review_marker_via_transport_surfaces");
});
