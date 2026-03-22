import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, userEvent } from "@storybook/test";
import { Button } from "./Button";

/**
 * Button 组件 Story
 *
 * 设计规范 §6.1
 * 支持多种 variant（primary, secondary, ghost, danger）和 size（sm, md, lg）。
 *
 * 状态矩阵（MUST 全部实现）：
 * - default: 正常颜色，可点击
 * - hover: 视觉反馈（需要交互触发）
 * - active: 按下反馈（需要交互触发）
 * - focus-visible: 显示 focus ring（Tab 键聚焦）
 * - disabled: opacity: 0.5，不可点击
 * - loading: 显示 Spinner，不可点击
 */
const meta = {
  title: "Primitives/Button/Basic",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `## 使用指南

### 何时使用
- **primary**: 页面主操作，每页最多 1 个
- **secondary**: 次要操作，对话框取消、工具栏按钮
- **ghost**: 内联操作、工具栏、无边框场景
- **danger**: 删除、不可逆操作，需醒目警示

### 尺寸选择
- **sm**: 工具栏、紧凑列表
- **md**: 默认尺寸，适用于大多数场景
- **lg**: 登录、注册等全宽 CTA

### 不应使用
- 导航链接 → 使用 \`<a>\` 或 Router Link
- 纯图标按钮 → 配合 \`size="icon"\` 使用`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger", "pill"],
      description: "Visual style variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "icon"],
      description: "Size of the button",
    },
    loading: {
      control: "boolean",
      description: "Show loading spinner and disable interactions",
    },
    fullWidth: {
      control: "boolean",
      description: "Full width button",
    },
    disabled: {
      control: "boolean",
      description: "Disable the button",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 基础 Stories
// ============================================================================

/** 默认状态：secondary variant, md size */
export const Default: Story = {
  args: {
    children: "Button",
    variant: "secondary",
    size: "md",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Button" });
    await expect(button).toBeInTheDocument();
    await userEvent.click(button);
    await expect(button).toHaveFocus();
  },
};

/** Primary variant：主要 CTA 按钮 */
export const Primary: Story = {
  args: {
    children: "Primary Button",
    variant: "primary",
    size: "md",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Primary Button" });
    await expect(button).toBeEnabled();
    await userEvent.click(button);
  },
};

/** Secondary variant：次要操作按钮 */
export const Secondary: Story = {
  args: {
    children: "Secondary Button",
    variant: "secondary",
    size: "md",
  },
};

/** Ghost variant：轻量级操作按钮 */
export const Ghost: Story = {
  args: {
    children: "Ghost Button",
    variant: "ghost",
    size: "md",
  },
};

/** Danger variant：危险/删除操作按钮 */
export const Danger: Story = {
  args: {
    children: "Danger Button",
    variant: "danger",
    size: "md",
  },
};

// ============================================================================
// Size Stories
// ============================================================================

/** Small size：小尺寸按钮（28px 高） */
export const Small: Story = {
  args: {
    children: "Small Button",
    variant: "secondary",
    size: "sm",
  },
};

/** Medium size：中等尺寸按钮（36px 高） */
export const Medium: Story = {
  args: {
    children: "Medium Button",
    variant: "secondary",
    size: "md",
  },
};

/** Large size：大尺寸按钮（44px 高） */
export const Large: Story = {
  args: {
    children: "Large Button",
    variant: "secondary",
    size: "lg",
  },
};

// ============================================================================
// State Stories
// ============================================================================

/** Loading state：加载状态 */
export const Loading: Story = {
  args: {
    children: "Loading...",
    variant: "primary",
    size: "md",
    loading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");
    await expect(button).toBeDisabled();
  },
};

/** Disabled state：禁用状态 */
export const Disabled: Story = {
  args: {
    children: "Disabled Button",
    variant: "secondary",
    size: "md",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Disabled Button" });
    await expect(button).toBeDisabled();
  },
};

/** Full width：全宽按钮 */
export const FullWidth: Story = {
  args: {
    children: "Full Width Button",
    variant: "primary",
    size: "md",
    fullWidth: true,
  },
  parameters: {
    layout: "padded",
  },
};

/** Pill variant — 胶囊按钮 */
export const Pill: Story = {
  args: {
    variant: "pill",
    children: "Pill Button",
  },
};

/** Pill variant 各状态 */
export const PillStates: Story = {
  args: { children: "Pill" },
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <Button variant="pill">Default</Button>
      <Button variant="pill" disabled>
        Disabled
      </Button>
      <Button variant="pill" loading>
        Loading
      </Button>
    </div>
  ),
};

/** Icon-only 按钮 */
export const IconOnly: Story = {
  args: {
    size: "icon",
    variant: "ghost",
    children: "✕",
  },
};

/** Icon-only 各 variant */
export const IconOnlyVariants: Story = {
  args: { children: "✕" },
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <Button size="icon" variant="primary">
        ✕
      </Button>
      <Button size="icon" variant="secondary">
        ✕
      </Button>
      <Button size="icon" variant="ghost">
        ✕
      </Button>
      <Button size="icon" variant="pill">
        ✕
      </Button>
    </div>
  ),
};
