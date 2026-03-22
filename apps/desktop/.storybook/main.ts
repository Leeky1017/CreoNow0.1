import type { StorybookConfig } from "@storybook/react-vite";
import path from "node:path";
import { mergeConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const sharedAliasPath = path.resolve(__dirname, "../../../packages/shared");

/**
 * Storybook 配置
 *
 * 使用 @storybook/react-vite 框架，与 electron-vite 的 renderer 配置保持一致。
 * Stories 文件与组件放在同一目录，便于维护。
 */
const config: StorybookConfig = {
  stories: ["../renderer/src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {},
  /**
   * 自定义 Vite 配置
   *
   * 为 Storybook 添加 Tailwind CSS 插件，与 renderer 构建保持一致。
   */
  viteFinal: async (config) => {
    return mergeConfig(config, {
      plugins: [tailwindcss()],
      build: {
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
          onwarn(warning, defaultHandler) {
            if (
              warning.code === "MODULE_LEVEL_DIRECTIVE" &&
              typeof warning.id === "string" &&
              warning.id.includes("/node_modules/@radix-ui/")
            ) {
              return;
            }

            if (
              warning.code === "EVAL" &&
              typeof warning.id === "string" &&
              warning.id.includes(
                "/node_modules/@storybook/core/dist/preview/runtime.js",
              )
            ) {
              return;
            }

            defaultHandler(warning);
          },
        },
      },
      resolve: {
        alias: {
          "@shared": sharedAliasPath,
        },
      },
      server: {
        allowedHosts: true, // Allow any host for tunnel access
      },
    });
  },
};

export default config;
