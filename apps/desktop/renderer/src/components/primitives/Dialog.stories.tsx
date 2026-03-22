import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";

/**
 * Dialog 组件 Story
 *
 * 设计规范 §11.5
 * 模态对话框组件，基于 Radix UI Dialog 原语构建。
 * z-index: modal (400)，shadow: xl。
 *
 * 状态矩阵（MUST 全部实现）：
 * - open: 显示对话框
 * - closed: 隐藏对话框
 * - with description: 显示标题下方的描述
 * - with footer: 显示底部操作按钮
 * - closeOnEscape: 按 Escape 关闭
 * - closeOnOverlayClick: 点击遮罩关闭
 */
const meta = {
  title: "Primitives/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `## 使用指南

### 何时使用
- **确认操作**: 删除、丢弃等不可逆动作前的二次确认
- **信息收集**: 需要用户输入但不离开当前页面（表单、设置）
- **警告/通知**: 需要用户明确确认的重要信息

### 注意事项
- 每次最多显示一个 Dialog，避免嵌套
- 始终提供关闭方式（关闭按钮、Escape 键、遮罩点击）
- \`title\` 是必填的，用于无障碍访问（screen reader）
- 危险操作使用 \`variant="danger"\` 的确认按钮`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "boolean",
      description: "Controlled open state",
    },
    title: {
      control: "text",
      description: "Dialog title (required for accessibility)",
    },
    description: {
      control: "text",
      description: "Optional description below title",
    },
    closeOnEscape: {
      control: "boolean",
      description: "Close on Escape key press",
    },
    closeOnOverlayClick: {
      control: "boolean",
      description: "Close on overlay click",
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 基础 Stories
// ============================================================================

/**
 * 基础对话框（需要交互触发）
 *
 * 使用 render 函数来管理 open 状态
 */
export const Default: Story = {
  args: {
    open: false,
    title: "Dialog Title",
    children: "Dialog content goes here.",
    onOpenChange: () => {},
  },
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog open={open} onOpenChange={setOpen} title="Dialog Title">
          <p>Dialog content goes here.</p>
        </Dialog>
      </>
    );
  },
};

/**
 * 带描述的对话框
 */
export const WithDescription: Story = {
  args: {
    open: false,
    title: "Confirm Action",
    description: "This action cannot be undone.",
    children: "Are you sure you want to proceed?",
    onOpenChange: () => {},
  },
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Confirm Action"
          description="This action cannot be undone."
        >
          <p>Are you sure you want to proceed?</p>
        </Dialog>
      </>
    );
  },
};

/**
 * 带 Footer 的对话框
 */
export const WithFooter: Story = {
  args: {
    open: false,
    title: "Delete Item",
    description: "This will permanently delete the item.",
    children: "Are you sure?",
    onOpenChange: () => {},
  },
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Delete Item"
          description="This will permanently delete the item."
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                Delete
              </Button>
            </>
          }
        >
          <p>Are you sure you want to delete this item?</p>
        </Dialog>
      </>
    );
  },
};

/**
 * 禁止 Escape 关闭
 */
export const NoEscapeClose: Story = {
  args: {
    open: false,
    title: "Important Dialog",
    children: "Press Escape - dialog will NOT close.",
    closeOnEscape: false,
    onOpenChange: () => {},
  },
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Important Dialog"
          closeOnEscape={false}
          footer={
            <Button variant="primary" onClick={() => setOpen(false)}>
              Confirm
            </Button>
          }
        >
          <p>Press Escape - dialog will NOT close. You must click Confirm.</p>
        </Dialog>
      </>
    );
  },
};

/**
 * 禁止点击遮罩关闭
 */
export const NoOverlayClose: Story = {
  args: {
    open: false,
    title: "Modal Dialog",
    children: "Click outside - dialog will NOT close.",
    closeOnOverlayClick: false,
    onOpenChange: () => {},
  },
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Modal Dialog"
          closeOnOverlayClick={false}
          footer={
            <Button variant="primary" onClick={() => setOpen(false)}>
              Close
            </Button>
          }
        >
          <p>Click outside - dialog will NOT close. Use the close button.</p>
        </Dialog>
      </>
    );
  },
};

