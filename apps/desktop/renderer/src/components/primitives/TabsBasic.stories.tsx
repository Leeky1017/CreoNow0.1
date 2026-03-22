import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, userEvent } from "@storybook/test";
import { useState } from "react";
import type { TabItem } from "./Tabs";
import { Tabs } from "./Tabs";

/**
 * Tabs 组件 Story
 *
 * 设计规范 §6.6
 * 标签页组件，基于 Radix UI Tabs 原语构建。
 * 支持水平/垂直方向、受控/非受控模式、禁用状态。
 *
 * 状态矩阵（MUST 全部实现）：
 * - default: 未选中状态
 * - active: 选中状态（高亮显示）
 * - hover: 悬停状态
 * - focus-visible: 键盘聚焦状态
 * - disabled: 禁用状态
 */
const meta = {
  title: "Primitives/Tabs/Basic",
  component: Tabs,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `## 使用指南

### 用法
- 使用 \`items\` 数组定义标签页，每项需有 \`value\`、\`label\`
- 受控模式：通过 \`value\` + \`onValueChange\` 控制
- 非受控模式：通过 \`defaultValue\` 初始化

### 方向
- **horizontal**: 默认，水平排列
- **vertical**: 侧边标签页

### 禁用
- 单个标签页可通过 item.disabled 禁用`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "underline"],
      description:
        "Visual variant — default (background highlight) or underline (accent indicator)",
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "Orientation of tabs",
    },
    fullWidth: {
      control: "boolean",
      description: "Full width tabs",
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 示例数据
// ============================================================================

const basicTabs: TabItem[] = [
  { value: "tab1", label: "Tab 1", content: <div>Content for Tab 1</div> },
  { value: "tab2", label: "Tab 2", content: <div>Content for Tab 2</div> },
  { value: "tab3", label: "Tab 3", content: <div>Content for Tab 3</div> },
];

const settingsTabs: TabItem[] = [
  {
    value: "general",
    label: "General",
    content: (
      <div>
        <h3 style={{ margin: "0 0 1rem", fontSize: "16px" }}>
          General Settings
        </h3>
        <p>Configure general application settings here.</p>
      </div>
    ),
  },
  {
    value: "appearance",
    label: "Appearance",
    content: (
      <div>
        <h3 style={{ margin: "0 0 1rem", fontSize: "16px" }}>Appearance</h3>
        <p>Customize the look and feel of the application.</p>
      </div>
    ),
  },
  {
    value: "notifications",
    label: "Notifications",
    content: (
      <div>
        <h3 style={{ margin: "0 0 1rem", fontSize: "16px" }}>Notifications</h3>
        <p>Manage notification preferences.</p>
      </div>
    ),
  },
  {
    value: "advanced",
    label: "Advanced",
    content: (
      <div>
        <h3 style={{ margin: "0 0 1rem", fontSize: "16px" }}>Advanced</h3>
        <p>Advanced configuration options for power users.</p>
      </div>
    ),
  },
];

const tabsWithDisabled: TabItem[] = [
  { value: "active", label: "Active", content: <div>Active tab content</div> },
  {
    value: "available",
    label: "Available",
    content: <div>Available tab content</div>,
  },
  {
    value: "disabled",
    label: "Disabled",
    disabled: true,
    content: <div>This content should not be visible</div>,
  },
  {
    value: "another",
    label: "Another",
    content: <div>Another tab content</div>,
  },
];

// ============================================================================
// 基础 Stories
// ============================================================================

/**
 * 默认 Tabs
 */
export const Default: Story = {
  args: {
    tabs: basicTabs,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tab2 = canvas.getByRole("tab", { name: "Tab 2" });
    await userEvent.click(tab2);
    await expect(tab2).toHaveAttribute("aria-selected", "true");
  },
};

/**
 * 设置页 Tabs 示例
 */
export const SettingsTabs: Story = {
  args: {
    tabs: settingsTabs,
    defaultValue: "general",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const appearanceTab = canvas.getByRole("tab", { name: "Appearance" });
    await userEvent.click(appearanceTab);
    await expect(appearanceTab).toHaveAttribute("aria-selected", "true");
  },
};

/**
 * 受控模式
 */
export const Controlled: Story = {
  args: {
    tabs: basicTabs,
  },
  render: function Render() {
    const [value, setValue] = useState("tab1");
    return (
      <div>
        <div
          style={{
            marginBottom: "1rem",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          Current tab: {value}
        </div>
        <Tabs tabs={basicTabs} value={value} onValueChange={setValue} />
      </div>
    );
  },
};

/**
 * 指定默认选中项
 */
export const DefaultValue: Story = {
  args: {
    tabs: basicTabs,
    defaultValue: "tab2",
  },
};

// ============================================================================
// 方向 Stories
// ============================================================================

/**
 * 水平方向（默认）
 */
export const Horizontal: Story = {
  args: {
    tabs: basicTabs,
    orientation: "horizontal",
  },
};

/**
 * 垂直方向
 */
export const Vertical: Story = {
  args: {
    tabs: settingsTabs,
    orientation: "vertical",
  },
  parameters: {
    layout: "padded",
  },
};

// ============================================================================
// 状态 Stories
// ============================================================================

/**
 * 带禁用项
 */
export const WithDisabled: Story = {
  args: {
    tabs: tabsWithDisabled,
    defaultValue: "active",
  },
};

/**
 * 全宽模式
 */
export const FullWidth: Story = {
  args: {
    tabs: basicTabs,
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
