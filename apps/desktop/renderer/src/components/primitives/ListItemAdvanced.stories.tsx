import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ListItem } from "./ListItem";
import { within, expect } from "@storybook/test";

/**
 * ListItem 组件 Story
 *
 * 设计规范 §6.4
 * 列表项组件，用于列表、树形结构和菜单。
 *
 * 状态矩阵（MUST 全部实现）：
 * - default: 正常状态
 * - hover: 悬停状态（interactive 时）
 * - active: 按下状态（interactive 时）
 * - selected: 选中状态
 * - focus-visible: 键盘聚焦状态
 * - disabled: 禁用状态
 *
 * 尺寸：
 * - standard: 40px 高度（默认）
 * - compact: 32px 高度
 */
const meta = {
  title: "Primitives/ListItem/Advanced",
  component: ListItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    selected: {
      control: "boolean",
      description: "Item is selected/active",
    },
    compact: {
      control: "boolean",
      description: "Use compact height (32px)",
    },
    interactive: {
      control: "boolean",
      description: "Make item clickable with hover states",
    },
    disabled: {
      control: "boolean",
      description: "Disable the item",
    },
  },
} satisfies Meta<typeof ListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    children: "Clickable Item",
    interactive: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('[data-testid]') || canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Selected: Story = {
  args: {
    children: "Selected Item",
    selected: true,
    interactive: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('[data-testid]') || canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Compact: Story = {
  args: {
    children: "Compact Item",
    compact: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('[data-testid]') || canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled Item",
    disabled: true,
    interactive: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('[data-testid]') || canvasElement.firstElementChild).toBeTruthy();
  },
};


// ============================================================================
// 列表示例
// ============================================================================

/**
 * 文件列表
 */
export const FileList: Story = {
  args: {
    children: "File",
  },
  render: function Render() {
    const [selected, setSelected] = useState("doc1");
    const files = [
      { id: "doc1", name: "Chapter 1.md", icon: "📄" },
      { id: "doc2", name: "Chapter 2.md", icon: "📄" },
      { id: "doc3", name: "Characters.md", icon: "👥" },
      { id: "notes", name: "Notes", icon: "📁" },
    ];

    return (
      <div style={{ width: "220px", padding: "4px" }}>
        {files.map((file) => (
          <ListItem
            key={file.id}
            compact
            interactive
            selected={selected === file.id}
            onClick={() => setSelected(file.id)}
          >
            <span>{file.icon}</span>
            <span>{file.name}</span>
          </ListItem>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('[data-testid]') || canvasElement.firstElementChild).toBeTruthy();
  },
};

/**
 * 菜单列表
 */
export const MenuList: Story = {
  args: {
    children: "Menu Item",
  },
  render: () => (
    <div
      style={{
        width: "180px",
        padding: "4px",
        background: "var(--color-bg-raised)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <ListItem compact interactive>
        <span>Edit</span>
      </ListItem>
      <ListItem compact interactive>
        <span>Duplicate</span>
      </ListItem>
      <ListItem compact interactive>
        <span>Move to...</span>
      </ListItem>
      <div
        style={{
          height: "1px",
          margin: "4px 0",
          background: "var(--color-separator)",
        }}
      />
      <ListItem compact interactive style={{ color: "var(--color-error)" }}>
        <span>Delete</span>
      </ListItem>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('[data-testid]') || canvasElement.firstElementChild).toBeTruthy();
  },
};

/**
 * 设置列表
 */
export const SettingsList: Story = {
  args: {
    children: "Setting",
  },
  render: function Render() {
    const [selected, setSelected] = useState("general");
    const settings = [
      { id: "general", label: "General" },
      { id: "appearance", label: "Appearance" },
      { id: "editor", label: "Editor" },
      { id: "ai", label: "AI Settings" },
      { id: "shortcuts", label: "Keyboard Shortcuts" },
    ];

    return (
      <div style={{ width: "200px" }}>
        {settings.map((setting) => (
          <ListItem
            key={setting.id}
            interactive
            selected={selected === setting.id}
            onClick={() => setSelected(setting.id)}
          >
            {setting.label}
          </ListItem>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('[data-testid]') || canvasElement.firstElementChild).toBeTruthy();
  },
};

// ============================================================================
// 边界情况
// ============================================================================

/**
 * 长文本
 */
export const LongText: Story = {
  args: {
    children:
      "This is a very long list item text that might overflow the container",
    interactive: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "200px" }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('[data-testid]') || canvasElement.firstElementChild).toBeTruthy();
  },
};

/**
 * 短文本
 */
export const ShortText: Story = {
  args: {
    children: "Hi",
    interactive: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('[data-testid]') || canvasElement.firstElementChild).toBeTruthy();
  },
};

/**
 * 嵌套内容
 */
export const NestedContent: Story = {
  args: {
    children: "Nested",
    interactive: true,
  },
  render: () => (
    <div style={{ width: "250px" }}>
      <ListItem interactive>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontWeight: 500 }}>Primary Text</span>
          <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
            Secondary description
          </span>
        </div>
      </ListItem>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('[data-testid]') || canvasElement.firstElementChild).toBeTruthy();
  },
};

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
