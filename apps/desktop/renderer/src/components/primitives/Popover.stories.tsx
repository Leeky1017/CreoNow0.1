import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Popover, PopoverClose } from "./Popover";
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
  title: "Primitives/Popover",
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

// ============================================================================
// 基础 Stories
// ============================================================================

/**
 * 默认 Popover（bottom-center）
 */
export const Default: Story = {
  args: {
    trigger: <Button>Open Popover</Button>,
    children: <div>Popover content</div>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 受控模式
 */
export const Controlled: Story = {
  args: {
    trigger: <Button>Controlled</Button>,
    children: <div>Controlled popover</div>,
  },
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Popover
          open={open}
          onOpenChange={setOpen}
          trigger={<Button>Controlled</Button>}
        >
          <div>
            <p style={{ marginBottom: "0.5rem" }}>Controlled popover content</p>
            <Button size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </Popover>
        <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
          Open: {open ? "true" : "false"}
        </span>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 默认打开（非受控）
 */
export const DefaultOpen: Story = {
  args: {
    trigger: <Button>Already Open</Button>,
    children: <div>This popover is open by default</div>,
    defaultOpen: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

// ============================================================================
// Side 变体 Stories
// ============================================================================

/**
 * 顶部弹出
 */
export const SideTop: Story = {
  args: {
    trigger: <Button>Top</Button>,
    children: <div>Popover on top</div>,
    side: "top",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 右侧弹出
 */
export const SideRight: Story = {
  args: {
    trigger: <Button>Right</Button>,
    children: <div>Popover on right</div>,
    side: "right",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 底部弹出（默认）
 */
export const SideBottom: Story = {
  args: {
    trigger: <Button>Bottom</Button>,
    children: <div>Popover on bottom</div>,
    side: "bottom",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 左侧弹出
 */
export const SideLeft: Story = {
  args: {
    trigger: <Button>Left</Button>,
    children: <div>Popover on left</div>,
    side: "left",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 所有方向展示
 */
export const AllSides: Story = {
  args: {
    trigger: <Button>Trigger</Button>,
    children: <div>Content</div>,
  },
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
        padding: "4rem",
      }}
    >
      <Popover trigger={<Button>Top</Button>} side="top">
        <div>Top popover</div>
      </Popover>
      <div style={{ display: "flex", gap: "4rem" }}>
        <Popover trigger={<Button>Left</Button>} side="left">
          <div>Left popover</div>
        </Popover>
        <Popover trigger={<Button>Right</Button>} side="right">
          <div>Right popover</div>
        </Popover>
      </div>
      <Popover trigger={<Button>Bottom</Button>} side="bottom">
        <div>Bottom popover</div>
      </Popover>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

// ============================================================================
// Align 变体 Stories
// ============================================================================

/**
 * 对齐变体展示
 */
export const AllAligns: Story = {
  args: {
    trigger: <Button>Trigger</Button>,
    children: <div>Content</div>,
  },
  render: () => (
    <div style={{ display: "flex", gap: "2rem", padding: "2rem" }}>
      <Popover trigger={<Button>Start</Button>} align="start">
        <div style={{ width: "150px" }}>Aligned to start</div>
      </Popover>
      <Popover trigger={<Button>Center</Button>} align="center">
        <div style={{ width: "150px" }}>Aligned to center</div>
      </Popover>
      <Popover trigger={<Button>End</Button>} align="end">
        <div style={{ width: "150px" }}>Aligned to end</div>
      </Popover>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

// ============================================================================
// 内容变体 Stories
// ============================================================================

/**
 * 菜单样式内容
 */
export const MenuContent: Story = {
  args: {
    trigger: <Button variant="ghost">Options</Button>,
    children: <div>Menu items</div>,
  },
  render: () => (
    <Popover trigger={<Button variant="ghost">Options</Button>}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          margin: "-8px",
        }}
      >
        {["Edit", "Duplicate", "Archive", "Delete"].map((item) => (
          <PopoverClose key={item} asChild>
            <button
              style={{
                display: "block",
                width: "100%",
                padding: "8px 12px",
                textAlign: "left",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "13px",
                color:
                  item === "Delete"
                    ? "var(--color-error)"
                    : "var(--color-fg-default)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "var(--color-bg-hover)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {item}
            </button>
          </PopoverClose>
        ))}
      </div>
    </Popover>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

/**
 * 信息卡片内容
 */
export const InfoCard: Story = {
  args: {
    trigger: <Button variant="ghost">Info</Button>,
    children: <div>Info content</div>,
  },
  render: () => (
    <Popover trigger={<Button variant="ghost">User Info</Button>} side="right">
      <div style={{ width: "200px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "var(--color-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "600",
            }}
          >
            JD
          </div>
          <div>
            <div style={{ fontWeight: "500", fontSize: "14px" }}>John Doe</div>
            <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
              john@example.com
            </div>
          </div>
        </div>
        <div
          style={{
            borderTop: "1px solid var(--color-separator)",
            paddingTop: "12px",
            fontSize: "12px",
            color: "var(--color-fg-muted)",
          }}
        >
          Last active 2 hours ago
        </div>
      </div>
    </Popover>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};
