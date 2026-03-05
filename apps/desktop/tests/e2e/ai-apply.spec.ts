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

import { createProjectViaWelcomeAndWaitForEditor } from "./_helpers/projectReadiness";

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

async function launchApp(userDataDir: string) {
  const appRoot = getAppRoot();
  const electronApp = await electron.launch({
    args: [appRoot],
    env: {
      ...process.env,
      CREONOW_E2E: "1",
      CREONOW_OPEN_DEVTOOLS: "0",
      CREONOW_USER_DATA_DIR: userDataDir,
      CREONOW_AI_PROVIDER: "anthropic",
    },
  });

  const page = await electronApp.firstWindow();
  await page.waitForFunction(() => window.__CN_E2E__?.ready === true);
  await expect(page.getByTestId("app-shell")).toBeVisible();
  return { electronApp, page, appRoot };
}

async function createProjectAndFocusEditor(args: {
  page: Page;
}): Promise<void> {
  await createProjectViaWelcomeAndWaitForEditor({
    page: args.page,
    projectName: "Demo Project",
    clickEditor: true,
  });
}

async function selectLastWord(args: { page: Page }) {
  const page = args.page;
  for (let i = 0; i < 5; i += 1) {
    await page.keyboard.press("Shift+ArrowLeft");
  }
}

test("ai apply: success path writes actor=ai version + main.log evidence", async () => {
  const userDataDir = await createIsolatedUserDataDir();
  const { electronApp, page } = await launchApp(userDataDir);

  await createProjectAndFocusEditor({ page });
  await page.keyboard.type("Hello world");
  await selectLastWord({ page });
  await expect(page.getByTestId("ai-selection-reference-card")).toBeVisible();

  await page.getByTestId("ai-input").fill("replace-world");
  await page.getByTestId("ai-send-stop").click();

  const mainDiff = page.getByRole("main").getByTestId("ai-diff");
  await expect(mainDiff).toBeVisible();
  await expect(mainDiff).toContainText("-world");
  await expect(mainDiff).toContainText("E2E_RESULT");
  await page.getByTestId("ai-accept-all").click();
  await expect(mainDiff).toHaveCount(0);

  const documentId =
    (await page.getByTestId("editor-pane").getAttribute("data-document-id")) ??
    "";
  expect(documentId.length).toBeGreaterThan(0);

  const versions = await page.evaluate(async (documentIdParam) => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    return await window.creonow.invoke("version:snapshot:list", {
      documentId: documentIdParam,
    });
  }, documentId);
  expect(versions.ok).toBe(true);
  if (!versions.ok) {
    throw new Error(`Expected ok version list, got: ${versions.error.code}`);
  }

  const aiVersion = versions.data.items.find((v) => v.actor === "ai");
  expect(aiVersion).toBeTruthy();
  expect(aiVersion?.reason).toBe("ai-accept");

  await electronApp.close();

  const logPath = path.join(userDataDir, "logs", "main.log");
  const log = await fs.readFile(logPath, "utf8");
  expect(log).toContain("ai_apply_started");
  expect(log).toContain("ai_apply_succeeded");
});

test("ai apply: conflict path blocks overwrite + logs ai_apply_conflict", async () => {
  const userDataDir = await createIsolatedUserDataDir();
  const { electronApp, page } = await launchApp(userDataDir);

  await createProjectAndFocusEditor({ page });
  await page.keyboard.type("Hello world");
  await selectLastWord({ page });
  await expect(page.getByTestId("ai-selection-reference-card")).toBeVisible();

  await page.getByTestId("ai-input").fill("conflict-case");
  await page.getByTestId("ai-send-stop").click();
  const mainDiff = page.getByRole("main").getByTestId("ai-diff");
  await expect(mainDiff).toBeVisible();
  await page.getByTestId("ai-reject-all").click();

  await expect(mainDiff).toHaveCount(0);

  const documentId =
    (await page.getByTestId("editor-pane").getAttribute("data-document-id")) ??
    "";
  expect(documentId.length).toBeGreaterThan(0);

  const versions = await page.evaluate(async (documentIdParam) => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    return await window.creonow.invoke("version:snapshot:list", {
      documentId: documentIdParam,
    });
  }, documentId);
  expect(versions.ok).toBe(true);
  if (!versions.ok) {
    throw new Error(`Expected ok version list, got: ${versions.error.code}`);
  }
  expect(versions.data.items.some((v) => v.actor === "ai")).toBe(false);

  await electronApp.close();

  const logPath = path.join(userDataDir, "logs", "main.log");
  const log = await fs.readFile(logPath, "utf8");
  expect(log).not.toContain("ai_apply_succeeded");
});
