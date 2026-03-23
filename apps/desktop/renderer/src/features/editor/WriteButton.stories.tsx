import type { Meta, StoryObj } from "@storybook/react";

import { WriteButton } from "./WriteButton";
import { within, expect } from "@storybook/test";

const meta: Meta<typeof WriteButton> = {
  title: "Features/Editor/WriteButton",
  component: WriteButton,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="relative h-[240px] w-[480px] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-4">
        <div className="text-sm text-[var(--color-fg-muted)]">
          Hover editor region to show floating actions.
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WriteButton>;

export const Visible: Story = {
  args: {
    visible: true,
    disabled: false,
    running: false,
    onClick: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  args: {
    visible: true,
    disabled: true,
    running: false,
    onClick: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};

export const Running: Story = {
  args: {
    visible: true,
    disabled: true,
    running: true,
    onClick: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeInTheDocument();
  },
};
