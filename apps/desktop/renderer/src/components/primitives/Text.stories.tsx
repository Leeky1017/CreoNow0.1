import type { Meta, StoryObj } from "@storybook/react";
import type { TextSize, TextColor } from "./Text";
import { Text } from "./Text";
import { expect } from "@storybook/test";

/**
 * Text 组件 Story
 *
 * 设计规范 §4.2 Typography
 * 文本组件，提供统一的排版样式。
 *
 * Size 变体：
 * - body: 13px, 400, 1.5 (默认)
 * - bodyLarge: 16px, 400, 1.8
 * - small: 12px, 400, 1.4
 * - tiny: 11px, 400, 1.2
 * - label: 10px, 500, 1.2, uppercase
 * - code: 13px, mono, 400, 1.5
 *
 * Color 变体：
 * - default, muted, subtle, placeholder
 * - error, success, warning, info
 */
const meta = {
  title: "Primitives/Text",
  component: Text,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["body", "bodyLarge", "small", "tiny", "label", "code"],
      description: "Typography size variant",
    },
    color: {
      control: "select",
      options: [
        "default",
        "muted",
        "subtle",
        "placeholder",
        "error",
        "success",
        "warning",
        "info",
      ],
      description: "Text color",
    },
    weight: {
      control: "select",
      options: ["normal", "medium", "semibold", "bold"],
      description: "Font weight override",
    },
    as: {
      control: "select",
      options: ["span", "p", "div", "label"],
      description: "Render as different element",
    },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 基础 Stories
// ============================================================================

/**
 * 默认 Text (body)
 */
export const Default: Story = {
  args: {
    children: "This is default body text.",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Body 变体
 */
export const Body: Story = {
  args: {
    size: "body",
    children: "Body text at 13px with normal weight.",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Body Large 变体
 */
export const BodyLarge: Story = {
  args: {
    size: "bodyLarge",
    children: "Body large text at 16px for editor content.",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Small 变体
 */
export const Small: Story = {
  args: {
    size: "small",
    children: "Small text at 12px for secondary information.",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Tiny 变体
 */
export const Tiny: Story = {
  args: {
    size: "tiny",
    children: "Tiny text at 11px for timestamps and metadata.",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Label 变体
 */
export const Label: Story = {
  args: {
    size: "label",
    children: "Section Label",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Code 变体
 */
export const Code: Story = {
  args: {
    size: "code",
    children: 'console.log("Hello, World!");',
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// Size 矩阵
// ============================================================================

const sizes: TextSize[] = [
  "body",
  "bodyLarge",
  "small",
  "tiny",
  "label",
  "code",
];

/**
 * 所有 Size 变体
 */
export const AllSizes: Story = {
  args: {
    children: "Text",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {sizes.map((size) => (
        <div
          key={size}
          style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}
        >
          <span
            style={{
              width: "80px",
              fontSize: "12px",
              color: "var(--color-fg-muted)",
            }}
          >
            {size}
          </span>
          <Text size={size}>
            {size === "code"
              ? 'const example = "code";'
              : size === "label"
                ? "LABEL TEXT"
                : "The quick brown fox jumps over the lazy dog."}
          </Text>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// Color 变体
// ============================================================================

const colors: TextColor[] = [
  "default",
  "muted",
  "subtle",
  "placeholder",
  "error",
  "success",
  "warning",
  "info",
];

/**
 * 所有 Color 变体
 */
export const AllColors: Story = {
  args: {
    children: "Text",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {colors.map((color) => (
        <div
          key={color}
          style={{ display: "flex", alignItems: "center", gap: "1rem" }}
        >
          <span
            style={{
              width: "80px",
              fontSize: "12px",
              color: "var(--color-fg-muted)",
            }}
          >
            {color}
          </span>
          <Text color={color}>This is {color} colored text.</Text>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// Weight 变体
// ============================================================================

/**
 * 所有 Weight 变体
 */
export const AllWeights: Story = {
  args: {
    children: "Text",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <Text weight="normal">Normal weight (400)</Text>
      <Text weight="medium">Medium weight (500)</Text>
      <Text weight="semibold">Semibold weight (600)</Text>
      <Text weight="bold">Bold weight (700)</Text>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 元素变体
// ============================================================================

/**
 * 不同元素渲染
 */
export const AsElements: Story = {
  args: {
    children: "Text",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Text as="span">Rendered as span (default)</Text>
      <Text as="p">Rendered as paragraph</Text>
      <Text as="div">Rendered as div</Text>
      <Text as="label">Rendered as label</Text>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 实际使用场景
// ============================================================================

/**
 * 段落文本
 */
export const Paragraph: Story = {
  args: {
    as: "p",
    size: "body",
    children:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "400px" }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * 辅助文本
 */
export const HelperText: Story = {
  args: {
    size: "small",
    color: "muted",
    children: "This is helper text that provides additional context.",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * 错误消息
 */
export const ErrorMessage: Story = {
  args: {
    size: "small",
    color: "error",
    children: "This field is required.",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * 成功消息
 */
export const SuccessMessage: Story = {
  args: {
    size: "small",
    color: "success",
    children: "Changes saved successfully.",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * 时间戳
 */
export const Timestamp: Story = {
  args: {
    size: "tiny",
    color: "subtle",
    children: "2 hours ago",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * 代码片段
 */
export const CodeSnippet: Story = {
  args: {
    size: "code",
    children: "npm install @creonow/core",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: "0.5rem 1rem",
          background: "var(--color-bg-surface)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
