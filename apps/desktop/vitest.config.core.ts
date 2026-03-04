import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest 配置 — 后端（main/）覆盖率
 *
 * - 使用 node 环境
 * - 覆盖 main/src 下的所有测试
 * - 配置覆盖率报告
 */
export default defineConfig({
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../../packages/shared"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["main/src/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["main/src/**/*.{ts,tsx}"],
      exclude: [
        "main/src/**/*.test.{ts,tsx}",
      ],
    },
  },
});
