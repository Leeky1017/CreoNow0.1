import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from "./ScrollArea";
import { expect } from "@storybook/test";

const meta = {
  title: "Primitives/ScrollArea",
  component: ScrollArea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    style: { height: 200, width: 300 },
    children: (
      <div style={{ padding: "1rem" }}>
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            style={{
              height: 24,
              marginBottom: "0.5rem",
              borderRadius: "var(--radius-sm)",
              background:
                i % 3 === 0
                  ? "var(--color-bg-raised)"
                  : i % 3 === 1
                    ? "var(--color-border-default)"
                    : "var(--color-bg-overlay)",
            }}
          />
        ))}
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const Horizontal: Story = {
  args: {
    style: { height: 100, width: 300 },
    children: (
      <div
        style={{ display: "flex", gap: "1rem", padding: "1rem", width: 800 }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            style={{
              flexShrink: 0,
              width: 120,
              height: 60,
              background: "var(--color-bg-raised)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-fg-default)",
            }}
          >
            {`Card ${i + 1}`}
          </div>
        ))}
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
