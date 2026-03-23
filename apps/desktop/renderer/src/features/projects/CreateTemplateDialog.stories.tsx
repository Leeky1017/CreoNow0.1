import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CreateTemplateDialog } from "./CreateTemplateDialog";
import { Button } from "../../components/primitives/Button";
import { within, expect } from "@storybook/test";

/**
 * CreateTemplateDialog 组件 Story
 *
 * 用于创建自定义项目模板的对话框。
 * 支持定义模板名称、描述、初始文件夹和文件。
 */
const meta: Meta<typeof CreateTemplateDialog> = {
  title: "Features/CreateTemplateDialog",
  component: CreateTemplateDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CreateTemplateDialog>;

// ============================================================================
// 基础 Stories
// ============================================================================

/** 默认打开状态 */
export const Open: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

/** 关闭状态 */
export const Closed: Story = {
  args: {
    open: false,
    onOpenChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

// ============================================================================
// 交互演示
// ============================================================================

function InteractiveDemo() {
  const [open, setOpen] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        alignItems: "center",
      }}
    >
      <Button onClick={() => setOpen(true)}>Create Template</Button>

      {createdId && (
        <div
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "var(--color-success-subtle)",
            color: "var(--color-success)",
            borderRadius: "var(--radius-sm)",
            fontSize: "12px",
          }}
        >
          Template created: {createdId}
        </div>
      )}

      <CreateTemplateDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={(id) => setCreatedId(id)}
      />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

// ============================================================================
// 完整流程演示
// ============================================================================

function FullFlowDemo() {
  const [open, setOpen] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    id?: string;
  } | null>(null);

  return (
    <div style={{ padding: "2rem" }}>
      <div
        style={{
          marginBottom: "1rem",
          fontSize: "12px",
          color: "var(--color-fg-muted)",
        }}
      >
        Fill in the form and click &quot;Create Template&quot; to test the flow.
      </div>

      {result && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: result.success
              ? "var(--color-success-subtle)"
              : "var(--color-error-subtle)",
            color: result.success
              ? "var(--color-success)"
              : "var(--color-error)",
            borderRadius: "var(--radius-sm)",
            fontSize: "12px",
          }}
        >
          {result.success
            ? `Template created successfully: ${result.id}`
            : "Failed to create template"}
        </div>
      )}

      {!open && (
        <Button onClick={() => setOpen(true)}>Open Dialog Again</Button>
      )}

      <CreateTemplateDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={(id) => {
          setResult({ success: true, id });
        }}
      />
    </div>
  );
}

export const FullFlow: Story = {
  render: () => <FullFlowDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};
