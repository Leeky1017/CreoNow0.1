import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Textarea } from "./Textarea";

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
  args: {
    "aria-label": "Textarea field",
  },
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
};

/** 带初始值 */
export const WithValue: Story = {
  args: {
    defaultValue:
      "This is some pre-filled text content.\n\nIt can span multiple lines.",
  },
};

/** 自定义 placeholder */
export const CustomPlaceholder: Story = {
  args: {
    placeholder: "Write your story here... Be creative!",
  },
};

/** 自定义行数 */
export const CustomRows: Story = {
  args: {
    placeholder: "Enter text...",
    rows: 8,
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
};

/** Disabled 状态 */
export const Disabled: Story = {
  args: {
    placeholder: "Cannot edit",
    disabled: true,
    defaultValue: "This content is read-only",
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
};

/** Error + Disabled */
export const ErrorDisabled: Story = {
  args: {
    placeholder: "Error and disabled",
    error: true,
    disabled: true,
    defaultValue: "Invalid and read-only",
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
          aria-label="Textarea with character limit"
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
};

// ============================================================================
// Focus 测试
// ============================================================================

/**
 * Focus 状态测试
 *
 * 使用 Tab 键导航，验证 focus-visible 样式
 */
export const FocusTest: Story = {
  args: {
    placeholder: "Tab to focus",
  },
  parameters: {
    docs: {
      description: {
        story: "使用 Tab 键聚焦到 textarea，验证 focus ring 是否正确显示",
      },
    },
  },
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
      <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Tab →
      </span>
      <Textarea aria-label="First textarea" placeholder="First textarea" />
      <Textarea aria-label="Second textarea" placeholder="Second textarea" />
    </div>
  ),
};

// ============================================================================
// 完整状态矩阵
// ============================================================================

/**
 * 完整状态矩阵
 *
 * 展示所有状态组合：error × disabled
 */
export const StateMatrix: Story = {
  args: {},
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr 1fr",
        gap: "1.5rem",
        alignItems: "start",
      }}
    >
      {/* Headers */}
      <div />
      <div
        style={{
          fontSize: "12px",
          color: "var(--color-fg-muted)",
          textAlign: "center",
        }}
      >
        Normal
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "var(--color-fg-muted)",
          textAlign: "center",
        }}
      >
        Error
      </div>

      {/* Enabled row */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Enabled
      </div>
      <Textarea aria-label="Enabled textarea" placeholder="Enter text..." />
      <Textarea
        aria-label="Enabled textarea with error"
        placeholder="Invalid input"
        error
      />

      {/* Disabled row */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Disabled
      </div>
      <Textarea
        aria-label="Disabled textarea"
        placeholder="Read only"
        disabled
      />
      <Textarea
        aria-label="Disabled textarea with error"
        placeholder="Error disabled"
        error
        disabled
      />

      {/* With Value row */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        With Value
      </div>
      <Textarea
        aria-label="Textarea with value"
        defaultValue="Some content here"
      />
      <Textarea
        aria-label="Textarea with value and error"
        defaultValue="Invalid content"
        error
      />
    </div>
  ),
};

// ============================================================================
// 边界情况 Stories
// ============================================================================

/** 超长内容 */
export const LongContent: Story = {
  args: {
    defaultValue: `This is a very long piece of content that spans multiple lines.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

This content should be scrollable within the textarea.`,
    rows: 6,
  },
};

/** 单行内容 */
export const SingleLine: Story = {
  args: {
    defaultValue: "Short single line",
    rows: 2,
  },
};

/** 宽度受限容器 */
export const ConstrainedWidth: Story = {
  args: {
    placeholder: "Enter text...",
    fullWidth: true,
  },
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "200px",
          border: "1px dashed var(--color-border-default)",
          padding: "1rem",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

/** Resize 行为测试 */
export const ResizeBehavior: Story = {
  args: {},
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          Normal (resize-y enabled)
        </div>
        <Textarea
          placeholder="Drag the bottom-right corner to resize"
          rows={4}
        />
      </div>
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          Disabled (resize disabled)
        </div>
        <Textarea placeholder="Cannot resize when disabled" rows={4} disabled />
      </div>
    </div>
  ),
};

/** 最小高度测试 */
export const MinHeight: Story = {
  args: {
    placeholder: "Minimum height textarea",
    rows: 1,
  },
};

/**
 * 完整展示（用于 AI 自检）
 *
 * 包含所有状态的完整矩阵，便于一次性检查
 */
export const FullMatrix: Story = {
  args: {},
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
      {/* Basic States */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Basic States
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1.5rem",
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
              Default
            </div>
            <Textarea
              aria-label="Default textarea"
              placeholder="Enter text..."
            />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              With Value
            </div>
            <Textarea
              aria-label="Textarea with value"
              defaultValue="Some content here"
            />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Error
            </div>
            <Textarea
              aria-label="Textarea with error"
              placeholder="Invalid input"
              error
            />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Disabled
            </div>
            <Textarea
              aria-label="Disabled textarea"
              placeholder="Read only"
              disabled
            />
          </div>
        </div>
      </section>

      {/* Full Width */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Full Width
        </h3>
        <div style={{ maxWidth: "400px" }}>
          <Textarea placeholder="Full width textarea..." fullWidth />
        </div>
      </section>

      {/* Rows Variation */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Different Row Counts
        </h3>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              2 rows
            </div>
            <Textarea placeholder="2 rows" rows={2} />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              4 rows (default)
            </div>
            <Textarea placeholder="4 rows" rows={4} />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              8 rows
            </div>
            <Textarea placeholder="8 rows" rows={8} />
          </div>
        </div>
      </section>

      {/* State Combinations */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          State Combinations
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1.5rem",
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
              Error + Value
            </div>
            <Textarea
              aria-label="Textarea with value and error"
              defaultValue="Invalid content here"
              error
            />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Disabled + Value
            </div>
            <Textarea
              aria-label="Disabled textarea with value"
              defaultValue="Read-only content"
              disabled
            />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Error + Disabled
            </div>
            <Textarea
              aria-label="Disabled textarea with error"
              defaultValue="Error and disabled"
              error
              disabled
            />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Full Width + Error
            </div>
            <Textarea placeholder="Full width error" error fullWidth />
          </div>
        </div>
      </section>
    </div>
  ),
};
