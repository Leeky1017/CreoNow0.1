import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Textarea } from "./Textarea";
import { within, expect } from "@storybook/test";

/**
 * Textarea 组件 Story
 *
 * 设计规范 §6.2
 * 多行文本输入框，支持 error 状态和 fullWidth 模式。
 *
 * 状态矩阵（MUST 全部实现）：
 * - default: 正常边框颜色
 * - focus: 边框高亮 + focus ring
 * - error: 红色边框
 * - disabled: opacity: 0.5，不可交互，不可 resize
 * - placeholder: 占位符文本
 */
const meta = {
  title: "Primitives/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    error: {
      control: "boolean",
      description: "Show error state styling",
    },
    disabled: {
      control: "boolean",
      description: "Disable the textarea",
    },
    fullWidth: {
      control: "boolean",
      description: "Full width textarea",
    },
    rows: {
      control: "number",
      description: "Number of visible text rows",
    },
  },
  args: { "aria-label": "Text area" },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 基础 Stories
// ============================================================================

/** 默认状态 */
export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/** 带初始值 */
export const WithValue: Story = {
  args: {
    defaultValue:
      "This is some pre-filled text content.\n\nIt can span multiple lines.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/** 自定义 placeholder */
export const CustomPlaceholder: Story = {
  args: {
    placeholder: "Write your story here... Be creative!",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/** 自定义行数 */
export const CustomRows: Story = {
  args: {
    placeholder: "Enter text...",
    rows: 8,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

// ============================================================================
// 状态 Stories
// ============================================================================

/** Error 状态 */
export const Error: Story = {
  args: {
    placeholder: "Enter text...",
    error: true,
    defaultValue: "Invalid content",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/** Disabled 状态 */
export const Disabled: Story = {
  args: {
    placeholder: "Cannot edit",
    disabled: true,
    defaultValue: "This content is read-only",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/** Full Width */
export const FullWidth: Story = {
  args: {
    placeholder: "Enter text...",
    fullWidth: true,
  },
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "400px" }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/** Error + Disabled */
export const ErrorDisabled: Story = {
  args: {
    placeholder: "Error and disabled",
    error: true,
    disabled: true,
    defaultValue: "Invalid and read-only",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

// ============================================================================
// 交互 Stories
// ============================================================================

/** Controlled：受控模式演示 */
export const Controlled: Story = {
  args: {
    placeholder: "Type something...",
  },
  render: function ControlledTextarea() {
    const [value, setValue] = useState("");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Textarea
          aria-label="Controlled textarea"
          placeholder="Type something..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
          Character count: {value.length}
        </span>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/** 带字符限制的 Textarea */
export const WithCharacterLimit: Story = {
  args: {
    placeholder: "Max 100 characters...",
  },
  render: function CharacterLimitTextarea() {
    const [value, setValue] = useState("");
    const maxLength = 100;
    const remaining = maxLength - value.length;
    const isOverLimit = remaining < 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Textarea
          aria-label="Character limited textarea"
          placeholder="Max 100 characters..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          error={isOverLimit}
        />
        <span
          style={{
            fontSize: "12px",
            color: isOverLimit ? "var(--color-error)" : "var(--color-fg-muted)",
          }}
        >
          {remaining} characters remaining
        </span>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};
