import assert from "node:assert/strict";
import { vi, afterEach, beforeEach, describe, it } from "vitest";

import type { Logger } from "../../../logging/logger";
import { createJudgeQualityService } from "../judgeQualityService";
import { createAdvancedCheckRunner } from "../judgeAdvancedRunner";

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

let originalFetch: typeof globalThis.fetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("judgeAdvanced integration", () => {
  it("advanced checks return issues that merge with rule-engine issues", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '[{"severity":"high","label":"叙事断裂"}]',
            },
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const svc = createJudgeQualityService({
      logger: createLogger(),
      runAdvancedChecks: createAdvancedCheckRunner({
        logger: createLogger(),
        getProviderConfig: () => ({
          baseUrl: "http://localhost:8080",
          apiKey: "sk-test",
          model: "test-model",
        }),
      }),
    });

    const result = await svc.evaluate({
      projectId: "project-adv-1",
      traceId: "trace-adv-1",
      text: "我看向窗外。",
      contextSummary: "第一人称叙述",
    });

    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("expected success");
    assert.equal(result.data.partialChecksSkipped, false);
    assert.ok(
      result.data.labels.includes("叙事断裂"),
      "advanced check issue should be in labels",
    );
  });

  it("advanced checks throw and preserve rule issues with degrade marker", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error("network error")) as unknown as typeof fetch;

    const svc = createJudgeQualityService({
      logger: createLogger(),
      runAdvancedChecks: createAdvancedCheckRunner({
        logger: createLogger(),
        getProviderConfig: () => ({
          baseUrl: "http://localhost:8080",
          apiKey: null,
          model: "test-model",
        }),
      }),
    });

    const result = await svc.evaluate({
      projectId: "project-adv-2",
      traceId: "trace-adv-2",
      text: "我想逃离这条街。我想逃离这条街。",
      contextSummary: "第一人称叙述；关注重复检测",
    });

    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("expected success");
    assert.equal(result.data.partialChecksSkipped, true);
    assert.ok(
      result.data.labels.includes("检测到重复片段"),
      "rule-engine issues should still be present on degradation",
    );
    assert.ok(
      result.data.summary.includes("部分校验已跳过"),
      "summary should include degrade marker",
    );
  });
});
