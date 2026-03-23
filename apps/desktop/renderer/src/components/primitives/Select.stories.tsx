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
  title: "Primitives/Select",
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

// ============================================================================
// Mock 数据
// ============================================================================

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

const manyOptions: SelectOption[] = Array.from({ length: 50 }, (_, i) => ({
  value: `option-${i + 1}`,
  label: `Option ${i + 1}`,
}));

// ============================================================================
// 基础 Stories
// ============================================================================

/** 默认状态：显示 placeholder */
export const Default: Story = {
  args: {
    placeholder: "Select a color...",
    options: simpleOptions,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toBeInTheDocument();
  },
};

/** 带预选值 */
export const WithValue: Story = {
  args: {
    placeholder: "Select a color...",
    options: simpleOptions,
    defaultValue: "blue",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toBeInTheDocument();
  },
};

/** 自定义 placeholder */
export const CustomPlaceholder: Story = {
  args: {
    placeholder: "Choose your favorite color",
    options: simpleOptions,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toBeInTheDocument();
  },
};

// ============================================================================
// 分组选项 Stories
// ============================================================================

/** 分组选项 */
export const Grouped: Story = {
  args: {
    placeholder: "Select a food...",
    options: groupedOptions,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toBeInTheDocument();
  },
};

/** 分组选项带预选值 */
export const GroupedWithValue: Story = {
  args: {
    placeholder: "Select a food...",
    options: groupedOptions,
    defaultValue: "banana",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toBeInTheDocument();
  },
};

// ============================================================================
// 状态 Stories
// ============================================================================

/** Disabled 状态 */
export const Disabled: Story = {
  args: {
    placeholder: "Select a color...",
    options: simpleOptions,
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toBeInTheDocument();
  },
};

/** Disabled 带值 */
export const DisabledWithValue: Story = {
  args: {
    placeholder: "Select a color...",
    options: simpleOptions,
    defaultValue: "red",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toBeInTheDocument();
  },
};

/** 带禁用选项 */
export const WithDisabledOptions: Story = {
  args: {
    placeholder: "Select an option...",
    options: optionsWithDisabled,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toBeInTheDocument();
  },
};

/** Full Width */
export const FullWidth: Story = {
  args: {
    placeholder: "Select a color...",
    options: simpleOptions,
    fullWidth: true,
  },
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "300px" }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toBeInTheDocument();
  },
};

// ============================================================================
// 交互 Stories
// ============================================================================

/** Controlled：受控模式演示 */
export const Controlled: Story = {
  args: {
    options: simpleOptions,
  },
  render: function ControlledSelect() {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Select
          placeholder="Select a color..."
          options={simpleOptions}
          value={value}
          onValueChange={setValue}
        />
        <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
          Selected: {value ?? "none"}
        </span>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toBeInTheDocument();
  },
};

/** 多个 Select 联动 */
export const LinkedSelects: Story = {
  args: {
    options: simpleOptions,
  },
  render: function LinkedSelectsComponent() {
    const [category, setCategory] = useState<string | undefined>(undefined);

    const categoryOptions: SelectOption[] = [
      { value: "fruits", label: "Fruits" },
      { value: "vegetables", label: "Vegetables" },
    ];

    const itemOptions: Record<string, SelectOption[]> = {
      fruits: [
        { value: "apple", label: "Apple" },
        { value: "banana", label: "Banana" },
      ],
      vegetables: [
        { value: "carrot", label: "Carrot" },
        { value: "broccoli", label: "Broccoli" },
      ],
    };

    return (
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
        <Select
          placeholder="Select category..."
          options={categoryOptions}
          value={category}
          onValueChange={setCategory}
        />
        <Select
          placeholder="Select item..."
          options={category ? itemOptions[category] : []}
          disabled={!category}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toBeInTheDocument();
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
    options: simpleOptions,
  },
  parameters: {
    docs: {
      description: {
        story: "使用 Tab 键聚焦到 select，验证 focus ring 是否正确显示",
      },
    },
  },
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Tab →
      </span>
      <Select placeholder="First" options={simpleOptions} />
      <Select placeholder="Second" options={simpleOptions} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toBeInTheDocument();
  },
};

// ============================================================================
// 边界情况 Stories
// ============================================================================

/** 大量选项（滚动测试） */
export const ManyOptions: Story = {
  args: {
    placeholder: "Select from many options...",
    options: manyOptions,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toBeInTheDocument();
  },
};

/** 超长选项文本 */
export const LongOptionLabels: Story = {
  args: {
    placeholder: "Select an option...",
    options: [
      {
        value: "long-1",
        label:
          "This is a very long option label that might overflow in some containers",
      },
      {
        value: "long-2",
        label:
          "Another extremely long option label for testing text overflow behavior",
      },
      { value: "short", label: "Short" },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toBeInTheDocument();
  },
};
