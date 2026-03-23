import type { Meta, StoryObj } from "@storybook/react";

import { RegionFallback } from "./RegionFallback";
import { expect } from "@storybook/test";

const meta: Meta<typeof RegionFallback> = {
  title: "Patterns/RegionFallback",
  component: RegionFallback,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 400, minHeight: 200 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    region: "File Tree",
    errorMessage: "Failed to load the file list.",
    onRetry: () => {},
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const EditorRegion: Story = {
  args: {
    region: "Editor",
    errorMessage: "The editor encountered an unexpected error.",
    onRetry: () => {},
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
