import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storybookStaticDir = path.resolve(__dirname, "../../storybook-static");

/**
 * Playwright 视觉回归测试配置
 *
 * 使用 Storybook 静态构建产物（storybook-static/）作为测试目标。
 * CI 中先 `storybook:build` 再运行本配置。
 */
export default defineConfig({
  testDir: __dirname,
  testMatch: "*.visual.spec.ts",
  timeout: 30_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never", outputFolder: path.join(__dirname, "html-report") }]]
    : [["list"]],
  outputDir: path.join(__dirname, "test-results"),
  snapshotDir: path.join(__dirname, "__screenshots__"),
  snapshotPathTemplate: "{snapshotDir}/{arg}{ext}",

  use: {
    baseURL: "http://127.0.0.1:6007",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "dark",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 720 },
        colorScheme: "dark",
      },
    },
    {
      name: "light",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 720 },
        colorScheme: "light",
      },
    },
  ],

  webServer: {
    command: `python3 -m http.server 6007 -d ${storybookStaticDir}`,
    port: 6007,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
