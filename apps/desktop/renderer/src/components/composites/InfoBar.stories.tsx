import type { Meta, StoryObj } from "@storybook/react";

import { InfoBar } from "./InfoBar";

const meta: Meta<typeof InfoBar> = {
  title: "Composites/InfoBar",
  component: InfoBar,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ width: 600 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    variant: "info",
    message: "Your project is being indexed for search.",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    message: "This document has unsaved changes.",
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    message: "Failed to connect to AI service. Please check your API key.",
    action: { label: "Settings", onClick: () => {} },
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    message: "Export completed successfully.",
    dismissible: true,
    onDismiss: () => {},
  },
};
