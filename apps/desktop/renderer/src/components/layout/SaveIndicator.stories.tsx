import type { Meta, StoryObj } from "@storybook/react";

import { SaveIndicator } from "./SaveIndicator";

const meta: Meta<typeof SaveIndicator> = {
  title: "Layout/SaveIndicator",
  component: SaveIndicator,
  parameters: { layout: "centered" },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Saved: Story = {
  args: {
    autosaveStatus: "saved",
    onRetry: () => {},
  },
};

export const Saving: Story = {
  args: {
    autosaveStatus: "saving",
    onRetry: () => {},
  },
};

export const Error: Story = {
  args: {
    autosaveStatus: "error",
    onRetry: () => {},
  },
};

export const Idle: Story = {
  args: {
    autosaveStatus: "idle",
    onRetry: () => {},
  },
};
