import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./Skeleton";
import { expect } from "@storybook/test";

/**
 * Skeleton 组件 Story
 *
 * 用于显示内容加载占位符。
 * 支持文本、圆形、矩形三种形态。
 */
const meta = {
  title: "Primitives/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["text", "circular", "rectangular"],
      description: "Shape variant",
    },
    width: {
      control: "text",
      description: "Width (CSS value)",
    },
    height: {
      control: "text",
      description: "Height (CSS value)",
    },
    animate: {
      control: "boolean",
      description: "Enable shimmer animation",
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 基础 Stories
// ============================================================================

/** 默认状态（文本） */
export const Default: Story = {
  args: {
    variant: "text",
    width: "200px",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 文本占位 */
export const Text: Story = {
  args: {
    variant: "text",
    width: "80%",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 圆形占位（头像） */
export const Circular: Story = {
  args: {
    variant: "circular",
    width: 48,
    height: 48,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 矩形占位（图片/卡片） */
export const Rectangular: Story = {
  args: {
    variant: "rectangular",
    width: "100%",
    height: 120,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 无动画 */
export const NoAnimation: Story = {
  args: {
    variant: "rectangular",
    width: 200,
    height: 100,
    animate: false,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 组合展示
// ============================================================================

/** 所有 Variants 展示 */
export const AllVariants: Story = {
  args: {
    variant: "text",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        maxWidth: "400px",
      }}
    >
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          text
        </div>
        <Skeleton variant="text" width="80%" />
      </div>
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          circular
        </div>
        <Skeleton variant="circular" width={48} height={48} />
      </div>
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          rectangular
        </div>
        <Skeleton variant="rectangular" height={100} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 用户卡片骨架 */
export const UserCardSkeleton: Story = {
  args: {
    variant: "text",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
        padding: "1rem",
        backgroundColor: "var(--color-bg-surface)",
        borderRadius: "var(--radius-lg)",
        maxWidth: "320px",
      }}
    >
      <Skeleton variant="circular" width={48} height={48} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <Skeleton variant="text" width="60%" height={16} />
        <Skeleton variant="text" width="80%" height={14} />
        <Skeleton variant="text" width="40%" height={14} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 文章列表骨架 */
export const ArticleListSkeleton: Story = {
  args: {
    variant: "text",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        maxWidth: "500px",
      }}
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: "1rem",
            padding: "1rem",
            backgroundColor: "var(--color-bg-surface)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <Skeleton variant="rectangular" width={120} height={80} />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <Skeleton variant="text" width="90%" height={18} />
            <Skeleton variant="text" width="70%" height={14} />
            <Skeleton variant="text" width="50%" height={14} />
          </div>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 表单骨架 */
export const FormSkeleton: Story = {
  args: {
    variant: "text",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: "300px",
        padding: "1.5rem",
        backgroundColor: "var(--color-bg-surface)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <Skeleton variant="text" width="30%" height={12} />
      <Skeleton variant="rectangular" height={36} />
      <Skeleton variant="text" width="30%" height={12} />
      <Skeleton variant="rectangular" height={36} />
      <Skeleton variant="text" width="30%" height={12} />
      <Skeleton variant="rectangular" height={80} />
      <Skeleton variant="rectangular" width="100%" height={36} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
