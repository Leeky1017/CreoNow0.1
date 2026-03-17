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

type IpcOk<T> = { ok: true; data: T };
type IpcErr = { ok: false; error: { code: string; message: string } };
type IpcEnvelope<T> = IpcOk<T> | IpcErr;

type StatsSummary = {
  wordsWritten: number;
  writingSeconds: number;
  skillsUsed: number;
  documentsCreated: number;
};

function isStatsSummary(x: unknown): x is StatsSummary {
  if (typeof x !== "object" || x === null) {
    return false;
  }
  const obj = x as Record<string, unknown>;
  return (
    typeof obj.wordsWritten === "number" &&
    typeof obj.writingSeconds === "number" &&
    typeof obj.skillsUsed === "number" &&
    typeof obj.documentsCreated === "number"
  );
}

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

async function ipcInvoke<T>(
  page: Page,
  channel: string,
  payload: unknown,
): Promise<IpcEnvelope<T>> {
  return (await page.evaluate(
    async ({ channel, payload }) => {
      if (!window.creonow) {
        throw new Error("Missing window.creonow bridge");
      }
      return await window.creonow.invoke(channel as never, payload as never);
    },
    { channel, payload },
  )) as IpcEnvelope<T>;
}

test("analytics: wordsWritten + skillsUsed increment and are visible", async () => {
  const userDataDir = await createIsolatedUserDataDir();
  const appRoot = getAppRoot();

  const electronApp = await electron.launch({
    args: [appRoot],
    env: {
      ...process.env,
      CREONOW_E2E: "1",
      CREONOW_OPEN_DEVTOOLS: "0",
      CREONOW_USER_DATA_DIR: userDataDir,
      CREONOW_AI_PROVIDER: "openai",
    },
  });

  const page = await electronApp.firstWindow();
  await page.waitForFunction(() => window.__CN_E2E__?.ready === true);
  await expect(page.getByTestId("app-shell")).toBeVisible();

  await createProjectViaWelcomeAndWaitForEditor({
    page,
    projectName: "Analytics Project",
  });

  const before = await ipcInvoke<{ date: string; summary: StatsSummary }>(
    page,
    "stats:day:gettoday",
    {},
  );
  expect(before.ok).toBe(true);
  if (!before.ok) {
    throw new Error(before.error.message);
  }
  expect(isStatsSummary(before.data.summary)).toBe(true);

  await page.getByTestId("tiptap-editor").click();
  await page.keyboard.type("hello world");
  await expect(page.getByTestId("editor-autosave-status")).toHaveAttribute(
    "data-status",
    "saved",
  );

  const afterWords = await ipcInvoke<{ date: string; summary: StatsSummary }>(
    page,
    "stats:day:gettoday",
    {},
  );
  expect(afterWords.ok).toBe(true);
  if (!afterWords.ok) {
    throw new Error(afterWords.error.message);
  }
  expect(afterWords.data.summary.wordsWritten).toBeGreaterThan(
    before.data.summary.wordsWritten,
  );

  const run = await ipcInvoke<{ runId: string; outputText?: string }>(
    page,
    "ai:skill:run",
    {
      skillId: "builtin:polish",
      input: "hello",
      mode: "ask",
      model: "gpt-5.2",
      stream: false,
      context: {},
    },
  );
  expect(run.ok).toBe(true);

  const afterSkills = await ipcInvoke<{ date: string; summary: StatsSummary }>(
    page,
    "stats:day:gettoday",
    {},
  );
  expect(afterSkills.ok).toBe(true);
  if (!afterSkills.ok) {
    throw new Error(afterSkills.error.message);
  }
  expect(afterSkills.data.summary.skillsUsed).toBeGreaterThan(
    before.data.summary.skillsUsed,
  );

  // Open SettingsDialog and view analytics (single-path settings surface)
  await page.getByTestId("icon-bar-settings").click();
  await expect(page.getByTestId("settings-dialog")).toBeVisible();
  await page.getByTestId("settings-nav-analytics").click();
  await expect(page.getByTestId("analytics-page")).toBeVisible();
  await expect(page.getByTestId("analytics-today-words")).not.toHaveText("0");
  await expect(page.getByTestId("analytics-today-skills")).not.toHaveText("0");

  await electronApp.close();
});
