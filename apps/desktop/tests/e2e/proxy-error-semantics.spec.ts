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

async function ipcInvoke<C extends IpcChannel>(
  page: Page,
  channel: C,
  payload: IpcRequest<C>,
): Promise<IpcInvokeResult<C>> {
  return (await page.evaluate(
    async ({ channel, payload }) => {
      if (!window.creonow) {
        throw new Error("Missing window.creonow bridge");
      }
      return await window.creonow.invoke(channel as never, payload as never);
    },
    { channel, payload },
  )) as IpcInvokeResult<C>;
}

test("proxy disabled + missing api key => AI_NOT_CONFIGURED", async () => {
  const userDataDir = await createIsolatedUserDataDir();
  const appRoot = getAppRoot();

  const electronApp = await electron.launch({
    args: [appRoot],
    env: {
      ...process.env,
      CREONOW_E2E: "1",
      CREONOW_OPEN_DEVTOOLS: "0",
      CREONOW_USER_DATA_DIR: userDataDir,
      CREONOW_AI_PROVIDER: "anthropic",
      CREONOW_AI_BASE_URL: "http://127.0.0.1:9",
    },
  });

  const page = await electronApp.firstWindow();
  await page.waitForFunction(() => window.__CN_E2E__?.ready === true);
  await expect(page.getByTestId("app-shell")).toBeVisible();

  const run = await ipcInvoke(page, "ai:skill:run", {
    skillId: "builtin:polish",
    input: "hello",
    mode: "ask",
    model: "gpt-5.2",
    stream: false,
    context: {},
  });

  expect(run.ok).toBe(false);
  if (!run.ok) {
    expect(run.error.code).toBe("AI_NOT_CONFIGURED");
    expect(run.error.message.toLowerCase()).toContain("api key");
  }

  await electronApp.close();
});

test("proxy enabled + missing baseUrl => INVALID_ARGUMENT", async () => {
  const userDataDir = await createIsolatedUserDataDir();
  const appRoot = getAppRoot();

  const electronApp = await electron.launch({
    args: [appRoot],
    env: {
      ...process.env,
      CREONOW_E2E: "1",
      CREONOW_OPEN_DEVTOOLS: "0",
      CREONOW_USER_DATA_DIR: userDataDir,
      CREONOW_AI_PROXY_ENABLED: "1",
      CREONOW_AI_PROXY_BASE_URL: "",
    },
  });

  const page = await electronApp.firstWindow();
  await page.waitForFunction(() => window.__CN_E2E__?.ready === true);
  await expect(page.getByTestId("app-shell")).toBeVisible();

  const run = await ipcInvoke(page, "ai:skill:run", {
    skillId: "builtin:polish",
    input: "hello",
    mode: "ask",
    model: "gpt-5.2",
    stream: false,
    context: {},
  });

  expect(run.ok).toBe(false);
  if (!run.ok) {
    expect(run.error.code).toBe("INVALID_ARGUMENT");
    expect(run.error.message).toContain("baseUrl");
  }

  await electronApp.close();
});
