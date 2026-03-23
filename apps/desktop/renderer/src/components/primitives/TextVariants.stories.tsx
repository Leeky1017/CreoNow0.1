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
  title: "Primitives/Text/Variants",
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

const sizes: TextSize[] = [
  "body",
  "bodyLarge",
  "small",
  "tiny",
  "label",
  "code",
];

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

// ============================================================================
// 边界情况
// ============================================================================

/**
 * 长文本
 */
export const LongText: Story = {
  args: {
    children:
      "This is an extremely long text that might wrap to multiple lines depending on the container width. It should handle wrapping gracefully without breaking the layout or causing any visual issues.",
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "300px" }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * 带换行的文本
 */
export const WithLineBreaks: Story = {
  args: {
    as: "p",
    children: "Line 1\nLine 2\nLine 3",
  },
  decorators: [
    (Story) => (
      <div style={{ whiteSpace: "pre-line" }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * 空文本
 */
export const Empty: Story = {
  args: {
    children: "",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 完整展示
// ============================================================================

/**
 * 完整功能展示（用于 AI 自检）
 */
export const FullMatrix: Story = {
  args: {
    children: "Text",
  },
  parameters: {
    layout: "fullscreen",
  },
  render: () => (
    <div
      style={{
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      {/* Sizes */}
      <section>
        <Text
          size="label"
          color="muted"
          as="div"
          style={{ marginBottom: "0.5rem" }}
        >
          SIZE VARIANTS
        </Text>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {sizes.map((size) => (
            <div
              key={size}
              style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}
            >
              <Text size="tiny" color="muted" style={{ width: "80px" }}>
                {size}
              </Text>
              <Text size={size}>
                {size === "code"
                  ? "const x = 1;"
                  : size === "label"
                    ? "LABEL"
                    : "Sample text"}
              </Text>
            </div>
          ))}
        </div>
      </section>

      {/* Colors */}
      <section>
        <Text
          size="label"
          color="muted"
          as="div"
          style={{ marginBottom: "0.5rem" }}
        >
          COLOR VARIANTS
        </Text>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          {colors.map((color) => (
            <Text key={color} color={color}>
              {color}: Sample text
            </Text>
          ))}
        </div>
      </section>

      {/* Weights */}
      <section>
        <Text
          size="label"
          color="muted"
          as="div"
          style={{ marginBottom: "0.5rem" }}
        >
          WEIGHT VARIANTS
        </Text>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <Text weight="normal">Normal (400)</Text>
          <Text weight="medium">Medium (500)</Text>
          <Text weight="semibold">Semibold (600)</Text>
          <Text weight="bold">Bold (700)</Text>
        </div>
      </section>

      {/* Combined */}
      <section>
        <Text
          size="label"
          color="muted"
          as="div"
          style={{ marginBottom: "0.5rem" }}
        >
          COMBINED USAGE
        </Text>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <Text size="bodyLarge" weight="semibold">
            Article Title
          </Text>
          <Text size="body" color="muted">
            By Author Name
          </Text>
          <Text size="body" as="p">
            This is the article body text that contains the main content.
          </Text>
          <Text size="small" color="subtle">
            Last updated 2 hours ago
          </Text>
        </div>
      </section>
    </div>
  ),
};
