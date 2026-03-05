/**
 * Vitest 全局设置文件
 *
 * 在每个测试文件执行前自动运行，用于：
 * - 扩展 expect 断言（@testing-library/jest-dom）
 * - 配置全局 Mock
 * - 设置测试环境
 */
import "@testing-library/jest-dom/vitest";

/**
 * i18n 初始化
 *
 * 确保所有使用 useTranslation() 的组件在测试中能获取翻译值，
 * 而非返回裸 key。使用 "en" 作为测试默认语言，与原有英文断言
 * 保持一致。如需测试 zh-CN，测试文件可自行 changeLanguage。
 */
import { i18n, initializeI18n } from "./renderer/src/i18n";

/**
 * 清理 DOM
 *
 * 每个测试后自动清理 DOM，确保测试隔离
 */
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll } from "vitest";
import { hotkeyManager } from "./renderer/src/lib/hotkeys/HotkeyManager";

/**
 * Mock browser APIs for Radix UI compatibility
 *
 * jsdom 不支持某些浏览器 API，但 Radix UI 组件需要使用。
 * 添加空函数/mock 实现以避免测试报错。
 *
 * @see https://github.com/radix-ui/primitives/issues/1822
 */
beforeAll(async () => {
  // Ensure i18n is fully initialized before any component renders.
  await initializeI18n();
  // Switch to English so test assertions match English UI strings.
  // The app default is zh-CN, but tests use English for consistency
  // with the primary locale and because most test assertions use English text.
  await i18n.changeLanguage("en");

  // Pointer Capture API
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }

  // scrollIntoView - Radix UI Select 需要
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }

  // ResizeObserver - 某些组件需要
  if (typeof window !== "undefined" && !window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

afterEach(() => {
  cleanup();
  // Reset the global HotkeyManager between test files to prevent cross-test interference
  hotkeyManager.destroy();
});
