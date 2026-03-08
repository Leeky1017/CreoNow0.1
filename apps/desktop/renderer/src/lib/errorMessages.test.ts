import { describe, expect, it } from "vitest";

import type { IpcErrorCode } from "@shared/types/ipc-generated";

import { i18n } from "../i18n";
import zhCN from "../i18n/locales/zh-CN.json";
import en from "../i18n/locales/en.json";

import {
  getHumanErrorMessage,
  localizeIpcError,
  USER_FACING_MESSAGE_BY_CODE,
  type ErrorMessageResolver,
} from "./errorMessages";

/**
 * 全量错误码列表——与 ipc-generated.ts 中 IpcErrorCode 一一对应。
 * 若上游新增/删除错误码而此处未同步，TypeScript satisfies 断言将编译报错。
 */
const ALL_ERROR_CODES = Object.keys(USER_FACING_MESSAGE_BY_CODE) as IpcErrorCode[];

describe("errorMessages", () => {
  // ── Task 1.1: 全量映射覆盖 ──

  it("映射表类型为 Record<IpcErrorCode, ErrorMessageResolver>（编译即验证）", () => {
    const _check: Record<IpcErrorCode, ErrorMessageResolver> =
      USER_FACING_MESSAGE_BY_CODE;
    expect(_check).toBeDefined();
  });

  it("每个已注册错误码返回的文案不等于后端原始 message", () => {
    const raw = "raw backend message";
    for (const code of ALL_ERROR_CODES) {
      const result = getHumanErrorMessage({ code, message: raw });
      expect(result, `code=${code} 不应透传后端原始消息`).not.toBe(raw);
    }
  });

  it("映射表 key 数量与 i18n error.code 条目数量一致", () => {
    const mappingCount = ALL_ERROR_CODES.length;
    const zhKeys = Object.keys(zhCN.error.code);
    expect(mappingCount).toBe(zhKeys.length);
  });

  // ── Task 1.2: 兜底路径 ──

  it("未知错误码返回通用兜底文案，不透传后端 message", () => {
    const raw = "Something broke internally";
    const result = getHumanErrorMessage({
      code: "NONEXISTENT_CODE" as IpcErrorCode,
      message: raw,
    });
    expect(result).not.toBe(raw);
    expect(result).not.toContain(raw);
    // 兜底文案应为 error.generic 的翻译值
    expect(result).toBe(i18n.t("error.generic"));
  });

  // ── Task 1.3: IPC_TIMEOUT 参数化 ──

  it("IPC_TIMEOUT 提取超时时长 30000ms", () => {
    const result = getHumanErrorMessage({
      code: "IPC_TIMEOUT",
      message: "Request timed out (30000ms)",
    });
    expect(result).toContain("30000ms");
  });

  it("IPC_TIMEOUT 提取超时时长 5000ms", () => {
    const result = getHumanErrorMessage({
      code: "IPC_TIMEOUT",
      message: "Request timed out (5000ms)",
    });
    expect(result).toContain("5000ms");
  });

  it("IPC_TIMEOUT 无毫秒数时仍返回人话文案", () => {
    const result = getHumanErrorMessage({
      code: "IPC_TIMEOUT",
      message: "Request timed out",
    });
    expect(result).not.toMatch(/\(/u);
    expect(result).not.toMatch(/\d/u);
    expect(result).toBe(i18n.t("error.code.IPC_TIMEOUT"));
  });

  // ── Task 1.4: i18n 语言切换 ──

  it("中文 locale 返回中文，英文 locale 返回英文，两者不等", async () => {
    await i18n.changeLanguage("zh-CN");
    const zhResult = getHumanErrorMessage({
      code: "AI_RATE_LIMITED",
      message: "Rate limited",
    });

    await i18n.changeLanguage("en");
    const enResult = getHumanErrorMessage({
      code: "AI_RATE_LIMITED",
      message: "Rate limited",
    });

    expect(zhResult).not.toBe(enResult);
    expect(zhResult).toBe(zhCN.error.code.AI_RATE_LIMITED);
    expect(enResult).toBe(en.error.code.AI_RATE_LIMITED);
  });

  // ── Task 1.5: localizeIpcError 兼容性 ──

  it("localizeIpcError 保持结构、替换 message 为人话文案", () => {
    const localized = localizeIpcError({
      code: "FORBIDDEN",
      message: "Caller is not authorized",
      traceId: "t1",
      retryable: false,
    });

    expect(localized.code).toBe("FORBIDDEN");
    expect(localized.traceId).toBe("t1");
    expect(localized.retryable).toBe(false);
    expect(localized.message).toBe(i18n.t("error.code.FORBIDDEN"));
    expect(localized.message).not.toBe("Caller is not authorized");
  });

  it("localizeIpcError 对 DB_ERROR 不透传技术细节", () => {
    const localized = localizeIpcError({
      code: "DB_ERROR",
      message: "SQLITE_CONSTRAINT: UNIQUE constraint failed",
    });
    expect(localized.message).not.toContain("SQLITE_CONSTRAINT");
  });

  // ── Task 1.6: i18n key 完整性 ──

  it("zh-CN.json error.code 条目数等于 IpcErrorCode 成员数", () => {
    const zhKeys = Object.keys(zhCN.error.code);
    expect(zhKeys.length).toBe(ALL_ERROR_CODES.length);
  });

  it("en.json error.code 条目数与 zh-CN.json 一致", () => {
    const zhKeys = Object.keys(zhCN.error.code);
    const enKeys = Object.keys(en.error.code);
    expect(enKeys.length).toBe(zhKeys.length);
  });

  it("zh-CN.json 和 en.json 均包含 error.generic", () => {
    expect(zhCN.error.generic).toBeDefined();
    expect(en.error.generic).toBeDefined();
  });

  // ── Task 1.7: 文案质量检测 ──

  it("zh-CN 文案不含大写蛇形标识符（3+连续大写）", () => {
    for (const [code, value] of Object.entries(zhCN.error.code)) {
      expect(value, `code=${code}`).not.toMatch(/[A-Z_]{3,}/u);
    }
  });

  it("zh-CN 文案不含技术术语", () => {
    const techTerms =
      /SQLITE|ENOENT|Anthropic|OpenAI|ipcRenderer|constraint/iu;
    for (const [code, value] of Object.entries(zhCN.error.code)) {
      expect(value, `code=${code}`).not.toMatch(techTerms);
    }
  });

  it("zh-CN 文案不含 HTTP 状态码", () => {
    for (const [code, value] of Object.entries(zhCN.error.code)) {
      expect(value, `code=${code}`).not.toMatch(/\d{3}/u);
    }
  });

  it("zh-CN 每条文案不超过 30 个字符", () => {
    for (const [code, value] of Object.entries(zhCN.error.code)) {
      expect(
        value.length,
        `code=${code} 文案 "${value}" 超过 30 字`,
      ).toBeLessThanOrEqual(30);
    }
  });
});
