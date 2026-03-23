import type { Meta, StoryObj } from "@storybook/react";

import { LayoutShell } from "./LayoutShell";
import { expect } from "@storybook/test";

const Placeholder = ({ label, bg }: { label: string; bg: string }) => (
  <div
    className="flex h-full items-center justify-center text-xs text-[var(--color-fg-muted)]"
    style={{ background: bg, minHeight: 40 }}
  >
    {label}
  </div>
);

const meta: Meta<typeof LayoutShell> = {
  title: "Layout/LayoutShell",
  component: LayoutShell,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    testId: "layout-shell",
    activityBar: (
      <Placeholder label="Activity Bar" bg="var(--color-bg-sunken)" />
    ),
    left: (
      <div style={{ width: 240, height: "100%" }}>
        <Placeholder label="Left Panel" bg="var(--color-bg-surface)" />
      </div>
    ),
    leftResizer: (
      <div
        style={{
          width: 4,
          height: "100%",
          background: "var(--color-separator)",
          cursor: "col-resize",
        }}
      />
    ),
    main: (
      <div style={{ flex: 1, height: "100%" }}>
        <Placeholder label="Main Content" bg="var(--color-bg-base)" />
      </div>
    ),
    rightResizer: (
      <div
        style={{
          width: 4,
          height: "100%",
          background: "var(--color-separator)",
          cursor: "col-resize",
        }}
      />
    ),
    right: (
      <div style={{ width: 320, height: "100%" }}>
        <Placeholder label="Right Panel" bg="var(--color-bg-surface)" />
      </div>
    ),
    bottomBar: (
      <div style={{ height: 28 }}>
        <Placeholder label="Bottom Bar" bg="var(--color-bg-sunken)" />
      </div>
    ),
    overlays: null,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
