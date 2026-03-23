import type { Meta, StoryObj } from "@storybook/react";

import { NodeDetailCard } from "./NodeDetailCard";
import type { GraphNode } from "./types";
import { expect } from "@storybook/test";

const defaultNode: GraphNode = {
  id: "character-linyuan",
  label: "林远",
  type: "character",
  position: { x: 0, y: 0 },
  metadata: {
    role: "Protagonist",
    description: "前特种兵，擅长潜行与侦察。",
    attributes: [
      { key: "年龄", value: "28" },
      { key: "身份", value: "侦察员" },
    ],
  },
};

const emptyNode: GraphNode = {
  id: "character-empty",
  label: "新建角色",
  type: "character",
  position: { x: 0, y: 0 },
  metadata: {},
};

const meta = {
  title: "Features/KnowledgeGraph/EntityDetail",
  component: NodeDetailCard,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          background: "var(--color-bg-surface)",
          padding: 16,
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    onClose: () => undefined,
    onEdit: () => undefined,
    onViewDetails: () => undefined,
    onDelete: () => undefined,
  },
} satisfies Meta<typeof NodeDetailCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * default: 已填写实体详情。
 */
export const DefaultState: Story = {
  args: {
    node: defaultNode,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * empty: 新建实体，描述与属性为空。
 */
export const EmptyState: Story = {
  args: {
    node: emptyNode,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * error: 保存失败时显示错误提示。
 */
export const ErrorState: Story = {
  args: {
    node: defaultNode,
  },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <NodeDetailCard {...args} />
      <div
        role="alert"
        className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 py-2 text-xs text-[var(--color-error-default)]"
      >
        保存失败：网络繁忙，请稍后重试。
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
