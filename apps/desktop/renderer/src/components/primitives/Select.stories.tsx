import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { SelectOption, SelectGroup } from "./Select";
import { Select } from "./Select";

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
  args: {
    "aria-label": "Select field",
  },
  parameters: {
    layout: "centered",
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
};

/** 带预选值 */
export const WithValue: Story = {
  args: {
    placeholder: "Select a color...",
    options: simpleOptions,
    defaultValue: "blue",
  },
};

/** 自定义 placeholder */
export const CustomPlaceholder: Story = {
  args: {
    placeholder: "Choose your favorite color",
    options: simpleOptions,
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
};

/** 分组选项带预选值 */
export const GroupedWithValue: Story = {
  args: {
    placeholder: "Select a food...",
    options: groupedOptions,
    defaultValue: "banana",
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
};

/** Disabled 带值 */
export const DisabledWithValue: Story = {
  args: {
    placeholder: "Select a color...",
    options: simpleOptions,
    defaultValue: "red",
    disabled: true,
  },
};

/** 带禁用选项 */
export const WithDisabledOptions: Story = {
  args: {
    placeholder: "Select an option...",
    options: optionsWithDisabled,
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
          aria-label="Controlled select"
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
          aria-label="Category select"
          placeholder="Select category..."
          options={categoryOptions}
          value={category}
          onValueChange={setCategory}
        />
        <Select
          aria-label="Item select"
          placeholder="Select item..."
          options={category ? itemOptions[category] : []}
          disabled={!category}
        />
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
};

/** 空选项列表 */
export const EmptyOptions: Story = {
  args: {
    placeholder: "No options available",
    options: [],
  },
};

/** 单个选项 */
export const SingleOption: Story = {
  args: {
    placeholder: "Select...",
    options: [{ value: "only", label: "Only Option" }],
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
