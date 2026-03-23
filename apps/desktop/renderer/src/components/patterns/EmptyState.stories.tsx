import type { Meta, StoryObj } from "@storybook/react";

import { EmptyState } from "./EmptyState";
import {
  ProjectIllustration,
  SearchIllustration,
  CharacterIllustration,
  AiIllustration,
  MemoryIllustration,
  OutlineIllustration,
} from "../../assets/illustrations/BrandIllustrations";
import { expect } from "@storybook/test";

const meta: Meta<typeof EmptyState> = {
  title: "Patterns/EmptyState",
  component: EmptyState,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 480,
          minHeight: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

/** variant="project" — 新项目首文件引导 */
export const Project: Story = {
  args: {
    variant: "project",
    onAction: () => {},
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** variant="files" — 无文件提示 */
export const Files: Story = {
  args: {
    variant: "files",
    onAction: () => {},
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** variant="search" — 搜索无结果提示 */
export const Search: Story = {
  args: {
    variant: "search",
    onAction: () => {},
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** variant="characters" — 无角色提示 */
export const Characters: Story = {
  args: {
    variant: "characters",
    onAction: () => {},
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** variant="generic" — 通用空态 */
export const Generic: Story = {
  args: {
    variant: "generic",
    onAction: () => {},
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 自定义 title + description 覆盖 variant 默认值 */
export const CustomContent: Story = {
  args: {
    variant: "generic",
    title: "暂无数据",
    description: "请添加内容以开始使用",
    actionLabel: "开始添加",
    onAction: () => {},
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 使用品牌插画的空态（项目） */
export const WithProjectIllustration: Story = {
  args: {
    variant: "project",
    illustration: (
      <ProjectIllustration className="h-24 w-24 text-[var(--color-fg-muted)]" />
    ),
    onAction: () => {},
  },
};

/** 使用品牌插画的空态（搜索） */
export const WithSearchIllustration: Story = {
  args: {
    variant: "search",
    illustration: (
      <SearchIllustration className="h-24 w-24 text-[var(--color-fg-muted)]" />
    ),
    onAction: () => {},
  },
};

/** 使用品牌插画的空态（角色） */
export const WithCharacterIllustration: Story = {
  args: {
    variant: "characters",
    illustration: (
      <CharacterIllustration className="h-24 w-24 text-[var(--color-fg-muted)]" />
    ),
    onAction: () => {},
  },
};

/** 使用品牌插画的空态（AI） */
export const WithAiIllustration: Story = {
  args: {
    variant: "generic",
    title: "开始对话",
    description: "向 AI 提问以获得创作灵感",
    illustration: (
      <AiIllustration className="h-24 w-24 text-[var(--color-fg-muted)]" />
    ),
    onAction: () => {},
    actionLabel: "开始",
  },
};

/** 使用品牌插画的空态（记忆） */
export const WithMemoryIllustration: Story = {
  args: {
    variant: "generic",
    title: "暂无记忆",
    description: "记忆会在创作过程中自动积累",
    illustration: (
      <MemoryIllustration className="h-24 w-24 text-[var(--color-fg-muted)]" />
    ),
  },
};

/** 使用品牌插画的空态（大纲） */
export const WithOutlineIllustration: Story = {
  args: {
    variant: "generic",
    title: "暂无大纲",
    description: "打开文档后自动生成大纲",
    illustration: (
      <OutlineIllustration className="h-24 w-24 text-[var(--color-fg-muted)]" />
    ),
  },
};
