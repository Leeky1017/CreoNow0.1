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
  actionKey: "rename" | "delete";
}): Promise<void> {
  const row = args.page.getByTestId(`file-row-${args.documentId}`);
  await expect(row).toBeVisible();
  await row.scrollIntoViewIfNeeded();
  await row.click({ button: "right" });

  const menuItem = args.page.getByTestId(`context-menu-item-${args.actionKey}`);
  await expect(menuItem).toBeVisible();
  await menuItem.click();
}

test("documents filetree: create/switch/rename/delete + current restore", async () => {
  const userDataDir = await createIsolatedUserDataDir();
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const appRoot = path.resolve(__dirname, "../..");

  async function launch() {
    return await electron.launch({
      args: [appRoot],
      env: {
        ...process.env,
        CREONOW_E2E: "1",
        CREONOW_OPEN_DEVTOOLS: "0",
        CREONOW_USER_DATA_DIR: userDataDir,
      },
    });
  }

  const electronApp = await launch();
  const page = await electronApp.firstWindow();
  await page.waitForFunction(() => window.__CN_E2E__?.ready === true);
  await expect(page.getByTestId("app-shell")).toBeVisible();

  await createProjectViaWelcomeAndWaitForEditor({
    page,
    projectName: "Demo Project",
    templateLabel: "Other",
  });
  await expect(page.getByTestId("sidebar-files")).toBeVisible();

  const firstRow = page.locator('[data-testid^="file-row-"]').first();
  await expect(firstRow).toBeVisible();
  const firstRowIdAttr = await firstRow.getAttribute("data-testid");
  if (!firstRowIdAttr) {
    throw new Error("Missing data-testid on file row");
  }
  const docAId = parseDocumentId(firstRowIdAttr);

  await invokeFileRowContextAction({
    page,
    documentId: docAId,
    actionKey: "rename",
  });
  await page.getByTestId(`file-rename-input-${docAId}`).fill("Doc A");
  await page.getByTestId(`file-rename-confirm-${docAId}`).click();
  await expect(page.getByTestId(`file-row-${docAId}`)).toContainText("Doc A");

  const project = await page.evaluate(async () => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    return await window.creonow.invoke("project:project:getcurrent", {});
  });
  expect(project.ok).toBe(true);
  if (!project.ok) {
    throw new Error(`Expected ok current project, got: ${project.error.code}`);
  }

  const invalidRenameEmpty = await page.evaluate(
    async ({ projectIdParam, documentIdParam }) => {
      if (!window.creonow) {
        throw new Error("Missing window.creonow bridge");
      }
      return await window.creonow.invoke("file:document:update", {
        projectId: projectIdParam,
        documentId: documentIdParam,
        title: "",
      });
    },
    { projectIdParam: project.data.projectId, documentIdParam: docAId },
  );
  expect(invalidRenameEmpty.ok).toBe(false);
  if (invalidRenameEmpty.ok) {
    throw new Error("Expected INVALID_ARGUMENT on empty title rename");
  }
  expect(invalidRenameEmpty.error.code).toBe("INVALID_ARGUMENT");

  const invalidRenameLong = await page.evaluate(
    async ({ projectIdParam, documentIdParam }) => {
      if (!window.creonow) {
        throw new Error("Missing window.creonow bridge");
      }
      return await window.creonow.invoke("file:document:update", {
        projectId: projectIdParam,
        documentId: documentIdParam,
        title: "a".repeat(201),
      });
    },
    { projectIdParam: project.data.projectId, documentIdParam: docAId },
  );
  expect(invalidRenameLong.ok).toBe(false);
  if (invalidRenameLong.ok) {
    throw new Error("Expected INVALID_ARGUMENT on long title rename");
  }
  expect(invalidRenameLong.error.code).toBe("INVALID_ARGUMENT");

  await page.getByTestId("tiptap-editor").click();
  await page.keyboard.type("Alpha content");
  await expect(page.getByTestId("editor-autosave-status")).toHaveAttribute(
    "data-status",
    "saved",
  );

  await page.getByTestId("file-create").click();
  await expect(page.locator('[data-testid^="file-row-"]')).toHaveCount(2);

  await expect(page.getByTestId("editor-pane")).not.toHaveAttribute(
    "data-document-id",
    docAId,
  );
  const docBId =
    (await page.getByTestId("editor-pane").getAttribute("data-document-id")) ??
    "";
  if (!docBId) {
    throw new Error("Missing current document id after creating doc B");
  }
  expect(docBId).not.toBe(docAId);

  await expect(page.getByTestId("editor-pane")).toHaveAttribute(
    "data-document-id",
    docBId,
  );

  const docBRenameInput = page.getByTestId(`file-rename-input-${docBId}`);
  await expect(docBRenameInput).toBeVisible();
  await docBRenameInput.fill("Doc B");
  await page.getByTestId(`file-rename-confirm-${docBId}`).click();

  await page.getByTestId("tiptap-editor").click();
  await page.keyboard.type("Beta content");
  await expect(page.getByTestId("editor-autosave-status")).toHaveAttribute(
    "data-status",
    "saved",
  );

  await page
    .getByTestId(`file-row-${docAId}`)
    .click({ position: { x: 5, y: 5 } });
  await expect(page.getByTestId(`file-row-${docAId}`)).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByTestId("editor-pane")).toHaveAttribute(
    "data-document-id",
    docAId,
  );
  await expect(page.getByTestId("tiptap-editor")).toContainText(
    "Alpha content",
  );
  await expect(page.getByTestId("tiptap-editor")).not.toContainText(
    "Beta content",
  );

  await page
    .getByTestId(`file-row-${docBId}`)
    .click({ position: { x: 5, y: 5 } });
  await expect(page.getByTestId(`file-row-${docBId}`)).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByTestId("editor-pane")).toHaveAttribute(
    "data-document-id",
    docBId,
  );
  await expect(page.getByTestId("tiptap-editor")).toContainText("Beta content");
  await expect(page.getByTestId("tiptap-editor")).not.toContainText(
    "Alpha content",
  );

  await invokeFileRowContextAction({
    page,
    documentId: docBId,
    actionKey: "delete",
  });

  const dialog = page.getByTestId("system-dialog-delete");
  await expect(dialog).toBeVisible();
  await dialog.getByTestId("system-dialog-primary").click();
  await expect(dialog).not.toBeVisible();

  await expect(page.getByTestId(`file-row-${docBId}`)).toHaveCount(0);
  await expect(page.getByTestId("editor-pane")).toHaveAttribute(
    "data-document-id",
    docAId,
  );
  await expect(page.getByTestId("tiptap-editor")).toContainText(
    "Alpha content",
  );

  const currentDoc = await page.evaluate(async (projectIdParam) => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    return await window.creonow.invoke("file:document:getcurrent", {
      projectId: projectIdParam,
    });
  }, project.data.projectId);
  expect(currentDoc.ok).toBe(true);
  if (!currentDoc.ok) {
    throw new Error(
      `Expected ok current document, got: ${currentDoc.error.code}`,
    );
  }
  expect(currentDoc.data.documentId).toBe(docAId);

  await electronApp.close();

  const electronApp2 = await launch();
  const page2 = await electronApp2.firstWindow();
  await page2.waitForFunction(() => window.__CN_E2E__?.ready === true);
  await expect(page2.getByTestId("app-shell")).toBeVisible();
  await expect(page2.getByTestId("sidebar-files")).toBeVisible();
  await expect(page2.getByTestId("tiptap-editor")).toBeVisible();

  const project2 = await page2.evaluate(async () => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    return await window.creonow.invoke("project:project:getcurrent", {});
  });
  expect(project2.ok).toBe(true);
  if (!project2.ok) {
    throw new Error(`Expected ok current project, got: ${project2.error.code}`);
  }
  expect(project2.data.projectId).toBe(project.data.projectId);

  const currentDoc2 = await page2.evaluate(async (projectIdParam) => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    return await window.creonow.invoke("file:document:getcurrent", {
      projectId: projectIdParam,
    });
  }, project.data.projectId);
  expect(currentDoc2.ok).toBe(true);
  if (!currentDoc2.ok) {
    throw new Error(
      `Expected ok current document, got: ${currentDoc2.error.code}`,
    );
  }
  expect(currentDoc2.data.documentId).toBe(docAId);

  await expect(page2.getByTestId(`file-row-${docAId}`)).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page2.getByTestId("editor-pane")).toHaveAttribute(
    "data-document-id",
    docAId,
  );
  await expect(page2.getByTestId("tiptap-editor")).toContainText(
    "Alpha content",
  );

  await electronApp2.close();
});
