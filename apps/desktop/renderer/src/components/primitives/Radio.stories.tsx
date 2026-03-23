import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  RadioGroup,
  Radio,
  RadioGroupRoot,
  RadioCardGroup,
  RadioCardItem,
} from "./Radio";
import { within, expect } from "@storybook/test";

/**
 * Radio 组件 Story
 *
 * 用于单选选择。
 * 基于 Radix UI RadioGroup。
 */
const meta = {
  title: "Primitives/Radio",
  component: RadioGroup,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["vertical", "horizontal"],
      description: "Orientation of the radio group",
    },
    size: {
      control: "select",
      options: ["sm", "md"],
      description: "Size of the radio buttons",
    },
    disabled: {
      control: "boolean",
      description: "Whether the group is disabled",
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample options
const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const planOptions = [
  {
    value: "free",
    label: "Free",
    description: "Basic features, up to 3 projects",
  },
  {
    value: "pro",
    label: "Pro",
    description: "$9.99/month, unlimited projects",
  },
  {
    value: "team",
    label: "Team",
    description: "$29.99/month, collaboration features",
  },
];

// ============================================================================
// 基础 Stories
// ============================================================================

/** 默认状态 */
export const Default: Story = {
  args: {
    options: themeOptions,
    defaultValue: "dark",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("radio")).toBeInTheDocument();
  },
};

/** 水平布局 */
export const Horizontal: Story = {
  args: {
    options: themeOptions,
    orientation: "horizontal",
    defaultValue: "dark",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("radio")).toBeInTheDocument();
  },
};

/** 带描述 */
export const WithDescriptions: Story = {
  args: {
    options: planOptions,
    defaultValue: "pro",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("radio")).toBeInTheDocument();
  },
};

/** 小尺寸 */
export const Small: Story = {
  args: {
    options: themeOptions,
    size: "sm",
    defaultValue: "dark",
  },
};

/** 禁用整个组 */
export const DisabledGroup: Story = {
  args: {
    options: themeOptions,
    disabled: true,
    defaultValue: "dark",
  },
};

/** 禁用单个选项 */
export const DisabledOption: Story = {
  args: {
    options: [
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
      { value: "system", label: "System", disabled: true },
    ],
    defaultValue: "dark",
  },
};

// ============================================================================
// 受控模式
// ============================================================================

function ControlledDemo() {
  const [value, setValue] = React.useState("dark");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Selected: {value}
      </div>
      <RadioGroup
        options={themeOptions}
        value={value}
        onValueChange={setValue}
      />
    </div>
  );
}

export const Controlled: Story = {
  args: {
    options: themeOptions,
  },
  render: () => <ControlledDemo />,
};

// ============================================================================
// 组合展示
// ============================================================================

/** 所有 Sizes */
export const AllSizes: Story = {
  args: {
    options: themeOptions,
  },
  render: () => (
    <div style={{ display: "flex", gap: "3rem" }}>
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          Small
        </div>
        <RadioGroup options={themeOptions} size="sm" defaultValue="dark" />
      </div>
      <div>
        <div
          style={{
            marginBottom: "0.5rem",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          Medium
        </div>
        <RadioGroup options={themeOptions} size="md" defaultValue="dark" />
      </div>
    </div>
  ),
};

/** 表单中使用 */
export const InForm: Story = {
  args: {
    options: themeOptions,
  },
  render: () => (
    <form
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        maxWidth: "300px",
        padding: "1.5rem",
        backgroundColor: "var(--color-bg-surface)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "0.75rem",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--color-fg-default)",
          }}
        >
          Theme
        </label>
        <RadioGroup options={themeOptions} name="theme" defaultValue="dark" />
      </div>
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "0.75rem",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--color-fg-default)",
          }}
        >
          Plan
        </label>
        <RadioGroup options={planOptions} name="plan" defaultValue="pro" />
      </div>
    </form>
  ),
};

// ============================================================================
// 自定义布局
// ============================================================================

export const CustomLayout: Story = {
  args: {
    options: themeOptions,
  },
  render: () => (
    <RadioGroupRoot defaultValue="dark" className="grid grid-cols-3 gap-3">
      {["light", "dark", "system"].map((theme) => (
        <label
          key={theme}
          className="flex items-center gap-3 p-3 border border-[var(--color-border-default)] rounded-[var(--radius-md)] cursor-pointer hover:bg-[var(--color-bg-hover)] has-[[data-state=checked]]:border-[var(--color-fg-default)] has-[[data-state=checked]]:bg-[var(--color-bg-hover)]"
        >
          <Radio value={theme} />
          <span className="text-sm text-[var(--color-fg-default)] capitalize">
            {theme}
          </span>
        </label>
      ))}
    </RadioGroupRoot>
  ),
};

