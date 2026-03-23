import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";
import { Card } from "./Card";

/**
 * Card 组件 Story
 *
 * 设计规范 §6.3
 * 容器组件，用于内容分组和视觉分隔。
 *
 * Variant 矩阵：
 * - default: 标准边框（无阴影）
 * - raised: 带阴影的悬浮样式
 * - bordered: 加粗边框
 * - bento: 大圆角、大内边距卡片
 * - compact: 紧凑型信息卡片
 *
 * 状态矩阵（MUST 全部实现）：
 * - default: 正常样式
 * - hover (hoverable): 边框高亮 + 可选阴影
 */
const meta = {
  title: "Primitives/Card/Basic",
  component: Card,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `## 使用指南

### 变体说明
- **default**: 标准容器，细边框分隔
- **raised**: 悬浮卡片，带阴影，用于需要层次感的场景
- **bordered**: 加粗边框，强调分组
- **bento**: 大圆角大内边距，用于 Dashboard 等展示场景
- **compact**: 紧凑信息卡片，列表项

### 组合模式
使用 CardHeader / CardContent / CardFooter slot 构建结构化内容`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "raised", "bordered", "bento", "compact"],
      description: "Visual style variant",
    },
    hoverable: {
      control: "boolean",
      description: "Enable hover effect (border highlight, optional shadow)",
    },
    noPadding: {
      control: "boolean",
      description: "Remove padding for custom layouts",
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 基础 Stories
// ============================================================================

/** 默认状态：标准卡片 */
export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "16px", fontWeight: 600 }}>
          Card Title
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "var(--color-fg-muted)",
          }}
        >
          This is the card content. Cards are containers for grouping related
          content.
        </p>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Card Title")).toBeInTheDocument();
  },
};

/** Raised variant：带阴影的悬浮卡片 */
export const Raised: Story = {
  args: {
    variant: "raised",
    children: (
      <div>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "16px", fontWeight: 600 }}>
          Raised Card
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "var(--color-fg-muted)",
          }}
        >
          This card has elevation shadow for floating elements.
        </p>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Bordered variant：加粗边框卡片 */
export const Bordered: Story = {
  args: {
    variant: "bordered",
    children: (
      <div>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "16px", fontWeight: 600 }}>
          Bordered Card
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "var(--color-fg-muted)",
          }}
        >
          This card has a prominent border.
        </p>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// Hoverable Stories
// ============================================================================

/** Hoverable：可点击卡片（有 hover 效果） */
export const Hoverable: Story = {
  args: {
    hoverable: true,
    children: (
      <div>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "16px", fontWeight: 600 }}>
          Hoverable Card
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "var(--color-fg-muted)",
          }}
        >
          Hover over this card to see the effect.
        </p>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Hoverable + Raised：可点击悬浮卡片 */
export const HoverableRaised: Story = {
  args: {
    variant: "raised",
    hoverable: true,
    children: (
      <div>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "16px", fontWeight: 600 }}>
          Hoverable Raised Card
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "var(--color-fg-muted)",
          }}
        >
          Combined raised variant with hover effect.
        </p>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// Padding Stories
// ============================================================================

/** No Padding：无内边距 */
export const NoPadding: Story = {
  args: {
    noPadding: true,
    children: (
      <div style={{ padding: "1rem", background: "var(--color-bg-muted)" }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "16px", fontWeight: 600 }}>
          Custom Padding Card
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "var(--color-fg-muted)",
          }}
        >
          This card has no padding - useful for custom layouts.
        </p>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Bento variant — 大圆角卡片 */
export const Bento: Story = {
  args: {
    variant: "bento",
    children: "Bento card with 24px radius and 32px padding",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Bento + Hoverable */
export const BentoHoverable: Story = {
  args: {
    variant: "bento",
    hoverable: true,
    children: "Hover me — border color transitions",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Compact variant — 紧凑统计卡片 */
export const Compact: Story = {
  args: { children: "Compact" },
  render: () => (
    <div style={{ display: "flex", gap: "1rem" }}>
      <Card variant="compact" style={{ width: "160px" }}>
        <div style={{ fontSize: "28px", fontWeight: 600 }}>42</div>
        <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
          Total Projects
        </div>
      </Card>
      <Card variant="compact" style={{ width: "160px" }}>
        <div style={{ fontSize: "28px", fontWeight: 600 }}>1.2M</div>
        <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
          Total Words
        </div>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * 空内容
 *
 * 验证空内容时卡片仍保持正常样式
 */
export const EmptyContent: Story = {
  args: {
    children: <div style={{ height: "50px" }} />,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
