import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach, vi } from "vitest";

import { parseJudgeResponse, createAdvancedCheckRunner } from "../judgeAdvancedRunner";
import type { Logger } from "../../../logging/logger";

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

describe("parseJudgeResponse", () => {
  it("parses a valid JSON array", () => {
    const raw = '[{"severity":"high","label":"视角不一致"},{"severity":"low","label":"轻微重复"}]';
    const result = parseJudgeResponse(raw);
    assert.equal(result.length, 2);
    assert.equal(result[0]!.severity, "high");
    assert.equal(result[0]!.label, "视角不一致");
    assert.equal(result[1]!.severity, "low");
    assert.equal(result[1]!.label, "轻微重复");
  });

  it("extracts JSON array from markdown-wrapped response", () => {
    const raw = '```json\n[{"severity":"medium","label":"风格偏移"}]\n```';
    const result = parseJudgeResponse(raw);
    assert.equal(result.length, 1);
    assert.equal(result[0]!.severity, "medium");
  });

  it("returns empty array when no JSON found", () => {
    const result = parseJudgeResponse("没有发现任何问题。");
    assert.equal(result.length, 0);
  });

  it("returns empty array for empty JSON array", () => {
    const result = parseJudgeResponse("[]");
    assert.equal(result.length, 0);
  });

  it("filters out items with invalid severity", () => {
    const raw = '[{"severity":"critical","label":"严重问题"},{"severity":"high","label":"有效问题"}]';
    const result = parseJudgeResponse(raw);
    assert.equal(result.length, 1);
    assert.equal(result[0]!.severity, "high");
  });

  it("filters out items with empty label", () => {
    const raw = '[{"severity":"high","label":""},{"severity":"medium","label":"有效"}]';
    const result = parseJudgeResponse(raw);
    assert.equal(result.length, 1);
    assert.equal(result[0]!.label, "有效");
  });
});

describe("createAdvancedCheckRunner", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("throws when provider is not configured", async () => {
    const runner = createAdvancedCheckRunner({
      logger: createLogger(),
      getProviderConfig: () => null,
    });

    await assert.rejects(
      () =>
        runner({
          projectId: "p1",
          traceId: "t1",
          text: "测试文本",
          contextSummary: "第一人称",
        }),
      { message: "provider not configured" },
    );
  });

  it("returns parsed issues on successful provider response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '[{"severity":"high","label":"视角错误"}]',
            },
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const runner = createAdvancedCheckRunner({
      logger: createLogger(),
      getProviderConfig: () => ({
        baseUrl: "http://localhost:8080",
        apiKey: "sk-test",
        model: "test-model",
      }),
    });

    const issues = await runner({
      projectId: "p1",
      traceId: "t1",
      text: "他看向窗外",
      contextSummary: "第一人称叙述",
    });

    assert.equal(issues.length, 1);
    assert.equal(issues[0]!.severity, "high");
    assert.equal(issues[0]!.label, "视角错误");
  });

  it("throws on HTTP error response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;

    const runner = createAdvancedCheckRunner({
      logger: createLogger(),
      getProviderConfig: () => ({
        baseUrl: "http://localhost:8080",
        apiKey: null,
        model: "test-model",
      }),
    });

    await assert.rejects(
      () =>
        runner({
          projectId: "p1",
          traceId: "t1",
          text: "文本",
          contextSummary: "约束",
        }),
      { message: "provider returned 500" },
    );
  });

  it("throws on invalid response shape", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }),
    }) as unknown as typeof fetch;

    const runner = createAdvancedCheckRunner({
      logger: createLogger(),
      getProviderConfig: () => ({
        baseUrl: "http://localhost:8080",
        apiKey: null,
        model: "test-model",
      }),
    });

    await assert.rejects(
      () =>
        runner({
          projectId: "p1",
          traceId: "t1",
          text: "文本",
          contextSummary: "约束",
        }),
      { message: "invalid provider response shape" },
    );
  });
});
