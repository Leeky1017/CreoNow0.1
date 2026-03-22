import type { Meta, StoryObj } from "@storybook/react";

import { ErrorBoundary } from "./ErrorBoundary";
import { expect } from "@storybook/test";

function ThrowingComponent(): JSX.Element {
  throw new Error("Simulated fatal render error");
}

function SafeContent(): JSX.Element {
  return (
    <div className="rounded border border-[var(--color-border-default)] p-6 text-sm text-[var(--color-fg-default)]">
      Application content rendered successfully inside ErrorBoundary.
    </div>
  );
}

const meta: Meta<typeof ErrorBoundary> = {
  title: "Patterns/ErrorBoundary",
  component: ErrorBoundary,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const WithSafeContent: Story = {
  args: {
    children: <SafeContent />,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const WithError: Story = {
  args: {
    children: <ThrowingComponent />,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
