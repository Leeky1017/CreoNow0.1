import assert from "node:assert/strict";

import {
  createEpisodicMemoryService,
  createInMemoryEpisodeRepository,
} from "../../../main/src/services/memory/episodicMemoryService";

// Scenario Mapping: MS1-R2-S3
{
  // Arrange
  const repository = createInMemoryEpisodeRepository();
  const service = createEpisodicMemoryService({
    repository,
    logger: {
      logPath: "<test>",
      info: () => {},
      error: () => {},
    },
    now: () => 1_700_000_000_000,
  });

  for (let i = 0; i < 6; i += 1) {
    const sceneType = i < 4 ? "dialogue" : "action";
    const finalText = i === 0 ? "角色低声对白，语气克制" : `历史片段 ${i}`;
    const saved = await service.recordEpisode({
      projectId: "proj-1",
      chapterId: `chapter-${i}`,
      sceneType,
      skillUsed: "continue",
      inputContext: "对白场景",
      candidates: ["A", "B"],
      selectedIndex: 0,
      finalText,
      editDistance: 0.1,
    });
    assert.equal(saved.ok, true);
  }

  // Act
  const result = service.queryEpisodes({
    projectId: "proj-1",
    sceneType: "dialogue",
    queryText: "对白 语气",
  });

  // Assert
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.ok(result.data.items.length >= 3);
    assert.ok(result.data.items.length <= 5);
    assert.equal(result.data.items[0]?.sceneType, "dialogue");
    assert.equal(result.data.items[0]?.finalText.includes("对白"), true);
  }
}
