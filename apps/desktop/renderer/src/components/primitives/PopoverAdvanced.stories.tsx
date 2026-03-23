import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Popover } from "./Popover";
import { Button } from "./Button";
import { within, expect } from "@storybook/test";

/**
 * Popover 组件 Story
 *
 * 设计规范 §5.2
 * 浮动弹出层组件，基于 Radix UI Popover 原语构建。
 * z-index: popover (300)，shadow: md。
 *
 * 状态矩阵（MUST 全部实现）：
 * - open/closed: 弹出层显示/隐藏
 * - side: top/right/bottom/left 四个方向
 * - align: start/center/end 三种对齐
 * - controlled: 受控模式
 * - uncontrolled: 非受控模式（defaultOpen）
 */
const meta = {
  title: "Primitives/Popover/Advanced",
  component: Popover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description: "Preferred side of the trigger",
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "Alignment relative to trigger",
    },
    sideOffset: {
      control: "number",
      description: "Offset from trigger in pixels",
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 表单内容
 */
export const FormContent: Story = {
  args: {
    trigger: <Button>Add Tag</Button>,
    children: <div>Form</div>,
  },
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger={<Button>Add Tag</Button>}
      >
        <div style={{ width: "200px" }}>
          <div
            style={{ marginBottom: "8px", fontSize: "13px", fontWeight: "500" }}
          >
            New Tag
          </div>
          <input
            type="text"
            placeholder="Enter tag name..."
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-sm)",
              fontSize: "13px",
              marginBottom: "12px",
            }}
          />
          <div
            style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
          >
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={() => setOpen(false)}>
              Add
            </Button>
          </div>
        </div>
      </Popover>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

// ============================================================================
// 边界情况 Stories
// ============================================================================

/**
 * 自定义偏移
 */
export const CustomOffset: Story = {
  args: {
    trigger: <Button>Large Offset</Button>,
    children: <div>20px offset from trigger</div>,
    sideOffset: 20,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 最小内容
 */
export const MinimalContent: Story = {
  args: {
    trigger: <Button>Minimal</Button>,
    children: <span>Hi</span>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 宽内容
 */
export const WideContent: Story = {
  args: {
    trigger: <Button>Wide</Button>,
    children: (
      <div style={{ width: "300px" }}>
        This is a wider popover that contains more content and might need more
        space to display properly.
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
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
    trigger: <Button>Trigger</Button>,
    children: <div>Content</div>,
  },
  parameters: {
    layout: "fullscreen",
  },
  render: () => (
    <div
      style={{
        padding: "4rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      {/* Sides */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Side Variants
        </h3>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Popover trigger={<Button>Top</Button>} side="top">
            <div>Top popover</div>
          </Popover>
          <Popover trigger={<Button>Right</Button>} side="right">
            <div>Right popover</div>
          </Popover>
          <Popover trigger={<Button>Bottom</Button>} side="bottom">
            <div>Bottom popover</div>
          </Popover>
          <Popover trigger={<Button>Left</Button>} side="left">
            <div>Left popover</div>
          </Popover>
        </div>
      </section>

      {/* Aligns */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Align Variants
        </h3>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Popover trigger={<Button>Start</Button>} align="start">
            <div style={{ width: "150px" }}>Aligned start</div>
          </Popover>
          <Popover trigger={<Button>Center</Button>} align="center">
            <div style={{ width: "150px" }}>Aligned center</div>
          </Popover>
          <Popover trigger={<Button>End</Button>} align="end">
            <div style={{ width: "150px" }}>Aligned end</div>
          </Popover>
        </div>
      </section>

      {/* Content Types */}
      <section>
        <h3
          style={{
            margin: "0 0 1rem",
            fontSize: "14px",
            color: "var(--color-fg-default)",
          }}
        >
          Content Types
        </h3>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Popover trigger={<Button variant="ghost">Menu</Button>}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <div>Option 1</div>
              <div>Option 2</div>
              <div>Option 3</div>
            </div>
          </Popover>
          <Popover trigger={<Button variant="secondary">Info</Button>}>
            <div>
              <strong>Information</strong>
              <p style={{ margin: "8px 0 0", fontSize: "12px" }}>
                This is some helpful information.
              </p>
            </div>
          </Popover>
        </div>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};
