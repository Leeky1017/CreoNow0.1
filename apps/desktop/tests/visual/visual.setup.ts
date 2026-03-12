import { type Page } from "@playwright/test";

/**
 * Storybook iframe URL 生成
 *
 * Storybook 在 iframe.html 中渲染每个 Story。
 * 直接使用 index.json 中的 Story ID 以避免 ID 转换错误。
 */
export function storyUrl(storyId: string): string {
  return `/iframe.html?id=${storyId}&viewMode=story`;
}

/**
 * 设置 Storybook iframe 的 data-theme 属性
 */
export async function setTheme(page: Page, theme: "dark" | "light"): Promise<void> {
  await page.evaluate((t) => {
    document.documentElement.setAttribute("data-theme", t);
  }, theme);
}

/**
 * 注入 CSS 使原生滚动条在截图中不可见，消除跨环境渲染差异。
 * Chromium 同时支持 ::-webkit-scrollbar 和 scrollbar-width。
 */
async function hideNativeScrollbars(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *::-webkit-scrollbar { display: none !important; }
      * { scrollbar-width: none !important; }
    `,
  });
}

/**
 * 导航到指定 Story 并设置主题，等待渲染完成
 */
export async function navigateToStory(
  page: Page,
  storyId: string,
  theme: "dark" | "light",
): Promise<void> {
  await page.goto(storyUrl(storyId), { waitUntil: "networkidle" });
  await setTheme(page, theme);
  await hideNativeScrollbars(page);
  // 等待主题 CSS 变量生效
  await page.waitForTimeout(200);
}

/**
 * 为截图生成一致的文件名
 *
 * {theme}/{component}-{story}.png
 */
export function screenshotName(
  component: string,
  story: string,
  theme: string,
): string {
  return `${theme}/${component}-${story}`;
}
