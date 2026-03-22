import { test, expect } from "@playwright/test";
import { navigateToStory, screenshotName } from "./visual.setup";

/**
 * 布局组件视觉回归测试
 *
 * 覆盖 ≥5 个布局 Story，每个 Story 在 dark + light 主题下截图对比。
 * Story ID 取自 Storybook 构建产物 index.json。
 *
 * 注：AppShell 因依赖 AppToastProvider 在独立 iframe 中渲染失败，暂不纳入。
 */

const LAYOUT_STORIES: Array<{
  component: string;
  storyId: string;
  story: string;
}> = [
  {
    component: "iconbar",
    storyId: "layout-iconbar--default",
    story: "default",
  },
  {
    component: "iconbar",
    storyId: "layout-iconbar--dark-mode",
    story: "dark-mode",
  },
  {
    component: "resizer",
    storyId: "layout-resizer-basic--default",
    story: "default",
  },
  {
    component: "resizer",
    storyId: "layout-resizer-basic--dual-resizer",
    story: "dual-resizer",
  },
  {
    component: "rightpanel",
    storyId: "layout-rightpanel--ai-tab-default",
    story: "ai-tab-default",
  },
  {
    component: "rightpanel",
    storyId: "layout-rightpanel--quality-tab",
    story: "quality-tab",
  },
  {
    component: "sidebar",
    storyId: "layout-sidebar--default",
    story: "default",
  },
  {
    component: "sidebar",
    storyId: "layout-sidebar--collapsed",
    story: "collapsed",
  },
  {
    component: "statusbar",
    storyId: "layout-statusbar--normal-state",
    story: "normal-state",
  },
  {
    component: "statusbar",
    storyId: "layout-statusbar--saving-state",
    story: "saving-state",
  },
];

test.describe("Layout visual regression", () => {
  for (const { component, storyId, story } of LAYOUT_STORIES) {
    test(`${component} / ${story}`, async ({ page }, testInfo) => {
      const theme = testInfo.project.name as "dark" | "light";
      await navigateToStory(page, storyId, theme);

      await expect(page.locator("#storybook-root")).toHaveScreenshot(
        screenshotName(component, story, theme) + ".png",
      );
    });
  }
});
