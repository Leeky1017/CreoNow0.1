import assert from "node:assert/strict";

import {
  createEpisodicMemoryService,
  createInMemoryEpisodeRepository,
} from "../../../main/src/services/memory/episodicMemoryService";

// Scenario Mapping: MS2-R3-S1
{
  // Arrange
  let now = 1_700_000_000_000;
  const repository = createInMemoryEpisodeRepository();
  const service = createEpisodicMemoryService({
    repository,
    logger: {
      logPath: "<test>",
      info: () => {},
      error: () => {},
    },
    now: () => now,
    distillScheduler: (job) => job(),
    distillLlm: () => [
      {
        rule: "偏好简洁表达",
        category: "style",
        confidence: 0.86,
        supportingEpisodes: ["recent-1", "recent-2"],
        contradictingEpisodes: [],
      },
    ],
  });

  const oldRule = service.addSemanticMemory({
    projectId: "proj-1",
    rule: "偏好华丽辞藻",
    category: "style",
    confidence: 0.92,
  });
  assert.equal(oldRule.ok, true);

  now += 40 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < 50; i += 1) {
    const recorded = await service.recordEpisode({
      projectId: "proj-1",
      chapterId: `chapter-${i}`,
      sceneType: "narration",
      skillUsed: "continue",
      inputContext: "叙事段落",
      candidates: ["A", "B"],
      selectedIndex: 0,
      finalText: "简洁句子",
      editDistance: 0.1,
    });
    assert.equal(recorded.ok, true);
  }

  // Act
  await Promise.resolve();
  await Promise.resolve();
  const listed = service.listSemanticMemory({ projectId: "proj-1" });

  // Assert
  assert.equal(listed.ok, true);
  if (listed.ok) {
    const updated = listed.data.items.find((item) =>
      item.rule.includes("偏好简洁表达"),
    );
    assert.ok(updated, "expected style rule switched to recent preference");
    assert.equal(updated?.recentlyUpdated, true);
  }
}
