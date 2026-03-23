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

// ============================================================================
// 交互状态展示（用于 Focus 测试）
// ============================================================================

/**
 * Focus 状态测试
 *
 * 使用 Tab 键导航到输入框，验证 focus-visible 样式
 * - 应显示 focus ring（outline）
 * - 边框颜色变化
 */
export const FocusTest: Story = {
  args: {
    placeholder: "Input",
  },
  parameters: {
    docs: {
      description: {
        story: "使用 Tab 键聚焦到输入框，验证 focus ring 是否正确显示",
      },
    },
  },
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Tab →
      </span>
      <Input aria-label="Default Focus" placeholder="Default Focus" />
      <Input aria-label="Error Focus" error placeholder="Error Focus" />
    </div>
  ),
};

/**
 * 表单场景
 *
 * 模拟真实表单中的输入框使用
 */
export const FormScenario: Story = {
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
            fontSize: "13px",
            color: "var(--color-fg-default)",
          }}
        >
          用户名
        </label>
        <Input aria-label="请输入用户名" placeholder="请输入用户名" fullWidth />
      </div>
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "0.25rem",
            fontSize: "13px",
            color: "var(--color-fg-default)",
          }}
        >
          密码
        </label>
        <Input
          aria-label="请输入密码"
          type="password"
          placeholder="请输入密码"
          fullWidth
        />
      </div>
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "0.25rem",
            fontSize: "13px",
            color: "var(--color-fg-default)",
          }}
        >
          邮箱 <span style={{ color: "var(--color-error)" }}>*</span>
        </label>
        <Input
          aria-label="请输入有效邮箱"
          type="email"
          error
          placeholder="请输入有效邮箱"
          fullWidth
        />
        <span
          style={{
            display: "block",
            marginTop: "0.25rem",
            fontSize: "12px",
            color: "var(--color-error)",
          }}
        >
          请输入有效的邮箱地址
        </span>
      </div>
    </div>
  ),
};

/**
 * 完整状态展示（用于 AI 自检）
 *
 * 包含所有状态的完整矩阵，便于一次性检查
 */
export const FullMatrix: Story = {
  args: {
    placeholder: "Input",
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
      {/* States */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          States
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "100px 1fr",
            gap: "1rem",
            alignItems: "center",
            maxWidth: "400px",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            default
          </span>
          <Input
            aria-label="Default input"
            placeholder="Default input"
            fullWidth
          />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            with value
          </span>
          <Input
            aria-label="Input input"
            defaultValue="Hello World"
            fullWidth
          />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            error
          </span>
          <Input
            aria-label="Input input"
            error
            defaultValue="Invalid"
            fullWidth
          />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            disabled
          </span>
          <Input
            aria-label="Input input"
            disabled
            defaultValue="Disabled"
            fullWidth
          />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            readonly
          </span>
          <Input
            aria-label="Input input"
            readOnly
            defaultValue="Read only"
            fullWidth
          />
        </div>
      </section>

      {/* Input Types */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Input Types
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "100px 1fr",
            gap: "1rem",
            alignItems: "center",
            maxWidth: "400px",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            text
          </span>
          <Input aria-label="Text" type="text" placeholder="Text" fullWidth />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            password
          </span>
          <Input
            aria-label="Password"
            type="password"
            placeholder="Password"
            fullWidth
          />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            email
          </span>
          <Input
            aria-label="Email"
            type="email"
            placeholder="Email"
            fullWidth
          />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            number
          </span>
          <Input
            aria-label="Number"
            type="number"
            placeholder="Number"
            fullWidth
          />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            search
          </span>
          <Input
            aria-label="Search"
            type="search"
            placeholder="Search"
            fullWidth
          />
        </div>
      </section>

      {/* Edge Cases */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Edge Cases
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "100px 1fr",
            gap: "1rem",
            alignItems: "center",
            maxWidth: "400px",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            long text
          </span>
          <Input
            aria-label="Long scrolling text input"
            defaultValue="This is a very long text that should scroll horizontally"
            fullWidth
          />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            short
          </span>
          <Input aria-label="Input input" defaultValue="Hi" fullWidth />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            emoji
          </span>
          <Input
            aria-label="Input input"
            defaultValue="Hello 🌍 World 🚀"
            fullWidth
          />
        </div>
      </section>
    </div>
  ),
};
