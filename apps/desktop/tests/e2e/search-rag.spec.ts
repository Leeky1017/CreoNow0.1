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

async function createProjectAndGetId(page: Page): Promise<string> {
  await expect(page.getByTestId("dashboard-empty")).toBeVisible();
  await page.getByTestId("dashboard-create-first").click();
  await expect(page.getByTestId("create-project-dialog")).toBeVisible();
  await page.getByTestId("create-project-name").fill("Demo Project");
  await page.getByTestId("create-project-submit").click();

  await page.waitForFunction(async () => {
    if (!window.creonow) {
      return false;
    }
    const res = await window.creonow.invoke("project:project:getcurrent", {});
    return res.ok === true;
  });

  const current = await page.evaluate(async () => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    return await window.creonow.invoke("project:project:getcurrent", {});
  });
  expect(current.ok).toBe(true);
  if (!current.ok) {
    throw new Error(`Expected ok current project, got: ${current.error.code}`);
  }
  return current.data.projectId;
}

async function createDocWithText(args: {
  page: Page;
  projectId: string;
  title: string;
  text: string;
}): Promise<{ documentId: string }> {
  const created = await args.page.evaluate(
    async (payload) => {
      if (!window.creonow) {
        throw new Error("Missing window.creonow bridge");
      }
      return await window.creonow.invoke("file:document:create", {
        projectId: payload.projectId,
        title: payload.title,
      });
    },
    { projectId: args.projectId, title: args.title },
  );
  expect(created.ok).toBe(true);
  if (!created.ok) {
    throw new Error(`Expected ok create doc, got: ${created.error.code}`);
  }

  const documentId = created.data.documentId;
  const contentJson = JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: args.text }],
      },
    ],
  });

  const written = await args.page.evaluate(
    async (payload) => {
      if (!window.creonow) {
        throw new Error("Missing window.creonow bridge");
      }
      return await window.creonow.invoke("file:document:save", {
        projectId: payload.projectId,
        documentId: payload.documentId,
        contentJson: payload.contentJson,
        actor: "user",
        reason: "manual-save",
      });
    },
    { projectId: args.projectId, documentId, contentJson },
  );
  expect(written.ok).toBe(true);
  if (!written.ok) {
    throw new Error(`Expected ok write, got: ${written.error.code}`);
  }

  return { documentId };
}

test("search + rag retrieve: FTS hit + semantic rag chunk", async () => {
  const userDataDir = await createIsolatedUserDataDir();
  const { electronApp, page } = await launchApp({ userDataDir });

  const projectId = await createProjectAndGetId(page);
  const keyword = `E2EKEY_${randomUUID().replaceAll("-", "")}`;

  const { documentId } = await createDocWithText({
    page,
    projectId,
    title: "Search Target",
    text: `hello ${keyword} world`,
  });

  const searchRes = await page.evaluate(
    async (args) => {
      if (!window.creonow) {
        throw new Error("Missing window.creonow bridge");
      }
      return await window.creonow.invoke("search:fts:query", {
        projectId: args.projectId,
        query: args.keyword,
        limit: 10,
      });
    },
    { projectId, keyword },
  );
  expect(searchRes.ok).toBe(true);
  if (!searchRes.ok) {
    throw new Error(`Expected ok search, got: ${searchRes.error.code}`);
  }
  expect(searchRes.data.results.length).toBeGreaterThan(0);
  expect(searchRes.data.results[0]?.documentId).toBe(documentId);

  const ragRes = await page.evaluate(
    async (args) => {
      if (!window.creonow) {
        throw new Error("Missing window.creonow bridge");
      }
      return await window.creonow.invoke("rag:context:retrieve", {
        projectId: args.projectId,
        queryText: args.keyword,
        topK: 5,
        maxTokens: 300,
        model: "hash-v1",
      });
    },
    { projectId, keyword },
  );
  expect(ragRes.ok).toBe(true);
  if (!ragRes.ok) {
    throw new Error(`Expected ok rag, got: ${ragRes.error.code}`);
  }
  expect(ragRes.data.chunks.length).toBeGreaterThan(0);
  expect(ragRes.data.chunks[0]?.documentId).toBe(documentId);

  await runInput(page, keyword);
  await expect(page.getByTestId("ai-output")).toContainText("E2E_RESULT");

  await electronApp.close();
});

test("rag:context:retrieve degrades to FTS when embedding model is unavailable", async () => {
  const userDataDir = await createIsolatedUserDataDir();
  const { electronApp, page } = await launchApp({ userDataDir });

  const projectId = await createProjectAndGetId(page);
  const keyword = `E2EKEY_${randomUUID().replaceAll("-", "")}`;

  await createDocWithText({
    page,
    projectId,
    title: "Search Target",
    text: `hello ${keyword} world`,
  });

  const ragRes = await page.evaluate(
    async (args) => {
      if (!window.creonow) {
        throw new Error("Missing window.creonow bridge");
      }
      return await window.creonow.invoke("rag:context:retrieve", {
        projectId: args.projectId,
        queryText: args.keyword,
        topK: 5,
        maxTokens: 300,
        model: "default",
      });
    },
    { projectId, keyword },
  );

  expect(ragRes.ok).toBe(true);
  if (!ragRes.ok) {
    throw new Error(`Expected ok rag, got: ${ragRes.error.code}`);
  }
  expect(ragRes.data.fallback?.reason).toBe("MODEL_NOT_READY");
  expect(ragRes.data.chunks.length).toBeGreaterThan(0);

  await runInput(page, keyword);
  await expect(page.getByTestId("ai-output")).toContainText("E2E_RESULT");

  await electronApp.close();
});

test("rag:context:retrieve marks truncated when token budget is exceeded", async () => {
  const userDataDir = await createIsolatedUserDataDir();
  const { electronApp, page } = await launchApp({ userDataDir });

  const projectId = await createProjectAndGetId(page);
  const keyword = `KEY_${randomUUID().replaceAll("-", "")}`;

  await createDocWithText({
    page,
    projectId,
    title: "Doc A",
    text: `${keyword}`,
  });

  await createDocWithText({
    page,
    projectId,
    title: "Doc B",
    text: `${keyword} ${new Array(120).fill("extra").join(" ")}`,
  });

  const ragRes = await page.evaluate(
    async (args) => {
      if (!window.creonow) {
        throw new Error("Missing window.creonow bridge");
      }
      return await window.creonow.invoke("rag:context:retrieve", {
        projectId: args.projectId,
        queryText: args.keyword,
        topK: 5,
        minScore: -1,
        maxTokens: 10,
        model: "hash-v1",
      });
    },
    { projectId, keyword },
  );

  expect(ragRes.ok).toBe(true);
  if (!ragRes.ok) {
    throw new Error(`Expected ok rag, got: ${ragRes.error.code}`);
  }
  expect(ragRes.data.truncated).toBe(true);
  expect(ragRes.data.usedTokens).toBeLessThanOrEqual(10);

  await runInput(page, keyword);
  await expect(page.getByTestId("ai-output")).toContainText("E2E_RESULT");

  await electronApp.close();
});
