import assert from "node:assert/strict";
import test from "node:test";

import { buildReviewEscalation } from "../tools/cac-review-escalate.mjs";

const baseInstallReady = {
  decision: "WAIT_REVIEW",
  entryId: "v222",
  package: "cac-v222.zip",
  current: "v221",
  reviewDecision: "WAITING_NO_PACKAGE_REVIEW_DECISION",
  uiSmoke: { decision: "PASS_STATIC_UI_PARITY_CANDIDATE" },
  singleVersionOk: true,
};

test("waits shortly after a follow-up was sent", async () => {
  const result = await buildReviewEscalation({
    installReady: baseInstallReady,
    lane: { reviewerHeartbeat: { event: "followup_sent", status: "waiting", ageSec: 300 } },
    followupMinutes: 20,
    escalateMinutes: 60,
  });

  assert.equal(result.decision, "WAIT_REVIEW");
  assert.equal(result.next, "switch_to_nonblocking_local_work_until_review_marker_or_heartbeat_change");
});

test("escalates to a second reviewer after follow-up threshold", async () => {
  const result = await buildReviewEscalation({
    installReady: baseInstallReady,
    lane: { reviewerHeartbeat: { event: "followup_sent", status: "waiting", ageSec: 3900 } },
    escalateMinutes: 60,
    fallbackMinutes: 180,
  });

  assert.equal(result.decision, "ESCALATE_SECOND_REVIEWER");
});

test("prepares owner fallback only after longer wait and static gates", async () => {
  const result = await buildReviewEscalation({
    installReady: baseInstallReady,
    lane: { reviewerHeartbeat: { event: "followup_sent", status: "waiting", ageSec: 11000 } },
    escalateMinutes: 60,
    fallbackMinutes: 180,
  });

  assert.equal(result.decision, "PREPARE_OWNER_FALLBACK_PACKET");
});

test("ready install overrides waiting strategy", async () => {
  const result = await buildReviewEscalation({
    installReady: { ...baseInstallReady, decision: "READY_FOR_BOUNDED_REPLACEMENT_INSTALL" },
    lane: { reviewerHeartbeat: { event: "followup_sent", status: "waiting", ageSec: 10 } },
  });

  assert.equal(result.decision, "READY_FOR_BOUNDED_REPLACEMENT_INSTALL");
});
