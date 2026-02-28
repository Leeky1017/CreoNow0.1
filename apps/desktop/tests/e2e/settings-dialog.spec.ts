import { _electron as electron, expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Create a unique E2E userData directory.
 *
 * Why: Windows E2E must be repeatable and validate non-ASCII/space paths.
 */
async function createIsolatedUserDataDir(): Promise<string> {
  const base = path.join(os.tmpdir(), "CreoNow E2E 世界 ");
  const dir = await fs.mkdtemp(base);
  const nested = path.join(dir, `profile ${randomUUID()}`);
  await fs.mkdir(nested, { recursive: true });
  return nested;
}

function getAppRoot(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, "../..");
}

test("settings-dialog: shortcut opens + theme persists + ai settings errors observable", async () => {
  const userDataDir = await createIsolatedUserDataDir();
  const appRoot = getAppRoot();

  async function launch() {
    const electronApp = await electron.launch({
      args: [appRoot],
      env: {
        ...process.env,
        CREONOW_E2E: "1",
        CREONOW_OPEN_DEVTOOLS: "0",
        CREONOW_USER_DATA_DIR: userDataDir,
      },
    });
    const page = await electronApp.firstWindow();
    await page.waitForFunction(() => window.__CN_E2E__?.ready === true);
    await expect(page.getByTestId("app-shell")).toBeVisible();
    return { electronApp, page };
  }

  const first = await launch();

  await first.page.keyboard.press("Control+,");
  await expect(first.page.getByTestId("settings-dialog")).toBeVisible();

  // AI settings: invalid empty baseUrl should show INVALID_ARGUMENT (observable failure)
  await first.page.getByTestId("settings-nav-ai").click();
  await expect(first.page.getByTestId("ai-save-btn")).toBeVisible();
  await first.page
    .getByTestId("ai-provider-mode")
    .selectOption("openai-compatible");
  await first.page.getByTestId("ai-base-url").fill("");
  await first.page.getByTestId("ai-save-btn").click();
  await expect(first.page.getByTestId("ai-error")).toContainText(
    "INVALID_ARGUMENT",
  );

  // Theme: switch to light and persist across restart
  await first.page.getByTestId("settings-nav-appearance").click();
  await first.page.getByTestId("theme-mode-light").click();
  await expect(first.page.locator("html")).toHaveAttribute(
    "data-theme",
    "light",
  );

  await first.electronApp.close();

  const second = await launch();
  await expect(second.page.locator("html")).toHaveAttribute(
    "data-theme",
    "light",
  );
  await second.electronApp.close();
});