// ============================================================================
// 边界情况
// ============================================================================

/** 长标签 */
export const LongLabels: Story = {
  args: {
    options: [
      {
        value: "option1",
        label: "This is a very long option label that might wrap",
      },
      {
        value: "option2",
        label: "Another long option with detailed description",
        description:
          "This description provides additional context about what this option does and when you might want to select it.",
      },
    ],
  },
};

/** 单个选项 */
export const SingleOption: Story = {
  args: {
    options: [{ value: "only", label: "Only option" }],
    defaultValue: "only",
  },
};

/** 多个选项 */
export const ManyOptions: Story = {
  args: {
    options: Array.from({ length: 8 }, (_, i) => ({
      value: `option-${i + 1}`,
      label: `Option ${i + 1}`,
    })),
  },
};

// ============================================================================
// RadioCardGroup Stories
// ============================================================================

// Template options for project types
const templateOptions = [
  { value: "novel", label: "Novel" },
  { value: "short", label: "Short Story" },
  { value: "script", label: "Screenplay" },
  { value: "other", label: "Other" },
];

/** Card Group 默认 2x2 网格 */
export const CardGroup: StoryObj<typeof RadioCardGroup> = {
  render: () => (
    <div style={{ maxWidth: "400px" }}>
      <RadioCardGroup
        options={templateOptions}
        defaultValue="novel"
        columns={2}
      />
    </div>
  ),
};

/** Card Group 3 列 */
export const CardGroup3Columns: StoryObj<typeof RadioCardGroup> = {
  render: () => (
    <div style={{ maxWidth: "500px" }}>
      <RadioCardGroup
        options={[...templateOptions, { value: "essay", label: "Essay" }]}
        defaultValue="novel"
        columns={3}
      />
    </div>
  ),
};

/** Card Group 受控模式 */
function CardGroupControlledDemo() {
  const [value, setValue] = React.useState("novel");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Selected: {value}
      </div>
      <div style={{ maxWidth: "400px" }}>
        <RadioCardGroup
          options={templateOptions}
          value={value}
          onValueChange={setValue}
          columns={2}
        />
      </div>
    </div>
  );
}

export const CardGroupControlled: StoryObj<typeof RadioCardGroup> = {
  render: () => <CardGroupControlledDemo />,
};

/** Card Group 禁用状态 */
export const CardGroupDisabled: StoryObj<typeof RadioCardGroup> = {
  render: () => (
    <div style={{ maxWidth: "400px" }}>
      <RadioCardGroup
        options={templateOptions}
        defaultValue="novel"
        disabled
        columns={2}
      />
    </div>
  ),
};

/** Card Group 部分禁用 */
export const CardGroupPartialDisabled: StoryObj<typeof RadioCardGroup> = {
  render: () => (
    <div style={{ maxWidth: "400px" }}>
      <RadioCardGroup
        options={[
          { value: "novel", label: "Novel" },
          { value: "short", label: "Short Story" },
          { value: "script", label: "Screenplay", disabled: true },
          { value: "other", label: "Other" },
        ]}
        defaultValue="novel"
        columns={2}
      />
    </div>
  ),
};

/** Card Group 带 Action 入口 */
function CardGroupWithActionDemo() {
  const [value, setValue] = React.useState("novel");
  const [templates] = React.useState(templateOptions);

  const handleCreateTemplate = () => {
    alert("Open Create Template Dialog");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Selected: {value}
      </div>
      <div style={{ maxWidth: "400px" }}>
        <RadioGroupRoot
          value={value}
          onValueChange={setValue}
          className="grid grid-cols-2 gap-3"
        >
          {templates.map((opt) => (
            <RadioCardItem
              key={opt.value}
              value={opt.value}
              label={opt.label}
            />
          ))}
          <RadioCardItem
            value=""
            label="+ Create Template"
            isAction
            onAction={handleCreateTemplate}
          />
        </RadioGroupRoot>
      </div>
    </div>
  );
}

export const CardGroupWithAction: StoryObj<typeof RadioCardGroup> = {
  render: () => <CardGroupWithActionDemo />,
};

/** Card Group 在表单中 */
export const CardGroupInForm: StoryObj<typeof RadioCardGroup> = {
  render: () => (
    <form
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        maxWidth: "480px",
        padding: "1.5rem",
        backgroundColor: "var(--color-bg-surface)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "0.75rem",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--color-fg-muted)",
          }}
        >
          Project Type
        </label>
        <RadioCardGroup
          options={templateOptions}
          name="projectType"
          defaultValue="novel"
          columns={2}
        />
      </div>
    </form>
  ),
};
