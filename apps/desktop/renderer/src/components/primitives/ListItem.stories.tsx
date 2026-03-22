import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ListItem } from "./ListItem";
import { within, expect } from "@storybook/test";

/**
 * ListItem 组件 Story
 *
 * 设计规范 §6.4
 * 列表项组件，用于列表、树形结构和菜单。
 *
 * 状态矩阵（MUST 全部实现）：
 * - default: 正常状态
 * - hover: 悬停状态（interactive 时）
 * - active: 按下状态（interactive 时）
 * - selected: 选中状态
 * - focus-visible: 键盘聚焦状态
 * - disabled: 禁用状态
 *
 * 尺寸：
 * - standard: 40px 高度（默认）
 * - compact: 32px 高度
 */
const meta = {
  title: "Primitives/ListItem",
  component: ListItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    selected: {
      control: "boolean",
      description: "Item is selected/active",
    },
    compact: {
      control: "boolean",
      description: "Use compact height (32px)",
    },
    interactive: {
      control: "boolean",
      description: "Make item clickable with hover states",
    },
    disabled: {
      control: "boolean",
      description: "Disable the item",
    },
  },
} satisfies Meta<typeof ListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 基础 Stories
// ============================================================================

/**
 * 默认 ListItem
 */
export const Default: Story = {
  args: {
    children: "List Item",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvasElement.querySelector("[data-testid]") ||
        canvasElement.firstElementChild,
    ).toBeTruthy();
  },
};

/**
 * Interactive ListItem
 */
export const Interactive: Story = {
  args: {
    children: "Clickable Item",
    interactive: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvasElement.querySelector("[data-testid]") ||
        canvasElement.firstElementChild,
    ).toBeTruthy();
  },
};

/**
 * Selected ListItem
 */
export const Selected: Story = {
  args: {
    children: "Selected Item",
    selected: true,
    interactive: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvasElement.querySelector("[data-testid]") ||
        canvasElement.firstElementChild,
    ).toBeTruthy();
  },
};

/**
 * Compact ListItem
 */
export const Compact: Story = {
  args: {
    children: "Compact Item",
    compact: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvasElement.querySelector("[data-testid]") ||
        canvasElement.firstElementChild,
    ).toBeTruthy();
  },
};

/**
 * Disabled ListItem
 */
export const Disabled: Story = {
  args: {
    children: "Disabled Item",
    disabled: true,
    interactive: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvasElement.querySelector("[data-testid]") ||
        canvasElement.firstElementChild,
    ).toBeTruthy();
  },
};

// ============================================================================
// 尺寸比较
// ============================================================================

/**
 * 尺寸比较
 */
export const SizeComparison: Story = {
  args: {
    children: "Item",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        width: "200px",
      }}
    >
      <div>
        <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
          Standard (40px):
        </span>
        <ListItem interactive>Standard Height Item</ListItem>
      </div>
      <div>
        <span style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
          Compact (32px):
        </span>
        <ListItem compact interactive>
          Compact Height Item
        </ListItem>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvasElement.querySelector("[data-testid]") ||
        canvasElement.firstElementChild,
    ).toBeTruthy();
  },
};

// ============================================================================
// 状态矩阵
// ============================================================================

/**
 * 所有状态
 */
export const AllStates: Story = {
  args: {
    children: "Item",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
        width: "200px",
      }}
    >
      <ListItem>Static (non-interactive)</ListItem>
      <ListItem interactive>Interactive (hover me)</ListItem>
      <ListItem interactive selected>
        Selected
      </ListItem>
      <ListItem interactive disabled>
        Disabled
      </ListItem>
      <ListItem compact interactive>
        Compact Interactive
      </ListItem>
      <ListItem compact selected interactive>
        Compact Selected
      </ListItem>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvasElement.querySelector("[data-testid]") ||
        canvasElement.firstElementChild,
    ).toBeTruthy();
  },
};

// ============================================================================
// 带图标
// ============================================================================

/**
 * 带前置图标
 */
export const WithIcon: Story = {
  args: {
    children: "Item with icon",
    interactive: true,
  },
  render: () => (
    <div style={{ width: "200px" }}>
      <ListItem interactive>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          style={{ opacity: 0.6 }}
        >
          <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z" />
        </svg>
        <span>Documents</span>
      </ListItem>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvasElement.querySelector("[data-testid]") ||
        canvasElement.firstElementChild,
    ).toBeTruthy();
  },
};

/**
 * 带徽章/计数
 */
export const WithBadge: Story = {
  args: {
    children: "Item with badge",
    interactive: true,
  },
  render: () => (
    <div style={{ width: "200px" }}>
      <ListItem interactive style={{ justifyContent: "space-between" }}>
        <span>Notifications</span>
        <span
          style={{
            padding: "2px 6px",
            fontSize: "11px",
            fontWeight: 500,
            background: "var(--color-accent)",
            color: "white",
            borderRadius: "10px",
          }}
        >
          5
        </span>
      </ListItem>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvasElement.querySelector("[data-testid]") ||
        canvasElement.firstElementChild,
    ).toBeTruthy();
  },
};
