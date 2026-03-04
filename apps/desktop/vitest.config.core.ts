import path from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync } from "node:fs";

import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAIN_SRC_ROOT = path.resolve(__dirname, "main/src");

function collectVitestTests(rootDir: string): string[] {
  const files: string[] = [];
  const stack: string[] = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "dist") {
          continue;
        }
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile() || !/\.(test|spec)\.(ts|tsx)$/u.test(entry.name)) {
        continue;
      }

      const isTsxTest = entry.name.endsWith(".tsx");
      const usesVitestImport = !isTsxTest
        ? /from\s+["']vitest["']/u.test(readFileSync(fullPath, "utf8"))
        : true;
      if (!usesVitestImport) {
        continue;
      }

      files.push(path.relative(__dirname, fullPath).split(path.sep).join("/"));
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

const vitestTestFiles = collectVitestTests(MAIN_SRC_ROOT);

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
    include: vitestTestFiles,
    exclude: ["**/node_modules/**", "**/dist/**"],
    passWithNoTests: true,
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
