import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";
import { within, expect } from "@storybook/test";

const meta = {
  title: "Primitives/Input/Variants",
  component: Input,
  args: { "aria-label": "Text input" },
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 输入类型 Stories
// ============================================================================

/** Password 输入 */
export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/** Email 输入 */
export const Email: Story = {
  args: {
    type: "email",
    placeholder: "Enter email...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/** Number 输入 */
export const Number: Story = {
  args: {
    type: "number",
    placeholder: "Enter number...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/** Search 输入 */
export const Search: Story = {
  args: {
    type: "search",
    placeholder: "Search...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/** 所有输入类型 */
export const AllTypes: Story = {
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
          Text
        </label>
        <Input
          aria-label="Text input"
          type="text"
          placeholder="Text input"
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
          Password
        </label>
        <Input
          aria-label="Password input"
          type="password"
          placeholder="Password input"
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
          Email
        </label>
        <Input
          aria-label="Email input"
          type="email"
          placeholder="Email input"
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
          Number
        </label>
        <Input
          aria-label="Number input"
          type="number"
          placeholder="Number input"
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
          Search
        </label>
        <Input
          aria-label="Search input"
          type="search"
          placeholder="Search input"
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

// ============================================================================
// 边界情况 Stories
// ============================================================================

/**
 * 超长文本
 *
 * 验证超长输入时的水平滚动行为
 */
export const LongText: Story = {
  args: {
    defaultValue:
      "This is a very long text that should scroll horizontally when it exceeds the input width",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/**
 * 超长文本（在有限宽度容器中）
 *
 * 验证文本过长时不会撑破布局
 */
export const LongTextConstrained: Story = {
  args: {
    defaultValue: "Input",
  },
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div
      style={{
        width: "200px",
        border: "1px dashed var(--color-border-default)",
      }}
    >
      <Input
        aria-label="Long text overflow input"
        fullWidth
        defaultValue="Very long text that should handle overflow properly without breaking layout"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/**
 * 短文本
 *
 * 验证短文本时输入框仍保持正常宽度
 */
export const ShortText: Story = {
  args: {
    defaultValue: "Hi",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};

/**
 * 带 Emoji 的输入
 *
 * 验证 emoji 正确显示
 */
export const WithEmoji: Story = {
  args: {
    defaultValue: "Hello 🌍 World 🚀",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeInTheDocument();
  },
};
