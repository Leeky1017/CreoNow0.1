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

async function readMainLogTail(args: {
  userDataDir: string;
  maxLines?: number;
}): Promise<string> {
  const maxLines = args.maxLines ?? 80;
  const logPath = path.join(args.userDataDir, "logs", "main.log");
  try {
    const content = await fs.readFile(logPath, "utf8");
    const lines = content.trim().split(/\r?\n/u).filter(Boolean);
    return lines.slice(-maxLines).join("\n");
  } catch (error) {
    return `main.log unavailable: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
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

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

type ExportOutcome =
  | { kind: "success" }
  | { kind: "error"; code: string; message: string }
  | {
      kind: "timeout";
      successVisible: boolean;
      errorVisible: boolean;
      fileWritten: boolean;
    };

async function waitForExportOutcome(args: {
  page: Page;
  expectedAbsPath: string;
  timeoutMs?: number;
}): Promise<ExportOutcome> {
  const timeoutMs = args.timeoutMs ?? 30_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() <= deadline) {
    const [successVisible, errorVisible, fileWritten] = await Promise.all([
      args.page.getByTestId("export-success").isVisible(),
      args.page.getByTestId("export-error").isVisible(),
      fileExists(args.expectedAbsPath),
    ]);

    if (errorVisible) {
      const [codeText, messageText] = await Promise.all([
        args.page.getByTestId("export-error-code").textContent(),
        args.page.getByTestId("export-error-message").textContent(),
      ]);
      return {
        kind: "error",
        code: codeText?.trim() || "<missing code>",
        message: messageText?.trim() || "<missing message>",
      };
    }

    if (successVisible && fileWritten) {
      return { kind: "success" };
    }

    await args.page.waitForTimeout(250);
  }

  const [successVisible, errorVisible, fileWritten] = await Promise.all([
    args.page.getByTestId("export-success").isVisible(),
    args.page.getByTestId("export-error").isVisible(),
    fileExists(args.expectedAbsPath),
  ]);

  return {
    kind: "timeout",
    successVisible,
    errorVisible,
    fileWritten,
  };
}

test("export: markdown writes deterministic file under userData exports", async () => {
  const userDataDir = await createIsolatedUserDataDir();
  const appRoot = getAppRoot();

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
    projectName: "Export Project",
  });

  const current = await page.evaluate(async () => {
    if (!window.creonow) {
      throw new Error("Missing window.creonow bridge");
    }
    const project = await window.creonow.invoke(
      "project:project:getcurrent",
      {},
    );
    if (!project.ok) {
      throw new Error(project.error.message);
    }
    const doc = await window.creonow.invoke("file:document:getcurrent", {
      projectId: project.data.projectId,
    });
    if (!doc.ok) {
      throw new Error(doc.error.message);
    }
    return {
      projectId: project.data.projectId,
      documentId: doc.data.documentId,
    };
  });

  await page.getByTestId("tiptap-editor").click();
  await page.keyboard.type("Export me");
  await expect(page.getByTestId("editor-autosave-status")).toHaveAttribute(
    "data-status",
    "saved",
  );

  // Open Command Palette and trigger Export… command
  await page.keyboard.press("Control+P");
  await expect(page.getByTestId("command-palette")).toBeVisible();
  await page.getByTestId("command-item-export").click();

  // ExportDialog should open with markdown selected by default
  await expect(page.getByTestId("export-dialog")).toBeVisible();
  await expect(page.getByTestId("export-format-markdown")).toHaveAttribute(
    "data-state",
    "checked",
  );

  const expectedRelPath = path.join(
    "exports",
    current.projectId,
    `${current.documentId}.md`,
  );
  const expectedAbsPath = path.join(userDataDir, expectedRelPath);

  // Click Export button to start export
  await page.getByTestId("export-submit").click();

  // Require dual evidence: success UI + exported file written.
  const outcome = await waitForExportOutcome({
    page,
    expectedAbsPath,
    timeoutMs: 30_000,
  });

  if (outcome.kind === "error") {
    const mainLogTail = await readMainLogTail({ userDataDir });
    throw new Error(
      [
        "Export failed:",
        `${outcome.code}: ${outcome.message}`,
        "--- main.log tail ---",
        mainLogTail,
      ].join("\n"),
    );
  }

  if (outcome.kind === "timeout") {
    const mainLogTail = await readMainLogTail({ userDataDir });
    throw new Error(
      [
        "Export did not reach stable success state within timeout.",
        `state: successVisible=${outcome.successVisible}, errorVisible=${outcome.errorVisible}, fileWritten=${outcome.fileWritten}`,
        "--- main.log tail ---",
        mainLogTail,
      ].join("\n"),
    );
  }

  // Verify result fields are displayed
  await expect(page.getByTestId("export-success-relative-path")).toBeVisible();
  await expect(page.getByTestId("export-success-bytes-written")).toBeVisible();

  const exported = await fs.readFile(expectedAbsPath, "utf8");
  expect(exported).toContain("Export me");

  // Close dialog and app
  await page.getByTestId("export-done").click();
  await expect(page.getByTestId("export-dialog")).not.toBeVisible();

  await electronApp.close();
});
