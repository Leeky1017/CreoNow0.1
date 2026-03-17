import type { Meta, StoryObj } from "@storybook/react";

import { EmptyState } from "./EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "Patterns/EmptyState",
  component: EmptyState,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 480,
          minHeight: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const FirstFile: Story = {
  args: {
    variant: "first-file",
    onAction: () => {},
  },
};

export const NoFiles: Story = {
  args: {
    variant: "no-files",
    onAction: () => {},
  },
};

export const NoSearchResults: Story = {
  args: {
    variant: "no-search-results",
    onAction: () => {},
  },
};

export const NoCharacters: Story = {
  args: {
    variant: "no-characters",
    onAction: () => {},
  },
};

export const NoContent: Story = {
  args: {
    variant: "no-content",
    onAction: () => {},
  },
};
