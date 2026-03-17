import type { Meta, StoryObj } from "@storybook/react";

import { ErrorState } from "./ErrorState";

const meta: Meta<typeof ErrorState> = {
  title: "Patterns/ErrorState",
  component: ErrorState,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 480,
          minHeight: 300,
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

export const Region: Story = {
  args: {
    variant: "region",
    title: "Failed to load panel",
    message: "An unexpected error occurred while rendering this section.",
    onRetry: () => {},
  },
};

export const Page: Story = {
  args: {
    variant: "page",
    title: "Something went wrong",
    message:
      "The application encountered an unexpected error. Please try reloading.",
    onRetry: () => {},
    onDismiss: () => {},
  },
};

export const Critical: Story = {
  args: {
    variant: "page",
    severity: "critical",
    title: "Critical Error",
    message: "Unable to access the file system. Data may be at risk.",
    onRetry: () => {},
  },
};
