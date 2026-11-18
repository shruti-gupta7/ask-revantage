import test from "node:test";
import assert from "node:assert/strict";
import { classifyBotActivity, extractSources, isCorrelatedActivity, mergeSources } from "../lib/direct-line-classifier.js";

test("progress text does not complete a request", () => {
  assert.equal(classifyBotActivity({ type: "message", text: "Let me read the cab policy and related files." }).kind, "progress");
  assert.equal(classifyBotActivity({ type: "message", text: "I’m checking the policy documents now." }).kind, "progress");
});

test("a substantive answer is a final candidate", () => {
  const result = classifyBotActivity({ type: "message", text: "Employees can cancel an assigned cab before the published cutoff. See the source below." });
  assert.equal(result.kind, "final");
});

test("citations survive a separate metadata activity", () => {
  const sources = extractSources({
    type: "event",
    channelData: { citations: [{ title: "Cab Policy.pdf", url: "https://example.test/CabPolicy.pdf", downloadUrl: "https://example.test/CabPolicy.pdf?download=1" }] }
  });
  assert.equal(sources.length, 1);
  assert.equal(sources[0].title, "Cab Policy.pdf");
  assert.equal(sources[0].fileType, "PDF");
});

test("activity correlation prefers replyToId and filters old activities", () => {
  const request = { activityId: "user-1", userId: "user", sentAt: Date.parse("2026-11-18T10:00:00Z") };
  assert.equal(isCorrelatedActivity({ type: "message", replyToId: "user-1", from: { id: "bot" } }, request), true);
  assert.equal(isCorrelatedActivity({ type: "message", replyToId: "older", from: { id: "bot" } }, request), false);
  assert.equal(isCorrelatedActivity({ type: "message", timestamp: "2026-11-18T09:59:00Z", from: { id: "bot" } }, request), false);
});

test("source metadata is deduplicated", () => {
  const merged = mergeSources([{ title: "Policy", url: "https://example.test/policy", downloadUrl: "", fileType: "LINK" }], [{ title: "Policy", url: "https://example.test/policy", downloadUrl: "", fileType: "LINK" }]);
  assert.equal(merged.length, 1);
});
