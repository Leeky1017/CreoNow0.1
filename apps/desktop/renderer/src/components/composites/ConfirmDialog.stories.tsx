import type { Meta, StoryObj } from "@storybook/react";

import { ConfirmDialog } from "./ConfirmDialog";
import { within, expect } from "@storybook/test";

const meta: Meta<typeof ConfirmDialog> = {
  title: "Composites/ConfirmDialog",
  component: ConfirmDialog,
  parameters: { layout: "centered" },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    title: "Delete Project",
    description:
      "This action cannot be undone. All files in this project will be permanently deleted.",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    onConfirm: () => {},
    onCancel: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

export const Destructive: Story = {
  args: {
    open: true,
    title: "Remove Character",
    description:
      "Are you sure you want to remove this character? All related notes will also be deleted.",
    confirmLabel: "Remove",
    cancelLabel: "Keep",
    destructive: true,
    onConfirm: () => {},
    onCancel: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};
