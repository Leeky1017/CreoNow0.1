import assert from "node:assert/strict";

import {
  createEpisodicMemoryService,
  createInMemoryEpisodeRepository,
} from "../../../main/src/services/memory/episodicMemoryService";

// Scenario Mapping: MS2-R1-S3
{
  // Arrange
  let llmAvailable = false;
  const repository = createInMemoryEpisodeRepository();
  const service = createEpisodicMemoryService({
    repository,
    logger: {
      logPath: "<test>",
      info: () => {},
      error: () => {},
    },
    now: () => 1_700_000_000_000,
    distillLlm: () => {
      if (!llmAvailable) {
        throw new Error("llm unavailable");
      }
      return [
        {
          rule: "对白风格偏好口语化",
          category: "style",
          confidence: 0.82,
          supportingEpisodes: [],
          contradictingEpisodes: [],
        },
      ];
    },
  });

  const baselineAdd = service.addSemanticMemory({
    projectId: "proj-1",
    rule: "保留现有规则",
    category: "style",
    confidence: 0.6,
  });
  assert.equal(baselineAdd.ok, true);

  // Act
  const failed = await service.distillSemanticMemory({
    projectId: "proj-1",
    trigger: "manual",
  });
  const listedAfterFail = service.listSemanticMemory({ projectId: "proj-1" });

  llmAvailable = true;
  const retried = await service.distillSemanticMemory({
    projectId: "proj-1",
    trigger: "manual",
  });

  // Assert
  assert.equal(failed.ok, false);
  if (!failed.ok) {
    assert.equal(failed.error.code, "MEMORY_DISTILL_LLM_UNAVAILABLE");
  }

  assert.equal(listedAfterFail.ok, true);
  if (listedAfterFail.ok) {
    assert.equal(
      listedAfterFail.data.items.some((item) => item.rule === "保留现有规则"),
      true,
    );
  }

  assert.equal(retried.ok, true);
}
