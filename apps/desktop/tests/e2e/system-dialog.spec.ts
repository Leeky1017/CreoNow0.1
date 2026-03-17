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
 * Why: Windows E2E must be repeatable and validate non-ASCII/space paths.
 */
async function createIsolatedUserDataDir(): Promise<string> {
  const base = path.join(os.tmpdir(), "CreoNow E2E 世界 ");
  const dir = await fs.mkdtemp(base);
  const nested = path.join(dir, `profile ${randomUUID()}`);
  await fs.mkdir(nested, { recursive: true });
  return nested;
}

/**
 * Parse the documentId from a `file-row-<documentId>` test id.
 *
 * Why: E2E must be resilient to UUID-based document ids.
 */
function parseDocumentId(testId: string): string {
  const prefix = "file-row-";
  if (!testId.startsWith(prefix)) {
    throw new Error(`Unexpected file row test id: ${testId}`);
  }
  const id = testId.slice(prefix.length);
  if (id.length === 0) {
    throw new Error("Missing document id");
  }
  return id;
}

/**
 * Execute file-row context-menu action by visible label.
 *
 * Why: avoids flaky hover-only action trigger in headless Windows CI.
 */
async function invokeFileRowContextAction(args: {
  page: Page;
  documentId: string;
  actionKey: "delete";
}): Promise<void> {
  const row = args.page.getByTestId(`file-row-${args.documentId}`);
  await expect(row).toBeVisible();
  await row.scrollIntoViewIfNeeded();
  await row.click({ button: "right" });

  const menuItem = args.page.getByTestId(`context-menu-item-${args.actionKey}`);
  await expect(menuItem).toBeVisible();
  await menuItem.click();
}

test("system dialog: cancel/confirm across file tree + knowledge graph", async () => {
  const userDataDir = await createIsolatedUserDataDir();
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const appRoot = path.resolve(__dirname, "../..");

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

  await createProjectViaWelcomeAndWaitForEditor({
    page,
    projectName: "Demo Project",
    templateLabel: "Other",
  });
  await expect(page.getByTestId("sidebar-files")).toBeVisible();

  // ---------------------------------------------------------------------------
  // FileTreePanel: Cancel keeps document, Confirm deletes document
  // ---------------------------------------------------------------------------
  const firstRow = page.locator('[data-testid^="file-row-"]').first();
  await expect(firstRow).toBeVisible();
  const firstRowIdAttr = await firstRow.getAttribute("data-testid");
  if (!firstRowIdAttr) {
    throw new Error("Missing data-testid on file row");
  }
  const docAId = parseDocumentId(firstRowIdAttr);

  await page.getByTestId("file-create").click();

  const rowsAfterCreate = page.locator('[data-testid^="file-row-"]');
  await expect(rowsAfterCreate).toHaveCount(2);
  const row0Attr = await rowsAfterCreate.nth(0).getAttribute("data-testid");
  const row1Attr = await rowsAfterCreate.nth(1).getAttribute("data-testid");
  if (!row0Attr || !row1Attr) {
    throw new Error("Missing data-testid on file rows after create");
  }
  const id0 = parseDocumentId(row0Attr);
  const id1 = parseDocumentId(row1Attr);
  const docToDeleteId = id0 === docAId ? id1 : id0;

  const pendingRenameInput = page.getByTestId(
    `file-rename-input-${docToDeleteId}`,
  );
  if (await pendingRenameInput.isVisible()) {
    await pendingRenameInput.click();
    await pendingRenameInput.press("Escape");
    await expect(pendingRenameInput).toHaveCount(0);
  }

  await invokeFileRowContextAction({
    page,
    documentId: docToDeleteId,
    actionKey: "delete",
  });

  const documentDialog = page.getByTestId("system-dialog-delete");
  await expect(documentDialog).toBeVisible();
  await documentDialog.getByTestId("system-dialog-secondary").click();
  await expect(documentDialog).not.toBeVisible();
  await expect(page.getByTestId(`file-row-${docToDeleteId}`)).toBeVisible();

  await invokeFileRowContextAction({
    page,
    documentId: docToDeleteId,
    actionKey: "delete",
  });

  await expect(documentDialog).toBeVisible();
  await documentDialog.getByTestId("system-dialog-primary").click();
  await expect(documentDialog).not.toBeVisible();
  await expect(page.getByTestId(`file-row-${docToDeleteId}`)).toHaveCount(0);

  // ---------------------------------------------------------------------------
  // KnowledgeGraphPanel: Cancel keeps entity, Confirm deletes entity
  // ---------------------------------------------------------------------------
  await page.getByTestId("icon-bar-knowledge-graph").click();
  const knowledgeGraphDialog = page.getByTestId(
    "leftpanel-dialog-knowledgeGraph",
  );
  await expect(knowledgeGraphDialog).toBeVisible();
  await expect(knowledgeGraphDialog.getByTestId("kg-view-graph")).toBeVisible();
  await knowledgeGraphDialog.getByTestId("kg-view-list").click();
  await expect(page.getByTestId("kg-entity-create")).toBeEnabled();

  await page.getByTestId("kg-entity-name").fill("Test Entity");
  await page.getByTestId("kg-entity-create").click();

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
    const item = res.data.items.find((e) => e.name === "Test Entity") ?? null;
    if (!item) {
      throw new Error("Missing created entity in list");
    }
    return item.id;
  }, projectId);

  await expect(page.getByTestId(`kg-entity-row-${entityId}`)).toBeVisible();

  const entityDialog = page.getByTestId("system-dialog-delete");
  await page.getByTestId(`kg-entity-delete-${entityId}`).click();
  await expect(entityDialog).toBeVisible();
  await entityDialog.getByTestId("system-dialog-secondary").click();
  await expect(entityDialog).not.toBeVisible();
  await expect(page.getByTestId(`kg-entity-row-${entityId}`)).toBeVisible();

  await page.getByTestId(`kg-entity-delete-${entityId}`).click();
  await expect(entityDialog).toBeVisible();
  await entityDialog.getByTestId("system-dialog-primary").click();
  await expect(entityDialog).not.toBeVisible();
  await expect(page.getByTestId(`kg-entity-row-${entityId}`)).toHaveCount(0);

  await electronApp.close();
});
