import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Checkbox } from "./Checkbox";

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
  args: {
    "aria-label": "Checkbox option",
  },
  parameters: {
    layout: "centered",
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
};

/** 带 label 的 Checkbox */
export const WithLabel: Story = {
  args: {
    label: "Accept terms and conditions",
  },
};

/** 已选中状态 */
export const Checked: Story = {
  args: {
    checked: true,
    label: "Selected option",
  },
};

/** 未选中状态 */
export const Unchecked: Story = {
  args: {
    checked: false,
    label: "Unselected option",
  },
};

/** Indeterminate 状态（部分选中） */
export const Indeterminate: Story = {
  args: {
    checked: "indeterminate",
    label: "Partially selected",
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
};

/** Disabled 状态：已选中 */
export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
    label: "Disabled checked",
  },
};

/** Disabled 状态：indeterminate */
export const DisabledIndeterminate: Story = {
  args: {
    disabled: true,
    checked: "indeterminate",
    label: "Disabled indeterminate",
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
      <Checkbox aria-label="Enabled unchecked checkbox" />
      <Checkbox aria-label="Enabled checked checkbox" checked={true} />
      <Checkbox
        aria-label="Enabled indeterminate checkbox"
        checked="indeterminate"
      />

      {/* Disabled row */}
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Disabled
      </div>
      <Checkbox aria-label="Disabled unchecked checkbox" disabled />
      <Checkbox
        aria-label="Disabled checked checkbox"
        disabled
        checked={true}
      />
      <Checkbox
        aria-label="Disabled indeterminate checkbox"
        disabled
        checked="indeterminate"
      />

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
};

/** 无 label 的多个 Checkbox（列表场景） */
export const NoLabelList: Story = {
  args: {},
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Checkbox aria-label="First checkbox" />
        <span style={{ fontSize: "13px" }}>Custom content 1</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Checkbox aria-label="Second checkbox" checked={true} />
        <span style={{ fontSize: "13px" }}>Custom content 2</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Checkbox aria-label="Third checkbox" />
        <span style={{ fontSize: "13px" }}>Custom content 3</span>
      </div>
    </div>
  ),
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
          <Checkbox aria-label="Unchecked checkbox" />
          <Checkbox aria-label="Checked checkbox" checked={true} />
          <Checkbox
            aria-label="Indeterminate checkbox"
            checked="indeterminate"
          />
          <Checkbox aria-label="Disabled unchecked checkbox" disabled />
          <Checkbox
            aria-label="Disabled checked checkbox"
            disabled
            checked={true}
          />
        </div>
      </section>
    </div>
  ),
};
