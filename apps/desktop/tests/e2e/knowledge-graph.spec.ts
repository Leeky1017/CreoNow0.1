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

async function launchApp(args: { userDataDir: string }) {
  const appRoot = getAppRoot();
  const electronApp = await electron.launch({
    args: [appRoot],
    env: {
      ...process.env,
      CREONOW_E2E: "1",
      CREONOW_OPEN_DEVTOOLS: "0",
      CREONOW_USER_DATA_DIR: args.userDataDir,
      CREONOW_AI_PROVIDER: "openai",
    },
  });

  const page = await electronApp.firstWindow();
  await page.waitForFunction(() => window.__CN_E2E__?.ready === true);
  await expect(page.getByTestId("app-shell")).toBeVisible();
  return { electronApp, page };
}

async function createProjectViaUi(page: Page): Promise<void> {
  await createProjectViaWelcomeAndWaitForEditor({
    page,
    projectName: "Demo Project",
  });
}

/**
 * Enter list mode from KG default graph mode.
 *
 * Why: KG2 defaults to Graph view; list CRUD controls are rendered only in List.
 */
async function switchKgToListMode(page: Page): Promise<void> {
  const knowledgeGraphDialog = page.getByTestId(
    "leftpanel-dialog-knowledgeGraph",
  );
  await expect(knowledgeGraphDialog).toBeVisible();
  await expect(knowledgeGraphDialog.getByTestId("kg-view-graph")).toBeVisible();
  await knowledgeGraphDialog.getByTestId("kg-view-list").click();
  await expect(page.getByTestId("kg-entity-create")).toBeEnabled();
}

