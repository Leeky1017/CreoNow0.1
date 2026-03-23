import type { Meta, StoryObj } from "@storybook/react";
import { DropdownMenu } from "./DropdownMenu";
import { within, expect } from "@storybook/test";

const meta = {
  title: "Primitives/DropdownMenu",
  component: DropdownMenu,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultItems = [
  { key: "profile", label: "Profile", onSelect: () => {} },
  { key: "settings", label: "Settings", onSelect: () => {} },
  { key: "logout", label: "Logout", onSelect: () => {}, destructive: true },
];

export const Default: Story = {
  args: {
    trigger: (
      <button
        type="button"
        style={{
          padding: "0.5rem 1rem",
          background: "var(--color-bg-raised)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-fg-default)",
          cursor: "pointer",
        }}
      >
        Open Menu
      </button>
    ),
    items: defaultItems,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

export const WithDisabled: Story = {
  args: {
    trigger: (
      <button
        type="button"
        style={{
          padding: "0.5rem 1rem",
          background: "var(--color-bg-raised)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-fg-default)",
          cursor: "pointer",
        }}
      >
        Open Menu
      </button>
    ),
    items: [
      { key: "edit", label: "Edit", onSelect: () => {} },
      { key: "archive", label: "Archive", onSelect: () => {}, disabled: true },
      { key: "delete", label: "Delete", onSelect: () => {}, destructive: true },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};
