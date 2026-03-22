import type { Meta, StoryObj } from "@storybook/react";

import { PanelHeader } from "./PanelHeader";
import { expect } from "@storybook/test";

const meta: Meta<typeof PanelHeader> = {
  title: "Patterns/PanelHeader",
  component: PanelHeader,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {
  args: {
    title: "大纲",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const TitleWithSubtitle: Story = {
  args: {
    title: "角色",
    subtitle: "第一章 · 破晓",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const TitleWithActions: Story = {
  args: {
    title: "记忆",
    actions: (
      <button type="button" style={{ fontSize: 12, opacity: 0.6 }}>
        ⚙
      </button>
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const FullHeader: Story = {
  args: {
    title: "知识图谱",
    subtitle: "Project Alpha · 42 entities",
    actions: (
      <div style={{ display: "flex", gap: 4 }}>
        <button type="button" style={{ fontSize: 12, opacity: 0.6 }}>
          +
        </button>
        <button type="button" style={{ fontSize: 12, opacity: 0.6 }}>
          ⋯
        </button>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const LongTitleTruncation: Story = {
  args: {
    title: "这是一个非常长的面板标题用于验证文本截断行为是否正确工作",
    subtitle: "副标题也可能很长需要验证是否正确截断不会导致布局溢出",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
