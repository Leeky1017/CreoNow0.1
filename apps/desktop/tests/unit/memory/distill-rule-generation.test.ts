import assert from "node:assert/strict";

import {
  createEpisodicMemoryService,
  createInMemoryEpisodeRepository,
} from "../../../main/src/services/memory/episodicMemoryService";

// Scenario Mapping: MS2-R1-S2
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
        rule: "动作场景偏好短句",
        category: "pacing",
        confidence: 0.87,
        supportingEpisodes: ["ep-1", "ep-2"],
        contradictingEpisodes: [],
      },
    ],
  });

  for (let i = 0; i < 50; i += 1) {
    const recorded = await service.recordEpisode({
      projectId: "proj-1",
      chapterId: `chapter-${i}`,
      sceneType: "action",
      skillUsed: "continue",
      inputContext: "动作场景上下文",
      candidates: ["A", "B"],
      selectedIndex: 0,
      finalText: `片段-${i}`,
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
  assert.equal(distill.ok, true);
  assert.equal(listed.ok, true);
  if (listed.ok) {
    const target = listed.data.items.find((item) =>
      item.rule.includes("动作场景偏好短句"),
    );
    assert.ok(target, "expected distilled rule");
    assert.equal(target?.confidence, 0.87);
    assert.equal(target?.supportingEpisodes.length, 2);
    assert.equal(target?.contradictingEpisodes.length, 0);
    assert.equal(target?.userConfirmed, false);
  }
}
