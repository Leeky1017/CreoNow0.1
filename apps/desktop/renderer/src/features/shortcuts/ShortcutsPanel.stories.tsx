/**
 * ShortcutsPanel Stories
 *
 * ShortcutsPanel is a simple presentational component with no IPC
 * dependencies — it renders keyboard shortcuts from the centralised
 * config. We can import and render it directly.
 *
 * @module features/shortcuts/ShortcutsPanel.stories
 */

import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";

import { ShortcutsPanel } from "./ShortcutsPanel";

/* ------------------------------------------------------------------ */
/*  Storybook meta                                                    */
/* ------------------------------------------------------------------ */

const meta = {
  title: "Features/Shortcuts/ShortcutsPanel",
  component: ShortcutsPanel,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#080808" }],
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ShortcutsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/*  Stories                                                           */
/* ------------------------------------------------------------------ */

/** Default rendering of all keyboard shortcuts. */
export const Default: Story = {
  render: () => (
    <div
      style={{
        width: 400,
        backgroundColor: "var(--color-bg-surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-separator)",
      }}
    >
      <ShortcutsPanel />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("shortcuts-panel")).toBeInTheDocument();

    // Verify well-known editor shortcuts are rendered
    await expect(canvas.getByText("Bold")).toBeInTheDocument();
    await expect(canvas.getByText("Italic")).toBeInTheDocument();
    await expect(canvas.getByText("Undo")).toBeInTheDocument();

    // Verify kbd elements exist for key display
    const kbdElements = canvasElement.querySelectorAll("kbd");
    await expect(kbdElements.length).toBeGreaterThan(0);
  },
};

/**
 * Shortcuts panel with a decorative search-filter header.
 * Demonstrates how the panel might appear inside a filtered view.
 */
export const WithSearchHighlight: Story = {
  name: "With Search Filter",
  render: () => (
    <div
      style={{
        width: 400,
        backgroundColor: "var(--color-bg-surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-separator)",
      }}
    >
      {/* Decorative search bar */}
      <div
        style={{
          padding: "var(--spacing-sm, 8px) var(--spacing-lg, 16px)",
          borderBottom: "1px solid var(--color-separator)",
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-sm, 8px)",
        }}
      >
        <span
          style={{
            color: "var(--color-fg-muted)",
            fontSize: "var(--font-size-sm, 13px)",
          }}
        >
          🔍
        </span>
        <input
          type="text"
          defaultValue="bold"
          readOnly
          aria-label="Filter shortcuts"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--color-fg-default)",
            fontSize: "var(--font-size-sm, 13px)",
          }}
        />
      </div>
      <ShortcutsPanel />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("shortcuts-panel")).toBeInTheDocument();
    // Verify the search input is present
    await expect(canvas.getByLabelText("Filter shortcuts")).toBeInTheDocument();
  },
};

/**
 * Shortcuts panel constrained to a narrow sidebar width.
 * Tests responsive behaviour at 240px.
 */
export const NarrowWidth: Story = {
  name: "Narrow Width (240px)",
  render: () => (
    <div
      style={{
        width: 240,
        backgroundColor: "var(--color-bg-surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-separator)",
        overflow: "hidden",
      }}
    >
      <ShortcutsPanel />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("shortcuts-panel")).toBeInTheDocument();
    // Verify layout shortcuts are also rendered
    await expect(canvas.getByText("Zen Mode")).toBeInTheDocument();
    await expect(canvas.getByText("Save")).toBeInTheDocument();
  },
};