// ============================================================================
// 内容变体 Stories
// ============================================================================

/**
 * 长内容（可滚动）
 */
export const LongContent: Story = {
  args: {
    open: false,
    title: "Long Content Dialog",
    children: "Long content...",
    onOpenChange: () => {},
  },
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Long Content Dialog"
          footer={
            <Button variant="primary" onClick={() => setOpen(false)}>
              Close
            </Button>
          }
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {Array.from({ length: 20 }, (_, i) => (
              <p key={i}>
                This is paragraph {i + 1}. Lorem ipsum dolor sit amet,
                consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
                labore et dolore magna aliqua.
              </p>
            ))}
          </div>
        </Dialog>
      </>
    );
  },
};

/**
 * 表单对话框
 */
export const FormDialog: Story = {
  args: {
    open: false,
    title: "Create Project",
    children: "Form content...",
    onOpenChange: () => {},
  },
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Create Project</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Create Project"
          description="Enter details for your new project."
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Create
              </Button>
            </>
          }
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <label
                htmlFor="project-name"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "13px",
                  color: "var(--color-fg-default)",
                }}
              >
                Project Name
              </label>
              <input
                id="project-name"
                type="text"
                placeholder="My Project"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "13px",
                  background: "var(--color-bg-default)",
                  color: "var(--color-fg-default)",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="project-desc"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "13px",
                  color: "var(--color-fg-default)",
                }}
              >
                Description
              </label>
              <textarea
                id="project-desc"
                placeholder="Enter description..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "13px",
                  background: "var(--color-bg-default)",
                  color: "var(--color-fg-default)",
                  resize: "vertical",
                }}
              />
            </div>
          </div>
        </Dialog>
      </>
    );
  },
};

// ============================================================================
// 完整展示
// ============================================================================

/**
 * 完整功能展示（用于 AI 自检）
 */
export const FullFeatures: Story = {
  args: {
    open: false,
    title: "Full Features",
    children: "Demo",
    onOpenChange: () => {},
  },
  parameters: {
    layout: "padded",
  },
  render: function Render() {
    const [dialogType, setDialogType] = useState<string | null>(null);
    return (
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Button onClick={() => setDialogType("basic")}>Basic</Button>
        <Button onClick={() => setDialogType("confirm")}>Confirm</Button>
        <Button onClick={() => setDialogType("form")}>Form</Button>
        <Button variant="danger" onClick={() => setDialogType("delete")}>
          Delete
        </Button>

        {/* Basic */}
        <Dialog
          open={dialogType === "basic"}
          onOpenChange={(open) => !open && setDialogType(null)}
          title="Basic Dialog"
        >
          <p>This is a basic dialog with just content.</p>
        </Dialog>

        {/* Confirm */}
        <Dialog
          open={dialogType === "confirm"}
          onOpenChange={(open) => !open && setDialogType(null)}
          title="Confirm Action"
          description="Please confirm your action."
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialogType(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setDialogType(null)}>
                Confirm
              </Button>
            </>
          }
        >
          <p>Are you sure you want to continue?</p>
        </Dialog>

        {/* Form */}
        <Dialog
          open={dialogType === "form"}
          onOpenChange={(open) => !open && setDialogType(null)}
          title="Edit Settings"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialogType(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setDialogType(null)}>
                Save
              </Button>
            </>
          }
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <input
              type="text"
              placeholder="Enter value..."
              style={{
                padding: "8px 12px",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
              }}
            />
          </div>
        </Dialog>

        {/* Delete */}
        <Dialog
          open={dialogType === "delete"}
          onOpenChange={(open) => !open && setDialogType(null)}
          title="Delete Item"
          description="This action cannot be undone."
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialogType(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => setDialogType(null)}>
                Delete
              </Button>
            </>
          }
        >
          <p>Are you sure you want to delete this item permanently?</p>
        </Dialog>
      </div>
    );
  },
};
