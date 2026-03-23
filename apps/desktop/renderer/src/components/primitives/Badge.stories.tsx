import type { Meta, StoryObj } from "@storybook/react";
import type { BadgeVariant, BadgeSize } from "./Badge";
import { Badge } from "./Badge";
import { expect } from "@storybook/test";

/**
 * Badge 组件 Story
 *
 * 用于显示状态标签、标签或计数。
 * 支持多种 variant 和 size。
 */
const meta = {
  title: "Primitives/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `## 使用指南

### 用途
- **default**: 通用标签
- **success**: 已完成、已通过状态
- **warning**: 需注意、待处理
- **error**: 错误、失败状态
- **info**: 提示信息
- **outline**: 轻量标签，减少视觉噪音`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "warning", "error", "info", "pill"],
      description: "Visual style variant",
    },
    size: {
      control: "select",
      options: ["sm", "md"],
      description: "Size of the badge",
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 基础 Stories
// ============================================================================

/** 默认状态 */
export const Default: Story = {
  args: {
    children: "Badge",
    variant: "default",
    size: "md",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Success variant */
export const Success: Story = {
  args: {
    children: "Active",
    variant: "success",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Warning variant */
export const Warning: Story = {
  args: {
    children: "Pending",
    variant: "warning",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Error variant */
export const Error: Story = {
  args: {
    children: "Failed",
    variant: "error",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Info variant */
export const Info: Story = {
  args: {
    children: "New",
    variant: "info",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// Size Stories
// ============================================================================

/** Small size */
export const Small: Story = {
  args: {
    children: "SM",
    size: "sm",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Medium size */
export const Medium: Story = {
  args: {
    children: "MD",
    size: "md",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 组合展示
// ============================================================================

const variants: BadgeVariant[] = [
  "default",
  "success",
  "warning",
  "error",
  "info",
  "pill",
];
const sizes: BadgeSize[] = ["sm", "md"];

/** 所有 Variants 展示 */
export const AllVariants: Story = {
  args: {
    children: "Badge",
  },
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {variants.map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 所有 Sizes 展示 */
export const AllSizes: Story = {
  args: {
    children: "Badge",
  },
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      {sizes.map((size) => (
        <Badge key={size} size={size}>
          {size}
        </Badge>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 完整矩阵 */
export const FullMatrix: Story = {
  args: {
    children: "Badge",
  },
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {variants.map((variant) => (
        <div
          key={variant}
          style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
        >
          <span
            style={{
              width: "60px",
              fontSize: "12px",
              color: "var(--color-fg-muted)",
            }}
          >
            {variant}
          </span>
          {sizes.map((size) => (
            <Badge key={`${variant}-${size}`} variant={variant} size={size}>
              {size}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};

/** 数字计数示例 */
export const NumberBadges: Story = {
  args: {
    children: "Badge",
  },
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Badge variant="error" size="sm">
        3
      </Badge>
      <Badge variant="info" size="sm">
        99+
      </Badge>
      <Badge variant="success" size="sm">
        12
      </Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Pill variant — 分类标签 */
export const Pill: Story = {
  args: {
    variant: "pill",
    children: "CATEGORY",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** Pill variant 各种标签 */
export const PillVariations: Story = {
  args: { children: "Pill" },
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <Badge variant="pill">NOVEL</Badge>
      <Badge variant="pill">SHORT STORY</Badge>
      <Badge variant="pill" size="sm">
        DRAFT
      </Badge>
      <Badge variant="pill">SCREENPLAY</Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
