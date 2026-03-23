import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Accordion } from "./Accordion";
import { expect } from "@storybook/test";

/**
 * Accordion 组件 Story
 *
 * 用于显示可折叠的内容区域。
 * 基于 Radix UI Accordion。
 */
const meta = {
  title: "Primitives/Accordion",
  component: Accordion,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["single", "multiple"],
      description: "Single or multiple items can be open",
    },
    collapsible: {
      control: "boolean",
      description: "Whether items can be collapsed (single type only)",
    },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample items
const sampleItems = [
  {
    value: "item-1",
    title: "What is CreoNow?",
    content:
      "CreoNow is an AI-powered creative writing IDE designed for authors and content creators.",
  },
  {
    value: "item-2",
    title: "How does AI assistance work?",
    content:
      "The AI analyzes your writing context and provides suggestions, helps with brainstorming, and can generate draft content based on your specifications.",
  },
  {
    value: "item-3",
    title: "Is my data secure?",
    content:
      "Yes, all your writing is stored locally on your device. We do not store any of your content on our servers unless you explicitly choose to sync.",
  },
];

// ============================================================================
// 基础 Stories
// ============================================================================

/** 默认状态 (single) */
export const Default: Story = {
  args: {
    items: sampleItems,
    type: "single",
    collapsible: true,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 多选模式 */
export const Multiple: Story = {
  args: {
    items: sampleItems,
    type: "multiple",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 默认展开 */
export const DefaultExpanded: Story = {
  args: {
    items: sampleItems,
    type: "single",
    defaultValue: "item-1",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 不可折叠 */
export const NotCollapsible: Story = {
  args: {
    items: sampleItems,
    type: "single",
    collapsible: false,
    defaultValue: "item-1",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 禁用项 */
export const WithDisabled: Story = {
  args: {
    items: [
      ...sampleItems,
      {
        value: "item-4",
        title: "Disabled Section",
        content: "This content is not accessible.",
        disabled: true,
      },
    ],
    type: "single",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 内容丰富的示例
// ============================================================================

/** 富文本内容 */
export const RichContent: Story = {
  args: {
    items: [
      {
        value: "features",
        title: "Features",
        content: (
          <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
            <li>AI-powered writing assistance</li>
            <li>Character and world management</li>
            <li>Version history and branching</li>
            <li>Export to multiple formats</li>
          </ul>
        ),
      },
      {
        value: "pricing",
        title: "Pricing",
        content: (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <div>
              <strong>Free:</strong> Basic features, up to 3 projects
            </div>
            <div>
              <strong>Pro:</strong> $9.99/month, unlimited projects + AI
            </div>
            <div>
              <strong>Team:</strong> $29.99/month, collaboration features
            </div>
          </div>
        ),
      },
      {
        value: "support",
        title: "Support",
        content: (
          <p style={{ margin: 0 }}>
            For support, please email{" "}
            <span style={{ color: "var(--color-accent)" }}>
              support@creonow.app
            </span>{" "}
            or visit our Discord community.
          </p>
        ),
      },
    ],
    type: "single",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 多选默认展开多项 */
export const MultipleDefaultExpanded: Story = {
  args: {
    items: sampleItems,
    type: "multiple",
    defaultValue: ["item-1", "item-2"],
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 受控模式
// ============================================================================

function ControlledDemo() {
  const [value, setValue] = React.useState<string | undefined>("item-1");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ fontSize: "12px", color: "var(--color-fg-muted)" }}>
        Current: {value || "none"}
      </div>
      <Accordion
        items={sampleItems}
        type="single"
        value={value}
        onValueChange={(v) => setValue(v as string)}
        collapsible
      />
    </div>
  );
}

export const Controlled: Story = {
  args: {
    items: sampleItems,
  },
  render: () => <ControlledDemo />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ============================================================================
// 边界情况
// ============================================================================

/** 长标题和内容 */
export const LongContent: Story = {
  args: {
    items: [
      {
        value: "long",
        title:
          "This is a very long title that might need to wrap to multiple lines in narrow containers",
        content:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      },
    ],
    type: "single",
    defaultValue: "long",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 单项 */
export const SingleItem: Story = {
  args: {
    items: [
      {
        value: "only",
        title: "Only Section",
        content: "This accordion has only one item.",
      },
    ],
    type: "single",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/** 多项 */
export const ManyItems: Story = {
  args: {
    items: Array.from({ length: 10 }, (_, i) => ({
      value: `item-${i + 1}`,
      title: `Section ${i + 1}`,
      content: `Content for section ${i + 1}. This is some placeholder text.`,
    })),
    type: "single",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
