import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

import {
  KG_SUGGESTION_CHANNEL,
  type KgSuggestionEvent,
} from "@shared/types/kg";
import { createKnowledgeGraphIpcHarness } from "../../helpers/kg/harness";

type RecognitionEnqueueDto = {
  taskId: string;
  status: "started" | "queued";
  queuePosition: number;
};

// KG3-R1-S1
// should trigger background recognition after autosave without blocking editor input
{
  const harness = createKnowledgeGraphIpcHarness();

  try {
    const startedAt = performance.now();
    const enqueueRes = await harness.invoke<RecognitionEnqueueDto>(
      "knowledge:recognition:enqueue",
      {
        projectId: harness.projectId,
        documentId: "doc-1",
        sessionId: "session-1",
        contentText: "林远的妹妹林小雨第一次出场。",
        traceId: "trace-autosave-1",
      },
    );
    const elapsedMs = performance.now() - startedAt;

    assert.equal(enqueueRes.ok, true);
    if (!enqueueRes.ok) {
      assert.fail("expected enqueue success");
    }

    assert.equal(elapsedMs < 50, true);
    assert.equal(
      enqueueRes.data.status === "started" ||
        enqueueRes.data.status === "queued",
      true,
    );

    const hasPush = await harness.waitForPushCount(KG_SUGGESTION_CHANNEL, 1);
    assert.equal(hasPush, true);

    const pushEvents = harness.takePushEvents<KgSuggestionEvent>(
      KG_SUGGESTION_CHANNEL,
    );
    assert.equal(pushEvents.length >= 1, true);

    const hasExpectedSuggestion = pushEvents.some((event) =>
      event.payload.name.includes("林小雨"),
    );
    assert.equal(hasExpectedSuggestion, true);

    const first = pushEvents[0]?.payload;
    assert.ok(first);
    if (!first) {
      assert.fail("expected pushed suggestion");
    }
    assert.equal(first.sessionId, "session-1");
  } finally {
    harness.close();
  }
}
