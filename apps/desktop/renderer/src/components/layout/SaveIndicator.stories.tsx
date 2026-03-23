import type { Meta, StoryObj } from "@storybook/react";

import { SaveIndicator } from "./SaveIndicator";
import { expect } from "@storybook/test";

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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const Saving: Story = {
  args: {
    autosaveStatus: "saving",
    onRetry: () => {},
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const Error: Story = {
  args: {
    autosaveStatus: "error",
    onRetry: () => {},
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const Idle: Story = {
  args: {
    autosaveStatus: "idle",
    onRetry: () => {},
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
