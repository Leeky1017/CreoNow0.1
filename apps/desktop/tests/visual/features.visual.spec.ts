import { test, expect } from "@playwright/test";
import { navigateToStory, screenshotName } from "./visual.setup";

/**
 * 功能组件视觉回归测试（优先级前 10）
 *
 * 每个 Story 在 dark + light 主题下截图对比。
 * Story ID 取自 Storybook 构建产物 index.json。
 *
 * 覆盖范围对应 tasks.md AC-5 canonical top-10：
 * DashboardPage、EditorPane、AiPanel、SettingsDialog、ExportDialog、
 * CommandPalette、FileTreePanel、OutlinePanel、VersionHistoryPanel、SearchPanel
 */

/** 等待 selector 出现的辅助标记 */
interface FeatureStory {
  component: string;
  storyId: string;
  story: string;
  /** 若内容渲染在 portal / 异步初始化，指定等待可见的 selector */
  waitFor?: string;
  /** 覆盖截图目标 selector（默认 #storybook-root） */
  locator?: string;
}

const FEATURE_STORIES: FeatureStory[] = [
  {
    component: "dashboard",
    storyId: "features-dashboard-dashboardpage--default",
    story: "default",
  },
  {
    component: "dashboard",
    storyId: "features-dashboard-dashboardpage--empty",
    story: "empty",
  },
  {
    component: "editor-pane",
    storyId: "features-editor-editorpane--default",
    story: "default",
    waitFor: "[data-testid='editor-pane']",
  },
  {
    component: "editor-pane",
    storyId: "features-editor-editorpane--with-content",
    story: "with-content",
    waitFor: "[data-testid='editor-pane']",
  },
  {
    component: "ai-panel",
    storyId: "features-ai-chat--default",
    story: "default",
  },
  {
    component: "ai-panel",
    storyId: "features-ai-chat--empty-state",
    story: "empty-state",
  },
  {
    component: "settings-dialog",
    storyId: "features-settingsdialog--general",
    story: "general",
    waitFor: "[role='dialog']",
    locator: "body",
  },
  {
    component: "export-dialog",
    storyId: "features-exportdialog--config-view-default",
    story: "config-view-default",
    waitFor: "[role='dialog']",
    locator: "body",
  },
  {
    component: "command-palette",
    storyId: "features-commandpalette-basic--default",
    story: "default",
  },
  {
    component: "file-tree",
    storyId: "features-filetree-navigation--default",
    story: "default",
  },
  {
    component: "outline",
    storyId: "features-outline-basic--default-multi-level",
    story: "default-multi-level",
  },
  {
    component: "version-history",
    storyId: "features-versionhistory-list--default-with-history",
    story: "default-with-history",
  },
  {
    component: "search",
    storyId: "features-search-results--default",
    story: "default",
  },
];

test.describe("Features visual regression", () => {
  for (const {
    component,
    storyId,
    story,
    waitFor,
    locator,
  } of FEATURE_STORIES) {
    test(`${component} / ${story}`, async ({ page }, testInfo) => {
      const theme = testInfo.project.name as "dark" | "light";
      await navigateToStory(page, storyId, theme);

      if (waitFor) {
        await page
          .locator(waitFor)
          .first()
          .waitFor({ state: "visible", timeout: 10_000 });
      }

      const target = page.locator(locator ?? "#storybook-root");
      await expect(target).toHaveScreenshot(
        screenshotName(component, story, theme) + ".png",
      );
    });
  }
});
