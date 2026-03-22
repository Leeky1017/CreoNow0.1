import type { Meta, StoryObj } from "@storybook/react";
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
  title: "Primitives/Input",
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
};

/** 带默认值 */
export const WithValue: Story = {
  args: {
    defaultValue: "Hello World",
  },
};

/** 带 placeholder */
export const WithPlaceholder: Story = {
  args: {
    placeholder: "Type something here...",
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
};

/** Disabled 状态：禁用输入 */
export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Disabled input",
  },
};

/** ReadOnly 状态：只读输入 */
export const ReadOnly: Story = {
  args: {
    readOnly: true,
    defaultValue: "Read only input",
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
        <Input placeholder="Enter text..." fullWidth />
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
        <Input defaultValue="Hello World" fullWidth />
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
        <Input error defaultValue="Invalid input" fullWidth />
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
        <Input disabled defaultValue="Disabled input" fullWidth />
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
        <Input readOnly defaultValue="Read only input" fullWidth />
      </div>
    </div>
  ),
};

// ============================================================================
// 输入类型 Stories
// ============================================================================

/** Password 输入 */
export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password...",
  },
};

/** Email 输入 */
export const Email: Story = {
  args: {
    type: "email",
    placeholder: "Enter email...",
  },
};

/** Number 输入 */
export const Number: Story = {
  args: {
    type: "number",
    placeholder: "Enter number...",
  },
};

/** Search 输入 */
export const Search: Story = {
  args: {
    type: "search",
    placeholder: "Search...",
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
        <Input type="text" placeholder="Text input" fullWidth />
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
        <Input type="password" placeholder="Password input" fullWidth />
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
        <Input type="email" placeholder="Email input" fullWidth />
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
        <Input type="number" placeholder="Number input" fullWidth />
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
        <Input type="search" placeholder="Search input" fullWidth />
      </div>
    </div>
  ),
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
        fullWidth
        defaultValue="Very long text that should handle overflow properly without breaking layout"
      />
    </div>
  ),
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
      <Input placeholder="Default Focus" />
      <Input error placeholder="Error Focus" />
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
        <Input placeholder="请输入用户名" fullWidth />
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
        <Input type="password" placeholder="请输入密码" fullWidth />
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
        <Input type="email" error placeholder="请输入有效邮箱" fullWidth />
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
          <Input placeholder="Default input" fullWidth />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            with value
          </span>
          <Input defaultValue="Hello World" fullWidth />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            error
          </span>
          <Input error defaultValue="Invalid" fullWidth />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            disabled
          </span>
          <Input disabled defaultValue="Disabled" fullWidth />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            readonly
          </span>
          <Input readOnly defaultValue="Read only" fullWidth />
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
          <Input type="text" placeholder="Text" fullWidth />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            password
          </span>
          <Input type="password" placeholder="Password" fullWidth />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            email
          </span>
          <Input type="email" placeholder="Email" fullWidth />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            number
          </span>
          <Input type="number" placeholder="Number" fullWidth />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            search
          </span>
          <Input type="search" placeholder="Search" fullWidth />
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
            defaultValue="This is a very long text that should scroll horizontally"
            fullWidth
          />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            short
          </span>
          <Input defaultValue="Hi" fullWidth />

          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            emoji
          </span>
          <Input defaultValue="Hello 🌍 World 🚀" fullWidth />
        </div>
      </section>
    </div>
  ),
};
