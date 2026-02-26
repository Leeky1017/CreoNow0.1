import assert from "node:assert/strict";

import {
  IMPLICIT_SIGNAL_WEIGHTS,
  createEpisodicMemoryService,
  createInMemoryEpisodeRepository,
} from "../../../main/src/services/memory/episodicMemoryService";

// Scenario Mapping: MS1-R2-S1
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

  // Act
  const res = await service.recordEpisode({
    projectId: "proj-1",
    chapterId: "chapter-7",
    sceneType: "action",
    skillUsed: "continue",
    inputContext: "当前是动作场景",
    candidates: ["A", "B", "C"],
    selectedIndex: 1,
    finalText: "主角冲上前",
    editDistance: 0.15,
  });

  // Assert
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.data.implicitSignal, "LIGHT_EDIT");
    assert.equal(res.data.implicitWeight, IMPLICIT_SIGNAL_WEIGHTS.LIGHT_EDIT);
  }

  const snapshot = repository.dump();
  assert.equal(snapshot.episodes.length, 1);
  assert.equal(snapshot.episodes[0]?.sceneType, "action");
  assert.equal(snapshot.episodes[0]?.selectedIndex, 1);
}
