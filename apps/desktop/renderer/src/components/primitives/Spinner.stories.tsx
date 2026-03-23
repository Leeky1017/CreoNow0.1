import type { Meta, StoryObj } from "@storybook/react";
import type { SpinnerSize } from "./Spinner";
import { Spinner } from "./Spinner";
import { expect } from "@storybook/test";

/**
 * Spinner 组件 Story
 *
 * 用于显示加载状态的旋转指示器。
 * 支持多种尺寸。
 */
const meta = {
  title: "Primitives/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Size of the spinner",
    },
    label: {
      control: "text",
      description: "Accessibility label",
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 基础 Stories
// ============================================================================

/** 默认状态 */
export const Default: Story = {
  args: {
    size: "md",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// Size Stories
// ============================================================================

const sizes: SpinnerSize[] = ["xs", "sm", "md", "lg", "xl"];

/** XS size (12px) */
export const ExtraSmall: Story = {
  args: {
    size: "xs",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** SM size (16px) */
export const Small: Story = {
  args: {
    size: "sm",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** MD size (24px) */
export const Medium: Story = {
  args: {
    size: "md",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** LG size (32px) */
export const Large: Story = {
  args: {
    size: "lg",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** XL size (48px) */
export const ExtraLarge: Story = {
  args: {
    size: "xl",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 组合展示
// ============================================================================

/** 所有 Sizes 展示 */
export const AllSizes: Story = {
  args: {
    size: "md",
  },
  render: () => (
    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
      {sizes.map((size) => (
        <div
          key={size}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Spinner size={size} />
          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            {size}
          </span>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 不同颜色（继承父元素 color） */
export const Colors: Story = {
  args: {
    size: "md",
  },
  render: () => (
    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
      <div style={{ color: "var(--color-fg-default)" }}>
        <Spinner size="md" />
      </div>
      <div style={{ color: "var(--color-fg-muted)" }}>
        <Spinner size="md" />
      </div>
      <div style={{ color: "var(--color-success)" }}>
        <Spinner size="md" />
      </div>
      <div style={{ color: "var(--color-error)" }}>
        <Spinner size="md" />
      </div>
      <div style={{ color: "var(--color-info)" }}>
        <Spinner size="md" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 加载按钮示例 */
export const InButton: Story = {
  args: {
    size: "sm",
  },
  render: () => (
    <button
      type="button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        backgroundColor: "var(--color-fg-default)",
        color: "var(--color-fg-inverse)",
        border: "none",
        borderRadius: "var(--radius-md)",
        fontSize: "13px",
        cursor: "not-allowed",
        opacity: 0.7,
      }}
      disabled
    >
      <Spinner size="sm" />
      <span>Loading...</span>
    </button>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 全屏加载示例 */
export const FullScreen: Story = {
  args: {
    size: "xl",
  },
  parameters: {
    layout: "fullscreen",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "1rem",
        color: "var(--color-fg-muted)",
      }}
    >
      <Spinner size="xl" />
      <span style={{ fontSize: "14px" }}>Loading content...</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
