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
  title: "Primitives/Checkbox",
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

// ============================================================================
// 基础 Stories
// ============================================================================

/** 默认状态：未选中 */
export const Default: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeInTheDocument();
  },
};

/** 带 label 的 Checkbox */
export const WithLabel: Story = {
  args: {
    label: "Accept terms and conditions",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeInTheDocument();
  },
};

/** 已选中状态 */
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

/** 未选中状态 */
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

/** Indeterminate 状态（部分选中） */
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

// ============================================================================
// 状态 Stories
// ============================================================================

/** Disabled 状态：未选中 */
export const DisabledUnchecked: Story = {
  args: {
    disabled: true,
    label: "Disabled unchecked",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeInTheDocument();
  },
};

/** Disabled 状态：已选中 */
export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
    label: "Disabled checked",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeInTheDocument();
  },
};

/** Disabled 状态：indeterminate */
export const DisabledIndeterminate: Story = {
  args: {
    disabled: true,
    checked: "indeterminate",
    label: "Disabled indeterminate",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeInTheDocument();
  },
};

// ============================================================================
// 交互 Stories
// ============================================================================

/** Controlled：受控模式演示 */
export const Controlled: Story = {
  args: {
    label: "Toggle me",
  },
  render: function ControlledCheckbox() {
    const [checked, setChecked] = useState(false);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Checkbox
          label="Toggle this checkbox"
          checked={checked}
          onCheckedChange={(value) => setChecked(value === true)}
        />
        <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
          Current state: {checked ? "checked" : "unchecked"}
        </span>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeInTheDocument();
  },
};
