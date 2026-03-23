import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ListItem } from "./ListItem";

/**
 * ListItem 组件 — Focus / 键盘 / 完整展示
 *
 * 设计规范 §6.4
 * 从 ListItemAdvanced 拆分，保持单文件 ≤ 500 行。
 */
const meta = {
  title: "Primitives/ListItem/Matrix",
  component: ListItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

// ============================================================================
// Focus 测试
// ============================================================================

/**
 * Focus 测试
 *
 * 使用 Tab 键导航，验证 focus-visible 样式
 */
export const FocusTest: Story = {
  args: {
    children: "Focus",
  },
  parameters: {
    docs: {
      description: {
        story: "使用 Tab 键在列表项之间导航，验证 focus ring 样式",
      },
    },
  },
  render: () => (
    <div style={{ width: "200px" }}>
      <ListItem interactive>First Item (Tab here)</ListItem>
      <ListItem interactive>Second Item</ListItem>
      <ListItem interactive>Third Item</ListItem>
    </div>
  ),
};

/**
 * 键盘交互
 */
export const KeyboardInteraction: Story = {
  args: {
    children: "Keyboard",
  },
  render: function Render() {
    const [clicked, setClicked] = useState<string | null>(null);

    return (
      <div style={{ width: "200px" }}>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          Clicked: {clicked ?? "none"}
        </div>
        {["Item 1", "Item 2", "Item 3"].map((item) => (
          <ListItem
            key={item}
            interactive
            selected={clicked === item}
            onClick={() => setClicked(item)}
          >
            {item}
          </ListItem>
        ))}
        <div
          style={{
            marginTop: "0.5rem",
            fontSize: "11px",
            color: "var(--color-fg-subtle)",
          }}
        >
          Try Tab, Enter, and Space keys
        </div>
      </div>
    );
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
    children: "Item",
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
            margin: "0 0 0.5rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          State Variants
        </h3>
        <div style={{ width: "200px" }}>
          <ListItem>Static</ListItem>
          <ListItem interactive>Interactive</ListItem>
          <ListItem interactive selected>
            Selected
          </ListItem>
          <ListItem interactive disabled>
            Disabled
          </ListItem>
        </div>
      </section>

      {/* Sizes */}
      <section>
        <h3
          style={{
            margin: "0 0 0.5rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Size Variants
        </h3>
        <div style={{ width: "200px" }}>
          <ListItem interactive>Standard (40px)</ListItem>
          <ListItem compact interactive>
            Compact (32px)
          </ListItem>
        </div>
      </section>

      {/* With Content */}
      <section>
        <h3
          style={{
            margin: "0 0 0.5rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          With Content
        </h3>
        <div style={{ width: "220px" }}>
          <ListItem interactive>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0z" />
            </svg>
            <span>With Icon</span>
          </ListItem>
          <ListItem interactive style={{ justifyContent: "space-between" }}>
            <span>With Badge</span>
            <span
              style={{
                padding: "2px 6px",
                fontSize: "11px",
                background: "var(--color-accent)",
                color: "white",
                borderRadius: "10px",
              }}
            >
              3
            </span>
          </ListItem>
        </div>
      </section>

      {/* Interactive List */}
      <section>
        <h3
          style={{
            margin: "0 0 0.5rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Interactive List
        </h3>
        <div
          style={{
            width: "200px",
            padding: "4px",
            background: "var(--color-bg-surface)",
            borderRadius: "var(--radius-md)",
          }}
        >
          {["Home", "Documents", "Settings", "Help"].map((item, i) => (
            <ListItem key={item} compact interactive selected={i === 1}>
              {item}
            </ListItem>
          ))}
        </div>
      </section>
    </div>
  ),
};
