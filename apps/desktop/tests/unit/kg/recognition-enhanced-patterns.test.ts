/* eslint-disable creonow/require-describe-in-tests -- This file is executed directly via tsx and relies on top-level async scenarios. */
import assert from "node:assert/strict";

import { KG_SUGGESTION_CHANNEL } from "@shared/types/kg";
import { createKnowledgeGraphIpcHarness } from "../../helpers/kg/harness";

type SuggestionPayload = {
  name: string;
  type: string;
  suggestionId: string;
  taskId: string;
};

async function waitForCondition(
  predicate: () => boolean,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) {
      return;
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  throw new Error(timeoutMessage);
}

// AC-2: Enhanced recognition patterns produce correct entity types

// Scenario: Chinese surname-based character recognition
{
  const harness = createKnowledgeGraphIpcHarness();
  try {
    const enqueueRes = await harness.invoke<{ taskId: string }>(
      "knowledge:recognition:enqueue",
      {
        projectId: harness.projectId,
        documentId: "doc-surname",
        sessionId: "session-surname",
        contentText: "赵云提枪上马，与张飞并肩作战。",
        traceId: "trace-surname-1",
      },
    );

    assert.equal(enqueueRes.ok, true);

    await waitForCondition(
      () => harness.getPushEvents(KG_SUGGESTION_CHANNEL).length >= 2,
      2_000,
      "expected at least 2 surname-based character suggestions",
    );

    const events = harness.getPushEvents<SuggestionPayload>(
      KG_SUGGESTION_CHANNEL,
    );
    const names = events.map((e) => e.payload.name);
    assert.ok(names.includes("赵云"), "should recognize 赵云");
    assert.ok(names.includes("张飞"), "should recognize 张飞");

    for (const event of events) {
      assert.equal(event.payload.type, "character");
    }
  } finally {
    harness.close();
  }
}

// Scenario: Location suffix recognition
{
  const harness = createKnowledgeGraphIpcHarness();
  try {
    await harness.invoke<{ taskId: string }>("knowledge:recognition:enqueue", {
      projectId: harness.projectId,
      documentId: "doc-location",
      sessionId: "session-location",
      contentText: "他们来到了龙虎山，途经碧水镇，最终到达凤凰殿。",
      traceId: "trace-location-1",
    });

    await waitForCondition(
      () => harness.getPushEvents(KG_SUGGESTION_CHANNEL).length >= 3,
      2_000,
      "expected at least 3 location suggestions",
    );

    const events = harness.getPushEvents<SuggestionPayload>(
      KG_SUGGESTION_CHANNEL,
    );
    const locationNames = events
      .filter((e) => e.payload.type === "location")
      .map((e) => e.payload.name);

    assert.ok(locationNames.includes("龙虎山"), "should recognize 龙虎山");
    assert.ok(locationNames.includes("碧水镇"), "should recognize 碧水镇");
    assert.ok(locationNames.includes("凤凰殿"), "should recognize 凤凰殿");
  } finally {
    harness.close();
  }
}

// Scenario: Event pattern recognition
{
  const harness = createKnowledgeGraphIpcHarness();
  try {
    await harness.invoke<{ taskId: string }>("knowledge:recognition:enqueue", {
      projectId: harness.projectId,
      documentId: "doc-events",
      sessionId: "session-events",
      contentText: "武林大会即将召开，此前的天山之战仍历历在目。",
      traceId: "trace-events-1",
    });

    await waitForCondition(
      () => harness.getPushEvents(KG_SUGGESTION_CHANNEL).length >= 2,
      2_000,
      "expected at least 2 event suggestions",
    );

    const events = harness.getPushEvents<SuggestionPayload>(
      KG_SUGGESTION_CHANNEL,
    );
    const eventNames = events
      .filter((e) => e.payload.type === "event")
      .map((e) => e.payload.name);

    assert.ok(eventNames.includes("武林大会"), "should recognize 武林大会");
    assert.ok(eventNames.includes("天山之战"), "should recognize 天山之战");
  } finally {
    harness.close();
  }
}

// Scenario: Item/artifact pattern recognition
{
  const harness = createKnowledgeGraphIpcHarness();
  try {
    await harness.invoke<{ taskId: string }>("knowledge:recognition:enqueue", {
      projectId: harness.projectId,
      documentId: "doc-items",
      sessionId: "session-items",
      contentText: "她手持倚天神剑，腰间别着九阳秘籍。",
      traceId: "trace-items-1",
    });

    await waitForCondition(
      () => harness.getPushEvents(KG_SUGGESTION_CHANNEL).length >= 2,
      2_000,
      "expected at least 2 item suggestions",
    );

    const events = harness.getPushEvents<SuggestionPayload>(
      KG_SUGGESTION_CHANNEL,
    );
    const itemNames = events
      .filter((e) => e.payload.type === "item")
      .map((e) => e.payload.name);

    assert.ok(itemNames.includes("倚天神剑"), "should recognize 倚天神剑");
    assert.ok(itemNames.includes("九阳秘籍"), "should recognize 九阳秘籍");
  } finally {
    harness.close();
  }
}

// Scenario: Quoted entity names with evidence source
{
  const harness = createKnowledgeGraphIpcHarness();
  try {
    await harness.invoke<{ taskId: string }>("knowledge:recognition:enqueue", {
      projectId: harness.projectId,
      documentId: "doc-quoted",
      sessionId: "session-quoted",
      contentText: "传说中的「天外飞仙」是一种独特的武功。",
      traceId: "trace-quoted-1",
    });

    await waitForCondition(
      () => harness.getPushEvents(KG_SUGGESTION_CHANNEL).length >= 1,
      2_000,
      "expected at least 1 quoted entity suggestion",
    );

    const events = harness.getPushEvents<SuggestionPayload>(
      KG_SUGGESTION_CHANNEL,
    );
    assert.ok(
      events.some((e) => e.payload.name === "天外飞仙"),
      "should recognize quoted entity 天外飞仙",
    );
  } finally {
    harness.close();
  }
}

// AC-3: Degraded recognition logs error
{
  const prevForceUnavailable =
    process.env.CREONOW_KG_RECOGNITION_FORCE_UNAVAILABLE;
  process.env.CREONOW_KG_RECOGNITION_FORCE_UNAVAILABLE = "1";

  const harness = createKnowledgeGraphIpcHarness();
  try {
    await harness.invoke<{ taskId: string }>("knowledge:recognition:enqueue", {
      projectId: harness.projectId,
      documentId: "doc-degrade",
      sessionId: "session-degrade",
      contentText: "测试降级路径。",
      traceId: "trace-degrade-1",
    });

    await waitForCondition(
      () =>
        harness.logs.error.some(
          (event) => event.event === "kg_recognition_unavailable",
        ),
      2_000,
      "expected kg_recognition_unavailable log on degraded path",
    );

    const pushEvents = harness.getPushEvents(KG_SUGGESTION_CHANNEL);
    assert.equal(
      pushEvents.length,
      0,
      "no suggestions should be pushed when recognition is unavailable",
    );
  } finally {
    harness.close();
    if (prevForceUnavailable === undefined) {
      delete process.env.CREONOW_KG_RECOGNITION_FORCE_UNAVAILABLE;
    } else {
      process.env.CREONOW_KG_RECOGNITION_FORCE_UNAVAILABLE =
        prevForceUnavailable;
    }
  }
}
