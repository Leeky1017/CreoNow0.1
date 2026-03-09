import {
  _electron as electron,
  expect,
  test,
  type Page,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Create a unique E2E userData directory.
 *
 * Why: Windows E2E must be repeatable and must not touch a developer profile.
 */
async function createIsolatedUserDataDir(): Promise<string> {
  const base = path.join(os.tmpdir(), "CreoNow E2E 世界 ");
  const dir = await fs.mkdtemp(base);
  const nested = path.join(dir, `profile ${randomUUID()}`);
  await fs.mkdir(nested, { recursive: true });
  return nested;
}

/**
 * Resolve app root for Playwright Electron launch.
 *
 * Why: tests run from compiled JS paths and must be location-independent.
 */
function getAppRoot(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, "../..");
}

/**
 * Launch Electron app in E2E mode with isolated userDataDir.
 */
async function launchApp(args: { userDataDir: string }) {
  const appRoot = getAppRoot();
  const electronApp = await electron.launch({
    args: [appRoot],
    env: {
      ...process.env,
      CREONOW_E2E: "1",
      CREONOW_OPEN_DEVTOOLS: "0",
      CREONOW_USER_DATA_DIR: args.userDataDir,
      CREONOW_AI_PROVIDER: "anthropic",
    },
  });

  const page = await electronApp.firstWindow();
  await page.waitForFunction(() => window.__CN_E2E__?.ready === true);
  await expect(page.getByTestId("app-shell")).toBeVisible();
  await expect(page.getByTestId("ai-panel")).toBeVisible();
  return { electronApp, page };
}

/**
 * Fill the AI input and click Run.
 */
async function runInput(page: Page, input: string): Promise<void> {
  await page.getByTestId("ai-input").fill(input);
  await page.getByTestId("ai-send-stop").click();
}

test("skills: list + toggle disables run + command palette opens", async () => {
  const userDataDir = await createIsolatedUserDataDir();
  const { electronApp, page } = await launchApp({ userDataDir });

  const list = await page.evaluate(async () => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    return await window.creonow.invoke("skill:registry:list", {
      includeDisabled: true,
    });
  });
  expect(list.ok).toBe(true);
  if (!list.ok) {
    throw new Error(`Expected ok skill:registry:list, got: ${list.error.code}`);
  }

  const firstEnabledValid = list.data.items.find((s) => s.enabled && s.valid);
  if (!firstEnabledValid) {
    throw new Error("Expected at least 1 enabled+valid skill");
  }

  await page.getByTestId("ai-skills-toggle").click();
  await expect(
    page.getByTestId(`ai-skill-${firstEnabledValid.id}`),
  ).toBeVisible();
  await page.getByTestId(`ai-skill-${firstEnabledValid.id}`).click();

  // Wait for AI panel to be ready (stream toggle removed in UI refactoring)
  await expect(page.getByTestId("ai-input")).toBeVisible();
  await expect(page.getByTestId("ai-send-stop")).toBeVisible();

  await runInput(page, "hello");
  await expect(page.getByTestId("ai-output")).toContainText("E2E_RESULT");

  const toggled = await page.evaluate(async (id) => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    return await window.creonow.invoke("skill:registry:toggle", {
      id,
      enabled: false,
    });
  }, firstEnabledValid.id);
  expect(toggled.ok).toBe(true);
  if (!toggled.ok) {
    throw new Error(
      `Expected ok skill:registry:toggle, got: ${toggled.error.code}`,
    );
  }

  await runInput(page, "hello");
  await expect(page.getByTestId("ai-error-code")).toContainText("Skill is disabled");

  await page.keyboard.press("Control+P");
  await expect(page.getByTestId("command-palette")).toBeVisible();

  await electronApp.close();
});
