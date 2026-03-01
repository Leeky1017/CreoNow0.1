import { describe, expect, it } from "vitest";

import {
  getUserFacingErrorMessage,
  localizeIpcError,
} from "./errorMessages";

describe("errorMessages", () => {
  it("maps backend english message to chinese by error code", () => {
    expect(
      getUserFacingErrorMessage({
        code: "VALIDATION_ERROR",
        message: 'Validation failed for field "name"',
      }),
    ).toBe("请求参数不符合契约");

    expect(
      getUserFacingErrorMessage({
        code: "AI_NOT_CONFIGURED",
        message: "AI service is not configured",
      }),
    ).toBe("请先在设置中配置 AI API Key");
  });

  it("preserves timeout detail when mapping IPC_TIMEOUT", () => {
    expect(
      getUserFacingErrorMessage({
        code: "IPC_TIMEOUT",
        message: "Request timed out (30000ms)",
      }),
    ).toBe("请求超时（30000ms）");
  });

  it("falls back to backend message when code is not mapped", () => {
    expect(
      getUserFacingErrorMessage({
        code: "SKILL_TIMEOUT",
        message: "Skill timed out",
      }),
    ).toBe("Skill timed out");
  });

  it("localizeIpcError keeps original structure and replaces message", () => {
    const localized = localizeIpcError({
      code: "FORBIDDEN",
      message: "Caller is not authorized",
      details: { reason: "origin_not_allowed" },
      traceId: "trace-1",
      retryable: false,
    });

    expect(localized).toEqual({
      code: "FORBIDDEN",
      message: "调用方未授权",
      details: { reason: "origin_not_allowed" },
      traceId: "trace-1",
      retryable: false,
    });
  });
});
