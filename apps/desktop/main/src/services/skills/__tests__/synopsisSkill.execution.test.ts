import assert from "node:assert/strict";

import type { AiStreamEvent } from "@shared/types/ai";
import { createSkillExecutor } from "../skillExecutor";

function createNoopEmitter(): (event: AiStreamEvent) => void {
  return () => {};
}

function buildRunArgs() {
  return {
    skillId: "builtin:synopsis",
    input: "第十章完整内容",
    mode: "ask" as const,
    model: "gpt-5.2",
    stream: false,
    ts: Date.now(),
    emitEvent: createNoopEmitter(),
  };
}

/**
 * S3-SYN-SKILL-S2 [ADDED]
 * generates synopsis within 200-300 chars as single paragraph
 */
{
  const invalidShort = createSkillExecutor({
    resolveSkill: (skillId) => ({
      ok: true,
      data: {
        id: skillId,
        enabled: true,
        valid: true,
        prompt: {
          system: "synopsis-system",
          user: "{{input}}",
        },
      },
    }),
    runSkill: async () => ({
      ok: true,
      data: {
        executionId: "ex-synopsis-short",
        runId: "run-synopsis-short",
        outputText: "过短摘要。",
      },
    }),
  });

  const shortResult = await invalidShort.execute(buildRunArgs());
  assert.equal(shortResult.ok, false);
  if (shortResult.ok) {
    throw new Error("Expected short synopsis output to be rejected");
  }
  assert.equal(shortResult.error.code, "INVALID_ARGUMENT");

  const invalidParagraph = createSkillExecutor({
    resolveSkill: (skillId) => ({
      ok: true,
      data: {
        id: skillId,
        enabled: true,
        valid: true,
        prompt: {
          system: "synopsis-system",
          user: "{{input}}",
        },
      },
    }),
    runSkill: async () => ({
      ok: true,
      data: {
        executionId: "ex-synopsis-paragraph",
        runId: "run-synopsis-paragraph",
        outputText:
          "第一段：叙事进入转折并建立冲突。\n\n第二段：角色回收线索并推进下一章伏笔，形成列表化结构。",
      },
    }),
  });

  const paragraphResult = await invalidParagraph.execute(buildRunArgs());
  assert.equal(paragraphResult.ok, false);
  if (paragraphResult.ok) {
    throw new Error("Expected multi-paragraph synopsis output to be rejected");
  }
  assert.equal(paragraphResult.error.code, "INVALID_ARGUMENT");

  const validOutput =
    "主角在雨夜回到旧宅，发现遗嘱夹层中的手稿残页与失踪案相连，并从管家证词中确认父亲生前隐瞒了关键交易。" +
    "她在阁楼与弟弟激烈冲突后，决定暂缓公开证据，先追查账本来源以避免家族被反噬，同时安排同伴分头核验码头货单与银行流水。" +
    "章节后段她在旧书房复原时间线，锁定中间人联络窗口，并写下应对背叛与舆论反扑的预案，最终以她携带复印件独自赴港口会面收束，悬念继续抬升且人物动机保持一致。" +
    "与此同时，警方内部泄密风险被点明，她必须在天亮前完成证据分散与身份掩护。";

  const validSynopsis = createSkillExecutor({
    resolveSkill: (skillId) => ({
      ok: true,
      data: {
        id: skillId,
        enabled: true,
        valid: true,
        prompt: {
          system: "synopsis-system",
          user: "{{input}}",
        },
      },
    }),
    runSkill: async () => ({
      ok: true,
      data: {
        executionId: "ex-synopsis-ok",
        runId: "run-synopsis-ok",
        outputText: validOutput,
      },
    }),
  });

  const okResult = await validSynopsis.execute(buildRunArgs());
  assert.equal(okResult.ok, true);
}

// G0-02-SKILL-OUTPUT: non-synopsis skill with declared output constraints must validate runtime output
{
  const constrainedExecutor = createSkillExecutor({
    resolveSkill: (skillId) => ({
      ok: true,
      data: {
        id: skillId,
        enabled: true,
        valid: true,
        prompt: {
          system: "rewrite-system",
          user: "{{input}}",
        },
        output: {
          minChars: 20,
          maxChars: 40,
          singleParagraph: true,
        },
      },
    }),
    runSkill: async () => ({
      ok: true,
      data: {
        executionId: "ex-rewrite-too-short",
        runId: "run-rewrite-too-short",
        outputText: "太短。",
      },
    }),
  });

  const constrainedResult = await constrainedExecutor.execute({
    ...buildRunArgs(),
    skillId: "builtin:rewrite",
  });
  assert.equal(constrainedResult.ok, false);
  if (constrainedResult.ok) {
    throw new Error("Expected constrained non-synopsis output to be rejected");
  }
  assert.equal(constrainedResult.error.code, "INVALID_ARGUMENT");
}
