import type { Meta, StoryObj } from "@storybook/react";
import { ContextMenu } from "./ContextMenu";
import { within, expect } from "@storybook/test";

const meta = {
  title: "Primitives/ContextMenu",
  component: ContextMenu,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultItems = [
  { key: "rename", label: "Rename", onSelect: () => {} },
  { key: "duplicate", label: "Duplicate", onSelect: () => {} },
  { key: "delete", label: "Delete", onSelect: () => {}, destructive: true },
];

export const Default: Story = {
  args: {
    items: defaultItems,
    children: (
      <div
        style={{
          padding: "2rem 3rem",
          border: "1px dashed var(--color-border-default)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-fg-default)",
          userSelect: "none",
        }}
      >
        Right-click here
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

export const WithDisabled: Story = {
  args: {
    items: [
      { key: "edit", label: "Edit", onSelect: () => {} },
      { key: "archive", label: "Archive", onSelect: () => {}, disabled: true },
      { key: "delete", label: "Delete", onSelect: () => {}, destructive: true },
    ],
    children: (
      <div
        style={{
          padding: "2rem 3rem",
          border: "1px dashed var(--color-border-default)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-fg-default)",
          userSelect: "none",
        }}
      >
        Right-click here
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};
