import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, userEvent } from "@storybook/test";
import { Input } from "./Input";

/**
 * Input 组件 Story
 *
 * 设计规范 §6.2
 * 单行文本输入框，支持 error、disabled、readonly 等状态。
 *
 * 状态矩阵（MUST 全部实现）：
 * - default: 正常边框颜色
 * - hover: 边框颜色变化（需要交互触发）
 * - focus-visible: 边框颜色 + focus ring（聚焦触发）
 * - error: 红色边框
 * - disabled: opacity: 0.5，不可编辑
 * - readonly: 轻微区分背景，可聚焦但不可编辑
 */
const meta = {
  title: "Primitives/Input/Basic",
  component: Input,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `## 使用指南

### Props 说明
- **error**: 设为 true 显示红色边框，配合 FormField 显示错误信息
- **fullWidth**: 占满父容器宽度
- **disabled / readonly**: 不可编辑状态

### 最佳实践
- 始终配合 label 使用（通过 FormField 组件）
- 密码输入使用 \`type="password"\`
- 搜索输入使用 SearchInput 组合组件`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    error: {
      control: "boolean",
      description: "Show error state styling",
    },
    fullWidth: {
      control: "boolean",
      description: "Full width input",
    },
    disabled: {
      control: "boolean",
      description: "Disable the input",
    },
    readOnly: {
      control: "boolean",
      description: "Make input read-only",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
  },
  args: { "aria-label": "Text input" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 基础 Stories
// ============================================================================

/** 默认状态：标准输入框 */
export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Enter text...");
    await userEvent.type(input, "Hello World");
    await expect(input).toHaveValue("Hello World");
  },
};

/** 带默认值 */
export const WithValue: Story = {
  args: {
    defaultValue: "Hello World",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/** 带 placeholder */
export const WithPlaceholder: Story = {
  args: {
    placeholder: "Type something here...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

// ============================================================================
// 状态 Stories
// ============================================================================

/** Error 状态：验证失败 */
export const Error: Story = {
  args: {
    error: true,
    defaultValue: "Invalid input",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/** Disabled 状态：禁用输入 */
export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Disabled input",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByDisplayValue("Disabled input");
    await expect(input).toBeDisabled();
  },
};

/** ReadOnly 状态：只读输入 */
export const ReadOnly: Story = {
  args: {
    readOnly: true,
    defaultValue: "Read only input",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/** Full Width：全宽输入框 */
export const FullWidth: Story = {
  args: {
    fullWidth: true,
    placeholder: "Full width input",
  },
  parameters: {
    layout: "padded",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

// ============================================================================
// 组合展示 Stories
// ============================================================================

/** 所有状态展示 */
export const AllStates: Story = {
  args: {
    placeholder: "Input",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        width: "300px",
      }}
    >
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "0.25rem",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          Default
        </label>
        <Input
          aria-label="Default text input"
          placeholder="Enter text..."
          fullWidth
        />
      </div>
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "0.25rem",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          With Value
        </label>
        <Input
          aria-label="With value input"
          defaultValue="Hello World"
          fullWidth
        />
      </div>
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "0.25rem",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          Error
        </label>
        <Input
          aria-label="Error input"
          error
          defaultValue="Invalid input"
          fullWidth
        />
      </div>
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "0.25rem",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          Disabled
        </label>
        <Input
          aria-label="Disabled input"
          disabled
          defaultValue="Disabled input"
          fullWidth
        />
      </div>
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "0.25rem",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          Read Only
        </label>
        <Input
          aria-label="Read only input"
          readOnly
          defaultValue="Read only input"
          fullWidth
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};
