import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { ToastVariant } from "./Toast";
import { Toast, ToastProvider, ToastViewport, useToast } from "./Toast";
import { Button } from "./Button";
import { expect } from "@storybook/test";

/**
 * Toast 组件 Story
 *
 * 用于显示临时通知消息。
 * 基于 Radix UI Toast。
 */
const meta: Meta<typeof Toast> = {
  title: "Primitives/Toast",
  component: Toast,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ToastProvider>
        <div style={{ padding: "2rem", minHeight: "300px" }}>
          <Story />
          <ToastViewport />
        </div>
      </ToastProvider>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "error", "warning"],
      description: "Visual variant",
    },
    duration: {
      control: "number",
      description: "Duration in ms before auto-close",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 基础 Stories
// ============================================================================

/** 默认状态 */
export const Default: Story = {
  args: {
    title: "Notification",
    description: "This is a toast notification.",
    open: true,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 成功状态 */
export const Success: Story = {
  args: {
    title: "Success!",
    description: "Your changes have been saved successfully.",
    variant: "success",
    open: true,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 错误状态 */
export const Error: Story = {
  args: {
    title: "Error",
    description: "Something went wrong. Please try again.",
    variant: "error",
    open: true,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 警告状态 */
export const Warning: Story = {
  args: {
    title: "Warning",
    description: "This action cannot be undone.",
    variant: "warning",
    open: true,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 只有标题 */
export const TitleOnly: Story = {
  args: {
    title: "File uploaded",
    open: true,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 带操作按钮 */
export const WithAction: Story = {
  args: {
    title: "File deleted",
    description: "The file has been moved to trash.",
    action: {
      label: "Undo",
      onClick: () => console.log("Undo clicked"),
    },
    open: true,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 交互式 Stories
// ============================================================================

const variants: ToastVariant[] = ["default", "success", "error", "warning"];

function AllVariantsDemo() {
  const [openStates, setOpenStates] = React.useState<
    Record<ToastVariant, boolean>
  >({
    default: true,
    success: true,
    error: true,
    warning: true,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {variants.map((variant) => (
          <Button
            key={variant}
            size="sm"
            onClick={() =>
              setOpenStates((prev) => ({ ...prev, [variant]: true }))
            }
          >
            Show {variant}
          </Button>
        ))}
      </div>
      {variants.map((variant) => (
        <Toast
          key={variant}
          title={`${variant.charAt(0).toUpperCase() + variant.slice(1)} Toast`}
          description={`This is a ${variant} toast message.`}
          variant={variant}
          open={openStates[variant]}
          onOpenChange={(open) =>
            setOpenStates((prev) => ({ ...prev, [variant]: open }))
          }
        />
      ))}
    </div>
  );
}

/** 所有 Variants 展示 */
export const AllVariants: Story = {
  args: {
    title: "Toast",
    open: true,
  },
  render: () => <AllVariantsDemo />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 使用 Hook 触发 */
function ToastDemo() {
  const { toast, showToast, setOpen } = useToast();

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Button
        variant="primary"
        onClick={() =>
          showToast({
            title: "Success!",
            description: "Action completed successfully.",
            variant: "success",
          })
        }
      >
        Show Success
      </Button>
      <Button
        variant="danger"
        onClick={() =>
          showToast({
            title: "Error",
            description: "Something went wrong.",
            variant: "error",
          })
        }
      >
        Show Error
      </Button>
      <Toast {...toast} onOpenChange={setOpen} />
    </div>
  );
}

export const WithHook: Story = {
  args: {
    title: "Toast",
    open: false,
  },
  render: () => <ToastDemo />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 不自动关闭 */
export const Persistent: Story = {
  args: {
    title: "Persistent Toast",
    description: "This toast won't auto-close. Click the X to dismiss.",
    duration: 0,
    open: true,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 快速自动关闭 */
export const QuickDismiss: Story = {
  args: {
    title: "Quick Toast",
    description: "This will disappear in 2 seconds.",
    duration: 2000,
    open: true,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
