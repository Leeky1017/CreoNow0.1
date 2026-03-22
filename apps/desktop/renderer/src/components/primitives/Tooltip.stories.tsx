import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "./Tooltip";
import { Button } from "./Button";
import { expect } from "@storybook/test";

/**
 * Tooltip 组件 Story
 *
 * 用于在悬停时显示额外信息。
 * 基于 Radix UI Tooltip。
 */
const meta = {
  title: "Primitives/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `## 使用指南

### 何时使用
- **补充说明**: 为图标按钮、缩写、截断文本提供额外信息
- **快捷键提示**: 显示操作对应的键盘快捷键
- **状态描述**: 解释禁用按钮的原因

### 注意事项
- Tooltip 不应包含关键操作信息——用户可能无法触达（触屏设备）
- 保持内容简短（1-2 行），长文本使用 Popover
- \`delayDuration\` 默认 200ms，避免设置过短导致闪烁
- 确保触发元素可聚焦（键盘可访问）`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description: "Side where tooltip appears",
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "Alignment of tooltip",
    },
    delayDuration: {
      control: "number",
      description: "Delay in ms before showing tooltip",
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 基础 Stories
// ============================================================================

/** 默认状态 */
export const Default: Story = {
  args: {
    content: "This is a tooltip",
    children: <Button>Hover me</Button>,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 长文本内容 */
export const LongContent: Story = {
  args: {
    content:
      "This is a longer tooltip that contains more information about the element you're hovering over.",
    children: <Button>Hover for details</Button>,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// Side Stories
// ============================================================================

/** Top side */
export const Top: Story = {
  args: {
    content: "Top tooltip",
    side: "top",
    children: <Button>Top</Button>,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Right side */
export const Right: Story = {
  args: {
    content: "Right tooltip",
    side: "right",
    children: <Button>Right</Button>,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Bottom side */
export const Bottom: Story = {
  args: {
    content: "Bottom tooltip",
    side: "bottom",
    children: <Button>Bottom</Button>,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Left side */
export const Left: Story = {
  args: {
    content: "Left tooltip",
    side: "left",
    children: <Button>Left</Button>,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 组合展示
// ============================================================================

/** 所有方向展示 */
export const AllSides: Story = {
  args: {
    content: "Tooltip",
    children: <Button>Hover</Button>,
  },
  render: () => (
    <div style={{ display: "flex", gap: "2rem", padding: "4rem" }}>
      <Tooltip content="Top tooltip" side="top">
        <Button>Top</Button>
      </Tooltip>
      <Tooltip content="Right tooltip" side="right">
        <Button>Right</Button>
      </Tooltip>
      <Tooltip content="Bottom tooltip" side="bottom">
        <Button>Bottom</Button>
      </Tooltip>
      <Tooltip content="Left tooltip" side="left">
        <Button>Left</Button>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 不同触发元素 */
export const DifferentTriggers: Story = {
  args: {
    content: "Tooltip",
    children: <Button>Hover</Button>,
  },
  render: () => (
    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
      <Tooltip content="Button tooltip">
        <Button variant="primary">Button</Button>
      </Tooltip>
      <Tooltip content="Text tooltip">
        <span
          style={{
            cursor: "help",
            textDecoration: "underline dotted",
            color: "var(--color-fg-default)",
          }}
        >
          Hover text
        </span>
      </Tooltip>
      <Tooltip content="Icon tooltip">
        <button
          type="button"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--color-border-default)",
            background: "transparent",
            color: "var(--color-fg-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ?
        </button>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 即时显示 */
export const InstantDelay: Story = {
  args: {
    content: "Instant tooltip",
    delayDuration: 0,
    children: <Button>No delay</Button>,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 长延迟 */
export const LongDelay: Story = {
  args: {
    content: "Delayed tooltip",
    delayDuration: 1000,
    children: <Button>1s delay</Button>,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 对齐方式 */
export const Alignments: Story = {
  args: {
    content: "Tooltip",
    children: <Button>Hover</Button>,
  },
  render: () => (
    <div style={{ display: "flex", gap: "2rem", padding: "4rem" }}>
      <Tooltip content="Start aligned" side="bottom" align="start">
        <Button style={{ width: "120px" }}>Start</Button>
      </Tooltip>
      <Tooltip content="Center aligned" side="bottom" align="center">
        <Button style={{ width: "120px" }}>Center</Button>
      </Tooltip>
      <Tooltip content="End aligned" side="bottom" align="end">
        <Button style={{ width: "120px" }}>End</Button>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
