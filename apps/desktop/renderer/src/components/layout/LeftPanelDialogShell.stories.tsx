import type { Meta, StoryObj } from "@storybook/react";

import { LeftPanelDialogShell } from "./LeftPanelDialogShell";
import { within, expect } from "@storybook/test";

const meta: Meta<typeof LeftPanelDialogShell> = {
  title: "Layout/LeftPanelDialogShell",
  component: LeftPanelDialogShell,
  parameters: { layout: "centered" },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    title: "Create Project",
    onOpenChange: () => {},
    children: (
      <div className="space-y-3 p-4 text-sm text-[var(--color-fg-default)]">
        <p>Dialog content rendered inside the left panel shell.</p>
        <div className="h-8 rounded bg-[var(--color-bg-hover)]" />
        <div className="h-8 rounded bg-[var(--color-bg-hover)]" />
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};

export const Closed: Story = {
  args: {
    open: false,
    title: "Create Project",
    onOpenChange: () => {},
    children: <div />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};
