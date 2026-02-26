import assert from "node:assert/strict";

import {
  createEpisodicMemoryService,
  createInMemoryEpisodeRepository,
} from "../../../main/src/services/memory/episodicMemoryService";

// Scenario Mapping: MS2-X-S2
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
    distillScheduler: (job) => job(),
    distillLlm: () => [
      {
        rule: "异常置信度规则",
        category: "style",
        confidence: 1.2,
        supportingEpisodes: ["ep-1"],
        contradictingEpisodes: [],
      },
    ],
  });

  for (let i = 0; i < 50; i += 1) {
    const recorded = await service.recordEpisode({
      projectId: "proj-1",
      chapterId: `chapter-${i}`,
      sceneType: "dialogue",
      skillUsed: "continue",
      inputContext: "对白上下文",
      candidates: ["A", "B"],
      selectedIndex: 0,
      finalText: `对白-${i}`,
      editDistance: 0.1,
    });
    assert.equal(recorded.ok, true);
  }

  // Act
  const distill = await service.distillSemanticMemory({
    projectId: "proj-1",
    trigger: "manual",
  });
  const listed = service.listSemanticMemory({ projectId: "proj-1" });

  // Assert
  assert.equal(distill.ok, false);
  if (!distill.ok) {
    assert.equal(distill.error.code, "MEMORY_CONFIDENCE_OUT_OF_RANGE");
  }
  assert.equal(listed.ok, true);
  if (listed.ok) {
    assert.equal(listed.data.items.length, 0);
  }
}
