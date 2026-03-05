import { _electron as electron, expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createProjectViaWelcomeAndWaitForEditor } from "./_helpers/projectReadiness";

/**
 * Create a unique E2E userData directory.
 */
async function createIsolatedUserDataDir(): Promise<string> {
  const base = path.join(os.tmpdir(), "CreoNow E2E Outline ");
  const dir = await fs.mkdtemp(base);
  const nested = path.join(dir, `profile ${randomUUID()}`);
  await fs.mkdir(nested, { recursive: true });
  return nested;
}

test.describe("OutlinePanel", () => {
  test("derives outline from editor headings and navigates to them", async () => {
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
      projectName: "Outline Test Project",
      templateLabel: "Other",
    });

    // Type content with headings using TipTap's markdown-like shortcuts
    // # at the start of a line followed by space creates H1
    const editor = page.getByTestId("tiptap-editor");
    await editor.click();

    // Create H1: "Document Title"
    await page.keyboard.type("# Document Title");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Some introduction text.");
    await page.keyboard.press("Enter");

    // Create H2: "Chapter One"
    await page.keyboard.type("## Chapter One");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Content of chapter one.");
    await page.keyboard.press("Enter");

    // Create H3: "Section 1.1"
    await page.keyboard.type("### Section 1.1");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Details of section 1.1.");
    await page.keyboard.press("Enter");

    // Create H2: "Chapter Two"
    await page.keyboard.type("## Chapter Two");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Content of chapter two.");

    // Wait for autosave to complete
    await expect(page.getByTestId("editor-autosave-status")).toHaveAttribute(
      "data-status",
      "saved",
      { timeout: 5000 },
    );

    // Open the Outline panel via IconBar
    const outlineButton = page.getByTestId("icon-bar-outline");
    await outlineButton.click();

    // Wait for outline panel to be visible
    const outlinePanel = page.getByTestId("outline-panel");
    await expect(outlinePanel).toBeVisible();

    // Verify headings appear in the outline (scoped to outline panel)
    await expect(outlinePanel.getByText("Document Title")).toBeVisible();
    await expect(outlinePanel.getByText("Chapter One")).toBeVisible();
    await expect(outlinePanel.getByText("Section 1.1")).toBeVisible();
    await expect(outlinePanel.getByText("Chapter Two")).toBeVisible();

    // Click on "Chapter Two" in the outline to navigate
    const chapterTwoOutlineItem = page
      .locator('[data-testid="outline-panel"]')
      .getByText("Chapter Two");
    await chapterTwoOutlineItem.click();

    // Verify the editor is focused (navigation happened)
    // We can check by looking at aria-selected on the outline item
    // The clicked item should become active
    await expect(
      page.locator('[data-testid^="outline-item-"]', {
        hasText: "Chapter Two",
      }),
    ).toHaveAttribute("aria-selected", "true");

    await electronApp.close();
  });

  test("shows empty state when document has no headings", async () => {
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
      projectName: "Empty Outline Test",
      templateLabel: "Other",
    });

    // Type content without any headings
    const editor = page.getByTestId("tiptap-editor");
    await editor.click();
    await page.keyboard.type("Just some plain text without any headings.");

    // Open the Outline panel
    const outlineButton = page.getByTestId("icon-bar-outline");
    await outlineButton.click();

    // Wait for outline panel
    await expect(page.getByTestId("outline-panel")).toBeVisible();

    // Verify empty state is shown
    await expect(page.getByTestId("outline-empty-state")).toBeVisible();

    await electronApp.close();
  });

  test("updates outline when document content changes", async () => {
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
      projectName: "Dynamic Outline Test",
      templateLabel: "Other",
    });

    // Open the Outline panel first
    const outlineButton = page.getByTestId("icon-bar-outline");
    await outlineButton.click();
    const outlinePanel = page.getByTestId("outline-panel");
    await expect(outlinePanel).toBeVisible();

    // Initially should show empty state
    await expect(page.getByTestId("outline-empty-state")).toBeVisible();

    // Now add a heading in the editor
    const editor = page.getByTestId("tiptap-editor");
    await editor.click();
    await page.keyboard.type("# New Heading Added");
    await page.keyboard.press("Enter");

    // Wait a bit for debounced update
    await page.waitForTimeout(100);

    // Verify the heading appears in the outline (scoped to outline panel)
    await expect(outlinePanel.getByText("New Heading Added")).toBeVisible();

    // Empty state should no longer be visible
    await expect(page.getByTestId("outline-empty-state")).not.toBeVisible();

    await electronApp.close();
  });

  test("handles special characters and emoji in headings", async () => {
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
      projectName: "Special Chars Test",
      templateLabel: "Other",
    });

    // Type content with special characters
    const editor = page.getByTestId("tiptap-editor");
    await editor.click();

    // Create heading with Chinese characters
    await page.keyboard.type("# 第一章：序言");
    await page.keyboard.press("Enter");

    // Create heading with emoji
    await page.keyboard.type("## 🚀 Getting Started");
    await page.keyboard.press("Enter");

    // Open the Outline panel
    const outlineButton = page.getByTestId("icon-bar-outline");
    await outlineButton.click();
    const outlinePanel = page.getByTestId("outline-panel");
    await expect(outlinePanel).toBeVisible();

    // Verify special characters render correctly (scoped to outline panel)
    await expect(outlinePanel.getByText("第一章：序言")).toBeVisible();
    await expect(outlinePanel.getByText("🚀 Getting Started")).toBeVisible();

    await electronApp.close();
  });
});
