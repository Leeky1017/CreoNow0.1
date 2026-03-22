import type { Meta, StoryObj } from "@storybook/react";

import { RegionErrorBoundary } from "./RegionErrorBoundary";
import { expect } from "@storybook/test";

function ThrowingComponent(): JSX.Element {
  throw new Error("Simulated render error");
}

function SafeContent(): JSX.Element {
  return (
    <div className="rounded border border-[var(--color-border-default)] p-4 text-sm text-[var(--color-fg-default)]">
      This content rendered successfully inside a RegionErrorBoundary.
    </div>
  );
}

const meta: Meta<typeof RegionErrorBoundary> = {
  title: "Patterns/RegionErrorBoundary",
  component: RegionErrorBoundary,
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

export const WithSafeContent: Story = {
  args: {
    region: "Panel",
    children: <SafeContent />,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const WithError: Story = {
  args: {
    region: "File Tree",
    children: <ThrowingComponent />,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
