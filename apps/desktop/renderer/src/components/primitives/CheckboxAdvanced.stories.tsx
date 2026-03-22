import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Checkbox } from "./Checkbox";
import { within, expect } from "@storybook/test";

/**
 * Checkbox 组件 Story
 *
 * 设计规范 §6.2
 * 基于 Radix UI Checkbox 的复选框组件。
 * 支持 checked、unchecked、indeterminate 三种状态。
 *
 * 状态矩阵（MUST 全部实现）：
 * - unchecked: 默认空白状态
 * - checked: 显示勾选图标
 * - indeterminate: 显示横线图标（用于全选场景）
 * - hover: 边框高亮
 * - focus-visible: 显示 focus ring（Tab 键聚焦）
 * - disabled: opacity: 0.5，不可交互
 */
const meta = {
  title: "Primitives/Checkbox/Advanced",
  component: Checkbox,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `## 使用指南

### 何时使用
- **多选**: 从列表中选择零到多个选项
- **开关**: 单独的布尔开关（如"同意条款"）
- **批量操作**: 配合 \`indeterminate\` 状态实现全选/部分选中

### 注意事项
- 单个布尔选项也可使用 Toggle/Switch 组件
- 始终提供 \`label\`，确保可访问性
- \`indeterminate\` 状态仅用于父级复选框表示子项部分选中
- 支持键盘操作：Space 切换状态，Tab 聚焦`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Optional label text displayed next to the checkbox",
    },
    checked: {
      control: "select",
      options: [true, false, "indeterminate"],
      description: "Controlled checked state",
    },
    disabled: {
      control: "boolean",
      description: "Disable the checkbox",
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Checked: Story = {
  args: {
    checked: true,
    label: "Selected option",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeInTheDocument();
  },
};

export const Unchecked: Story = {
  args: {
    checked: false,
    label: "Unselected option",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeInTheDocument();
  },
};

export const Indeterminate: Story = {
  args: {
    checked: "indeterminate",
    label: "Partially selected",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeInTheDocument();
  },
};

/** Select All 模式：演示 indeterminate 使用场景 */
export const SelectAllDemo: Story = {
  args: {},
  render: function SelectAllDemoComponent() {
    const [items, setItems] = useState([false, true, false]);

    const allSelected = items.every(Boolean);
    const someSelected = items.some(Boolean);
    const selectAllState = allSelected
      ? true
      : someSelected
        ? "indeterminate"
        : false;

    const handleSelectAll = (checked: boolean | "indeterminate") => {
      if (checked === true) {
        setItems([true, true, true]);
      } else {
        setItems([false, false, false]);
      }
    };

    const handleItemChange = (index: number, checked: boolean) => {
      const newItems = [...items];
      newItems[index] = checked;
      setItems(newItems);
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <Checkbox
          label="Select All"
          checked={selectAllState}
          onCheckedChange={handleSelectAll}
        />
        <div
          style={{
            marginLeft: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {["Item 1", "Item 2", "Item 3"].map((item, index) => (
            <Checkbox
              key={item}
              label={item}
              checked={items[index]}
              onCheckedChange={(checked) =>
                handleItemChange(index, checked === true)
              }
            />
          ))}
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeInTheDocument();
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
  args: {},
  parameters: {
    docs: {
      description: {
        story: "使用 Tab 键聚焦到 checkbox，验证 focus ring 是否正确显示",
      },
    },
  },
  render: () => (
    <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
      <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Tab →
      </span>
      <Checkbox label="First" />
      <Checkbox label="Second" />
      <Checkbox label="Third" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeInTheDocument();
  },
};

// ============================================================================
// 完整状态矩阵
// ============================================================================

/**
 * 完整状态矩阵
 *
 * 展示所有状态组合：checked × disabled
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
        gridTemplateColumns: "auto auto auto auto",
        gap: "1.5rem",
        alignItems: "center",
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
        Unchecked
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "var(--color-fg-muted)",
          textAlign: "center",
        }}
      >
        Checked
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "var(--color-fg-muted)",
          textAlign: "center",
        }}
      >
        Indeterminate
      </div>

      {/* Normal row */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Normal
      </div>
      <Checkbox />
      <Checkbox checked={true} />
      <Checkbox checked="indeterminate" />

      {/* Disabled row */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Disabled
      </div>
      <Checkbox disabled />
      <Checkbox disabled checked={true} />
      <Checkbox disabled checked="indeterminate" />

      {/* With Label row */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        With Label
      </div>
      <Checkbox label="Label" />
      <Checkbox label="Label" checked={true} />
      <Checkbox label="Label" checked="indeterminate" />

      {/* Disabled with Label row */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Disabled + Label
      </div>
      <Checkbox disabled label="Label" />
      <Checkbox disabled label="Label" checked={true} />
      <Checkbox disabled label="Label" checked="indeterminate" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeInTheDocument();
  },
};

// ============================================================================
// 边界情况 Stories
// ============================================================================

/** 超长 label 文本 */
export const LongLabel: Story = {
  args: {
    label:
      "This is a very long label text that might wrap to multiple lines in some containers and should still align properly with the checkbox",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeInTheDocument();
  },
};

/** 超长 label 在有限宽度容器中 */
export const LongLabelConstrained: Story = {
  args: {},
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div
      style={{
        width: "200px",
        border: "1px dashed var(--color-border-default)",
        padding: "1rem",
      }}
    >
      <Checkbox label="This is a very long label text that should wrap nicely within this constrained container" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeInTheDocument();
  },
};

/** 无 label 的多个 Checkbox（列表场景） */
export const NoLabelList: Story = {
  args: {},
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Checkbox />
        <span style={{ fontSize: "13px" }}>Custom content 1</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Checkbox checked={true} />
        <span style={{ fontSize: "13px" }}>Custom content 2</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Checkbox />
        <span style={{ fontSize: "13px" }}>Custom content 3</span>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeInTheDocument();
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
      {/* States Section */}
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
            gridTemplateColumns: "repeat(3, auto)",
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
              Unchecked
            </div>
            <Checkbox label="Unchecked" />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Checked
            </div>
            <Checkbox label="Checked" checked={true} />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Indeterminate
            </div>
            <Checkbox label="Indeterminate" checked="indeterminate" />
          </div>
        </div>
      </section>

      {/* Disabled Section */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Disabled States
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, auto)",
            gap: "1.5rem",
          }}
        >
          <Checkbox disabled label="Disabled unchecked" />
          <Checkbox disabled label="Disabled checked" checked={true} />
          <Checkbox
            disabled
            label="Disabled indeterminate"
            checked="indeterminate"
          />
        </div>
      </section>

      {/* Without Label Section */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Without Label
        </h3>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <Checkbox />
          <Checkbox checked={true} />
          <Checkbox checked="indeterminate" />
          <Checkbox disabled />
          <Checkbox disabled checked={true} />
        </div>
      </section>
    </div>
  ),
};