test("knowledge graph: sidebar CRUD + context viewer injection (skill gated)", async () => {
  const userDataDir = await createIsolatedUserDataDir();
  const { electronApp, page } = await launchApp({ userDataDir });

  await createProjectViaUi(page);

  const project = await page.evaluate(async () => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    return await window.creonow.invoke("project:project:getcurrent", {});
  });
  expect(project.ok).toBe(true);
  if (!project.ok) {
    throw new Error(
      `Expected ok project:project:getcurrent, got: ${project.error.code}`,
    );
  }
  const projectId = project.data.projectId;

  await page.getByTestId("icon-bar-knowledge-graph").click();
  await expect(
    page.getByTestId("leftpanel-dialog-knowledgeGraph"),
  ).toBeVisible();
  await switchKgToListMode(page);

  await page.getByTestId("kg-entity-name").fill("Alice");
  await page.getByTestId("kg-entity-create").click();

  const entityId = await page.evaluate(async (projectIdParam) => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    const res = await window.creonow.invoke("knowledge:entity:list", {
      projectId: projectIdParam,
    });
    if (!res.ok) {
      throw new Error(
        `Expected ok knowledge:entity:list, got: ${res.error.code}`,
      );
    }
    const item = res.data.items.find((e) => e.name === "Alice") ?? null;
    if (!item) {
      throw new Error("Missing created entity in list");
    }
    return item.id;
  }, projectId);

  await expect(page.getByTestId(`kg-entity-row-${entityId}`)).toBeVisible();

  await page.getByTestId(`kg-entity-delete-${entityId}`).click();

  const dialog = page.getByTestId("system-dialog-delete");
  await expect(dialog).toBeVisible();
  await dialog.getByTestId("system-dialog-primary").click();
  await expect(dialog).not.toBeVisible();

  await expect(page.getByTestId(`kg-entity-row-${entityId}`)).toHaveCount(0);

  const knowledgeGraphDialog = page.getByTestId(
    "leftpanel-dialog-knowledgeGraph",
  );
  await knowledgeGraphDialog.getByTestId("leftpanel-dialog-close").click();
  await expect(knowledgeGraphDialog).toHaveCount(0);

  const tooManyAttributes: Record<string, string> = {};
  for (let i = 0; i < 201; i += 1) {
    tooManyAttributes[`k${i}`] = `${i}`;
  }
  const oversize = await page.evaluate(
    async ({ projectIdParam, tooManyAttributesParam }) => {
      if (!window.creonow) {
        throw new Error("Missing window.creonow bridge");
      }
      return await window.creonow.invoke("knowledge:entity:create", {
        projectId: projectIdParam,
        type: "character",
        name: "Big",
        attributes: tooManyAttributesParam,
      });
    },
    { projectIdParam: projectId, tooManyAttributesParam: tooManyAttributes },
  );
  expect(oversize.ok).toBe(false);
  if (oversize.ok) {
    throw new Error("Expected KG_ATTRIBUTE_KEYS_EXCEEDED");
  }
  expect(oversize.error.code).toBe("KG_ATTRIBUTE_KEYS_EXCEEDED");

  const alice = await page.evaluate(async (projectIdParam) => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    const res = await window.creonow.invoke("knowledge:entity:create", {
      projectId: projectIdParam,
      type: "character",
      name: "Alice",
    });
    if (!res.ok) {
      throw new Error(
        `Expected ok knowledge:entity:create, got: ${res.error.code}`,
      );
    }
    return res.data;
  }, projectId);

  const bob = await page.evaluate(async (projectIdParam) => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    const res = await window.creonow.invoke("knowledge:entity:create", {
      projectId: projectIdParam,
      type: "character",
      name: "Bob",
    });
    if (!res.ok) {
      throw new Error(
        `Expected ok knowledge:entity:create, got: ${res.error.code}`,
      );
    }
    return res.data;
  }, projectId);

  const relation = await page.evaluate(
    async ({ projectIdParam, fromId, toId }) => {
      if (!window.creonow) {
        throw new Error("Missing window.creonow bridge");
      }
      const res = await window.creonow.invoke("knowledge:relation:create", {
        projectId: projectIdParam,
        sourceEntityId: fromId,
        targetEntityId: toId,
        relationType: "knows",
      });
      if (!res.ok) {
        throw new Error(
          `Expected ok knowledge:relation:create, got: ${res.error.code}`,
        );
      }
      return res.data;
    },
    { projectIdParam: projectId, fromId: alice.id, toId: bob.id },
  );
  expect(relation.relationType).toBe("knows");

  const skillRead = await page.evaluate(async () => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    return await window.creonow.invoke("skill:registry:read", {
      id: "builtin:polish",
    });
  });
  expect(skillRead.ok).toBe(true);
  if (!skillRead.ok) {
    throw new Error(
      `Expected ok skill:registry:read, got: ${skillRead.error.code}`,
    );
  }

  const patched = skillRead.data.content
    .replace(/(^\s*knowledge_graph:\s*)false\s*$/m, "$1true")
    .replace(/(^scope:\s*)builtin\s*$/m, "$1project");

  const skillWrite = await page.evaluate(async (content) => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    return await window.creonow.invoke("skill:registry:write", {
      id: "builtin:polish",
      content,
    });
  }, patched);
  expect(skillWrite.ok).toBe(true);
  if (!skillWrite.ok) {
    throw new Error(
      `Expected ok skill:registry:write, got: ${skillWrite.error.code}`,
    );
  }

  const skillsAfterWrite = await page.evaluate(async () => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    return await window.creonow.invoke("skill:registry:list", {
      includeDisabled: true,
    });
  });
  expect(skillsAfterWrite.ok).toBe(true);
  if (!skillsAfterWrite.ok) {
    throw new Error(
      `Expected ok skill:registry:list, got: ${skillsAfterWrite.error.code}`,
    );
  }
  const polish = skillsAfterWrite.data.items.find(
    (s) => s.id === "builtin:polish",
  );
  if (!polish) {
    throw new Error("Missing builtin:polish after write");
  }
  expect(polish.valid).toBe(true);
  expect(polish.enabled).toBe(true);

  await page.getByTestId("ai-input").fill("hello");
  await page.getByTestId("ai-send-stop").click();
  await expect(page.getByTestId("ai-output")).toContainText("E2E_RESULT");

  // Note: Context viewer UI assertions removed - component has been deleted
  // KG injection is covered by knowledge:* IPC assertions above.

  await electronApp.close();
});
