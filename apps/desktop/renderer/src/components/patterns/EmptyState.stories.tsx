import type { Meta, StoryObj } from "@storybook/react";

import { EmptyState } from "./EmptyState";

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
};

/** variant="files" — 无文件提示 */
export const Files: Story = {
  args: {
    variant: "files",
    onAction: () => {},
  },
};

/** variant="search" — 搜索无结果提示 */
export const Search: Story = {
  args: {
    variant: "search",
    onAction: () => {},
  },
};

/** variant="characters" — 无角色提示 */
export const Characters: Story = {
  args: {
    variant: "characters",
    onAction: () => {},
  },
};

/** variant="generic" — 通用空态 */
export const Generic: Story = {
  args: {
    variant: "generic",
    onAction: () => {},
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
};
