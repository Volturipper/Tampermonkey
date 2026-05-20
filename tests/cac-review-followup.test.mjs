import assert from "node:assert/strict";
import test from "node:test";

import { buildFollowupPrompt } from "../tools/cac-review-followup.mjs";

test("builds a short package-specific review follow-up", () => {
  const prompt = buildFollowupPrompt({
    entry: { sourceZip: "D:/Gemini DL/cac-v222.zip" },
    installReady: {
      package: "cac-v222.zip",
      decision: "WAIT_REVIEW",
      reviewDecision: "WAITING_NO_PACKAGE_REVIEW_DECISION",
      uiSmoke: { decision: "PASS_STATIC_UI_PARITY_CANDIDATE" },
      singleVersionOk: true,
      current: "v221",
      warnings: ["missing_update_or_download_url_blocks_public_raw_promotion"],
    },
  });

  assert.match(prompt, /`cac-v222\.zip`/);
  assert.match(prompt, /REVIEW_DECISION: ACCEPT_FOR_LOCAL_UI_API_REVIEW/);
  assert.match(prompt, /Do not review older v216\/v219\/v220\/v221 packages/);
  assert.match(prompt, /auto_update_findings/);
});
