import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { SelectOption, SelectGroup } from "./Select";
import { Select } from "./Select";
import { within, expect } from "@storybook/test";

/**
 * Select 组件 Story
 *
 * 设计规范 §5.2, §6.2
 * 基于 Radix UI Select 的下拉选择组件。
 * 支持扁平选项和分组选项。
 *
 * 状态矩阵（MUST 全部实现）：
 * - default: 显示 placeholder
 * - selected: 显示选中值
 * - open: 下拉面板展开
 * - hover: 边框高亮
 * - focus-visible: 显示 focus ring
 * - disabled: opacity: 0.5，不可交互
 */
const meta = {
  title: "Primitives/Select/Advanced",
  component: Select,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `## 使用指南

### 何时使用
- **预设选项**: 从有限的预定义列表中选择一项（3–15 项最佳）
- **分组选项**: 使用 \`groups\` 属性按类别组织选项
- **表单字段**: 配合 FormField 组件使用，提供 label 和验证

### 注意事项
- 选项超过 15 项时，考虑使用 ComboBox（支持搜索过滤）
- 始终提供 \`placeholder\`，引导用户进行选择
- 禁用的选项仍显示在列表中，但不可选
- 使用 \`fullWidth\` 适配表单布局`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text when no value is selected",
    },
    disabled: {
      control: "boolean",
      description: "Disable the select",
    },
    fullWidth: {
      control: "boolean",
      description: "Full width select",
    },
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

const simpleOptions: SelectOption[] = [
  { value: "red", label: "Red" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "yellow", label: "Yellow" },
  { value: "purple", label: "Purple" },
];

const optionsWithDisabled: SelectOption[] = [
  { value: "available-1", label: "Available Option 1" },
  { value: "available-2", label: "Available Option 2" },
  { value: "disabled-1", label: "Disabled Option", disabled: true },
  { value: "available-3", label: "Available Option 3" },
];

const groupedOptions: SelectGroup[] = [
  {
    label: "Fruits",
    options: [
      { value: "apple", label: "Apple" },
      { value: "banana", label: "Banana" },
      { value: "orange", label: "Orange" },
    ],
  },
  {
    label: "Vegetables",
    options: [
      { value: "carrot", label: "Carrot" },
      { value: "broccoli", label: "Broccoli" },
      { value: "spinach", label: "Spinach" },
    ],
  },
];

export const Default: Story = {
  args: {
    placeholder: "Select a color...",
    options: simpleOptions,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toBeInTheDocument();
  },
};

export const Grouped: Story = {
  args: {
    placeholder: "Select a food...",
    options: groupedOptions,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Select a color...",
    options: simpleOptions,
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toBeInTheDocument();
  },
};


/** 超长选项在有限宽度 */
export const LongOptionsConstrained: Story = {
  args: {
    placeholder: "Select...",
    options: [
      {
        value: "long-1",
        label: "This is a very long option label that might need truncation",
      },
      { value: "short", label: "Short" },
    ],
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toBeInTheDocument();
  },
};

/** 空选项列表 */
export const EmptyOptions: Story = {
  args: {
    placeholder: "No options available",
    options: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toBeInTheDocument();
  },
};

/** 单个选项 */
export const SingleOption: Story = {
  args: {
    placeholder: "Select...",
    options: [{ value: "only", label: "Only Option" }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toBeInTheDocument();
  },
};

// ============================================================================
// 完整状态矩阵
// ============================================================================

/**
 * 完整状态矩阵
 *
 * 展示所有状态组合
 */
export const StateMatrix: Story = {
  args: {
    options: simpleOptions,
  },
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: "1.5rem",
        alignItems: "center",
      }}
    >
      {/* Default */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Default
      </div>
      <Select placeholder="Select..." options={simpleOptions} />

      {/* With Value */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        With Value
      </div>
      <Select
        placeholder="Select..."
        options={simpleOptions}
        defaultValue="blue"
      />

      {/* Disabled */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Disabled
      </div>
      <Select placeholder="Select..." options={simpleOptions} disabled />

      {/* Disabled with Value */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Disabled + Value
      </div>
      <Select
        placeholder="Select..."
        options={simpleOptions}
        defaultValue="green"
        disabled
      />

      {/* Grouped */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Grouped
      </div>
      <Select placeholder="Select..." options={groupedOptions} />

      {/* With Disabled Options */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Disabled Options
      </div>
      <Select placeholder="Select..." options={optionsWithDisabled} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toBeInTheDocument();
  },
};

/**
 * 完整展示（用于 AI 自检）
 *
 * 包含所有状态的完整矩阵，便于一次性检查
 */
export const FullMatrix: Story = {
  args: {
    options: simpleOptions,
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
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
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
            <Select placeholder="Select..." options={simpleOptions} />
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
            <Select
              placeholder="Select..."
              options={simpleOptions}
              defaultValue="blue"
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
            <Select placeholder="Select..." options={simpleOptions} disabled />
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
            <Select
              placeholder="Select..."
              options={simpleOptions}
              defaultValue="red"
              disabled
            />
          </div>
        </div>
      </section>

      {/* Option Types */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Option Types
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
              Simple
            </div>
            <Select placeholder="Select..." options={simpleOptions} />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Grouped
            </div>
            <Select placeholder="Select..." options={groupedOptions} />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              With Disabled Options
            </div>
            <Select placeholder="Select..." options={optionsWithDisabled} />
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
        <div style={{ maxWidth: "300px" }}>
          <Select
            placeholder="Full width select..."
            options={simpleOptions}
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
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Empty Options
            </div>
            <Select placeholder="No options" options={[]} />
          </div>
          <div>
            <div
              style={{
                marginBottom: "0.5rem",
                fontSize: "12px",
                color: "var(--color-fg-muted)",
              }}
            >
              Single Option
            </div>
            <Select
              placeholder="Select..."
              options={[{ value: "only", label: "Only Option" }]}
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
              Long Labels
            </div>
            <Select
              placeholder="Select..."
              options={[
                {
                  value: "long",
                  label:
                    "This is a very long label that might overflow in some containers",
                },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  ),
};
