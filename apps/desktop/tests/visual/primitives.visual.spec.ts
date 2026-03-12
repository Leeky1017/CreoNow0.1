import { test, expect } from "@playwright/test";
import { navigateToStory, screenshotName } from "./visual.setup";

/**
 * 原语组件视觉回归测试
 *
 * 覆盖 ≥20 个原语 Story，每个 Story 在 dark + light 主题下截图对比。
 * Story ID 取自 Storybook 构建产物 index.json。
 */

/** 原语组件及其 Story ID */
const PRIMITIVE_STORIES: Array<{ component: string; storyId: string; story: string }> = [
  { component: "accordion", storyId: "primitives-accordion--default", story: "default" },
  { component: "avatar", storyId: "primitives-avatar--default", story: "default" },
  { component: "badge", storyId: "primitives-badge--default", story: "default" },
  { component: "button", storyId: "primitives-button--default", story: "default" },
  { component: "button", storyId: "primitives-button--all-variants", story: "all-variants" },
  { component: "button", storyId: "primitives-button--all-sizes", story: "all-sizes" },
  { component: "button", storyId: "primitives-button--loading", story: "loading" },
  { component: "button", storyId: "primitives-button--disabled", story: "disabled" },
  { component: "card", storyId: "primitives-card--default", story: "default" },
  { component: "checkbox", storyId: "primitives-checkbox--default", story: "default" },
  { component: "contextmenu", storyId: "primitives-contextmenu--default", story: "default" },
  { component: "dialog", storyId: "primitives-dialog--default", story: "default" },
  { component: "dropdownmenu", storyId: "primitives-dropdownmenu--default", story: "default" },
  { component: "heading", storyId: "primitives-heading--default", story: "default" },
  { component: "imageupload", storyId: "primitives-imageupload--default", story: "default" },
  { component: "input", storyId: "primitives-input--default", story: "default" },
  { component: "listitem", storyId: "primitives-listitem--default", story: "default" },
  { component: "popover", storyId: "primitives-popover--default", story: "default" },
  { component: "radio", storyId: "primitives-radio--default", story: "default" },
  { component: "scrollarea", storyId: "primitives-scrollarea--default", story: "default" },
  { component: "select", storyId: "primitives-select--default", story: "default" },
  { component: "skeleton", storyId: "primitives-skeleton--default", story: "default" },
  { component: "slider", storyId: "primitives-slider--default", story: "default" },
  { component: "spinner", storyId: "primitives-spinner--default", story: "default" },
  { component: "tabs", storyId: "primitives-tabs--default", story: "default" },
  { component: "text", storyId: "primitives-text--default", story: "default" },
  { component: "textarea", storyId: "primitives-textarea--default", story: "default" },
  { component: "toast", storyId: "primitives-toast--default", story: "default" },
  { component: "toggle", storyId: "primitives-toggle--default", story: "default" },
  { component: "tooltip", storyId: "primitives-tooltip--default", story: "default" },
];

test.describe("Primitives visual regression", () => {
  for (const { component, storyId, story } of PRIMITIVE_STORIES) {
    test(`${component} / ${story}`, async ({ page }, testInfo) => {
      const theme = testInfo.project.name as "dark" | "light";
      await navigateToStory(page, storyId, theme);

      await expect(page.locator("#storybook-root")).toHaveScreenshot(
        screenshotName(component, story, theme) + ".png",
      );
    });
  }
});
