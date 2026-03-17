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

import type {
  IpcChannel,
  IpcInvokeResult,
  IpcRequest,
} from "@shared/types/ipc-generated";

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
async function launchApp(args: {
  userDataDir: string;
  env?: Record<string, string>;
}) {
  const appRoot = getAppRoot();
  const electronApp = await electron.launch({
    args: [appRoot],
    env: {
      ...process.env,
      CREONOW_E2E: "1",
      CREONOW_OPEN_DEVTOOLS: "0",
      CREONOW_USER_DATA_DIR: args.userDataDir,
      CREONOW_AI_PROVIDER: "openai",
      ...(args.env ?? {}),
    },
  });

  const page = await electronApp.firstWindow();
  await page.waitForFunction(() => window.__CN_E2E__?.ready === true);
  await expect(page.getByTestId("app-shell")).toBeVisible();
  return { electronApp, page, appRoot };
}

async function ipcInvoke<C extends IpcChannel>(
  page: Page,
  channel: C,
  payload: IpcRequest<C>,
): Promise<IpcInvokeResult<C>> {
  return (await page.evaluate(
    async ({ channel, payload }) => {
      if (!window.creonow) {
        throw new Error("IPC bridge not available");
      }
      return await window.creonow.invoke(channel as never, payload as never);
    },
    { channel, payload },
  )) as IpcInvokeResult<C>;
}

test("memory: injection preview + preference learning loop", async () => {
  const userDataDir = await createIsolatedUserDataDir();
  const { electronApp, page } = await launchApp({ userDataDir });

  // Switch to memory panel first (default is sidebar/files panel)
  await page.getByTestId("icon-bar-memory").click();
  await expect(page.getByTestId("memory-panel")).toBeVisible();

  const settingsRes = await ipcInvoke(page, "memory:settings:update", {
    patch: {
      injectionEnabled: true,
      preferenceLearningEnabled: true,
      privacyModeEnabled: false,
      preferenceLearningThreshold: 1,
    },
  });
  expect(settingsRes.ok).toBe(true);

  const created = await ipcInvoke(page, "memory:entry:create", {
    type: "preference",
    scope: "global",
    content: "Prefer: use bullets",
  });
  expect(created.ok).toBe(true);

  const preview1 = await ipcInvoke(page, "memory:injection:preview", {
    queryText: "hello",
  });
  expect(preview1.ok).toBe(true);
  if (preview1.ok) {
    const contents = preview1.data.items.map((item) => item.content);
    expect(contents).toContain("Prefer: use bullets");
  }

  const run1 = await ipcInvoke(page, "ai:skill:run", {
    skillId: "builtin:polish",
    input: "hello",
    mode: "ask",
    model: "gpt-5.2",
    stream: false,
    context: {},
  });
  expect(run1.ok).toBe(true);
  if (!run1.ok) {
    throw new Error(run1.error.message);
  }
  expect(run1.data.outputText ?? "").toContain("E2E_RESULT");

  const feedback = await ipcInvoke(page, "ai:skill:feedback", {
    runId: run1.data.runId,
    action: "accept",
    evidenceRef: "prefer-bullets",
  });
  expect(feedback.ok).toBe(true);

  const preview = await ipcInvoke(page, "memory:injection:preview", {
    queryText: "hello",
  });
  expect(preview.ok).toBe(true);
  if (preview.ok) {
    const contents = preview.data.items.map((item) => item.content);
    expect(contents).toContain("prefer-bullets");
  }

  const run2 = await ipcInvoke(page, "ai:skill:run", {
    skillId: "builtin:polish",
    input: "hello again",
    mode: "ask",
    model: "gpt-5.2",
    stream: false,
    context: {},
  });
  expect(run2.ok).toBe(true);
  if (!run2.ok) {
    throw new Error(run2.error.message);
  }
  expect(run2.data.outputText ?? "").toContain("E2E_RESULT");

  const disable = await ipcInvoke(page, "memory:settings:update", {
    patch: {
      injectionEnabled: false,
    },
  });
  expect(disable.ok).toBe(true);

  const run3 = await ipcInvoke(page, "ai:skill:run", {
    skillId: "builtin:polish",
    input: "hello no injection",
    mode: "ask",
    model: "gpt-5.2",
    stream: false,
    context: {},
  });
  expect(run3.ok).toBe(true);
  if (!run3.ok) {
    throw new Error(run3.error.message);
  }
  expect(run3.data.outputText ?? "").toContain("E2E_RESULT");

  const previewDisabled = await ipcInvoke(page, "memory:injection:preview", {
    queryText: "hello",
  });
  expect(previewDisabled.ok).toBe(true);
  if (previewDisabled.ok) {
    expect(previewDisabled.data.items.length).toBe(0);
  }

  await electronApp.close();

  const logPath = path.join(userDataDir, "logs", "main.log");
  const log = await fs.readFile(logPath, "utf8");
  expect(log).toContain("memory_injection_preview");
  expect(log).toContain("preference_signal_ingested");
});
