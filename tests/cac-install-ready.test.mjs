import assert from "node:assert/strict";
import test from "node:test";

import { buildInstallReady } from "../tools/cac-install-ready.mjs";

test("waits when the selected package has no independent review marker", async () => {
  const entry = {
    id: "v222",
    sourceZip: "D:/Gemini DL/cac-v222.zip",
    candidateRuntimeScript: "",
    reviewState: "sent_to_independent_reviewer_waiting_decision",
    installState: "not_installed_waiting_review",
  };
  const result = await buildInstallReady({
    entry,
    skipUiSmoke: true,
    lane: {
      current: "v221",
      runtime: { singleVersionOk: true },
      review: { decision: "WAITING_NO_PACKAGE_REVIEW_DECISION", package: "cac-v222.zip" },
      release: { decision: "SUPERVISED_DRY_RUN_READY_REAL_BLOCKED", installAllowed: false, realContinueAllowed: false, unattendedAllowed: false },
    },
  });

  assert.equal(result.decision, "WAIT_REVIEW");
  assert.ok(result.blockers.includes("waiting_for_independent_review"));
  assert.equal(result.next, "wait_for_package_review_marker_or_send_short_followup");
});

test("allows bounded replacement after review acceptance and single-version state", async () => {
  const entry = {
    id: "v222",
    sourceZip: "D:/Gemini DL/cac-v222.zip",
    candidateRuntimeScript: "D:/candidate/runtime/cac-userscript.user.js",
    reviewState: "accepted",
    installState: "not_installed_waiting_review",
  };
  const result = await buildInstallReady({
    entry,
    skipUiSmoke: true,
    lane: {
      current: "v221",
      runtime: { singleVersionOk: true },
      review: { decision: "ACCEPT_FOR_LOCAL_UI_API_REVIEW", package: "cac-v222.zip" },
      release: { decision: "SUPERVISED_DRY_RUN_READY_REAL_BLOCKED", installAllowed: false, realContinueAllowed: false, unattendedAllowed: false },
    },
  });

  assert.equal(result.decision, "READY_FOR_BOUNDED_REPLACEMENT_INSTALL");
  assert.deepEqual(result.blockers, []);
  assert.ok(result.warnings.includes("default_release_gate_blocks_install_without_explicit_scoped_replacement_approval"));
});
