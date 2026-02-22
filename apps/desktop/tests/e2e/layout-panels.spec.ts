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

async function createIsolatedUserDataDir(): Promise<string> {
  const base = path.join(os.tmpdir(), "CreoNow E2E 世界 ");
  const dir = await fs.mkdtemp(base);
  const nested = path.join(dir, `profile ${randomUUID()}`);
  await fs.mkdir(nested, { recursive: true });
  return nested;
}

async function getWidth(page: Page, testId: string): Promise<number> {
  return await page.getByTestId(testId).evaluate((el) => {
    if (el instanceof HTMLElement) {
      // Prefer the explicit state-driven width to avoid platform/DPI differences
      // when reading bounding boxes in Electron on Windows.
      const raw = el.style.width;
      const parsed = Number.parseFloat(raw);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return el.getBoundingClientRect().width;
  });
}

async function dragBy(
  page: Page,
  testId: string,
  deltaX: number,
): Promise<void> {
  const handle = page.getByTestId(testId);
  const box = await handle.boundingBox();
  if (!box) {
    throw new Error(`Missing bounding box for ${testId}`);
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY);
  await page.mouse.up();
}

test("layout: resizer clamp + double-click reset + persistence", async () => {
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

  await dragBy(page, "resize-handle-sidebar", -2000);
  expect(await getWidth(page, "layout-sidebar")).toBeGreaterThanOrEqual(180);

  await dragBy(page, "resize-handle-sidebar", 2000);
  expect(await getWidth(page, "layout-sidebar")).toBeLessThanOrEqual(400);

  await page.getByTestId("resize-handle-sidebar").dblclick();
  expect(Math.round(await getWidth(page, "layout-sidebar"))).toBe(240);

  await dragBy(page, "resize-handle-sidebar", 64);
  const persisted = Math.round(await getWidth(page, "layout-sidebar"));
  await electronApp.close();

  const electronApp2 = await launch();
  const page2 = await electronApp2.firstWindow();
  await page2.waitForFunction(() => window.__CN_E2E__?.ready === true);
  await expect(page2.getByTestId("app-shell")).toBeVisible();
  expect(Math.round(await getWidth(page2, "layout-sidebar"))).toBe(persisted);
  await electronApp2.close();
});
