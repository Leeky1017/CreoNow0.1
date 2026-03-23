import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, userEvent } from "@storybook/test";
import { Toggle } from "./Toggle";

/**
 * Toggle component stories
 *
 * A toggle switch component for boolean settings.
 * Based on design spec toggle style from 10-settings.html.
 */
const meta: Meta<typeof Toggle> = {
  title: "Primitives/Toggle",
  component: Toggle,
  args: {
    "aria-label": "Toggle switch",
  },
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
    },
  },
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
    onCheckedChange: { action: "checkedChange" },
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-[var(--color-bg-surface)]" data-theme="dark">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Toggle>;

/**
 * Default toggle in unchecked state
 */
export const Default: Story = {
  args: {
    defaultChecked: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("switch");
    await expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
  },
};

/**
 * Checked toggle
 */
export const Checked: Story = {
  args: {
    checked: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).toBeInTheDocument();
  },
};

/**
 * Toggle with label
 */
export const WithLabel: Story = {
  args: {
    label: "Enable notifications",
    defaultChecked: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).toBeInTheDocument();
  },
};

/**
 * Toggle with label and description
 */
export const WithLabelAndDescription: Story = {
  args: {
    label: "Focus Mode",
    description:
      "Dims all interface elements except the editor when you start typing to reduce distractions.",
    defaultChecked: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).toBeInTheDocument();
  },
};

/**
 * Disabled toggle
 */
export const Disabled: Story = {
  args: {
    label: "Disabled option",
    description: "This option is currently unavailable.",
    disabled: true,
    defaultChecked: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).toBeInTheDocument();
  },
};

/**
 * Disabled and checked toggle
 */
export const DisabledChecked: Story = {
  args: {
    label: "Disabled option (on)",
    description: "This option is enabled but cannot be changed.",
    disabled: true,
    checked: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).toBeInTheDocument();
  },
};

/**
 * Toggle group wrapper component
 */
function ToggleGroupDemo(): JSX.Element {
  const [focusMode, setFocusMode] = React.useState(true);
  const [typewriter, setTypewriter] = React.useState(false);
  const [smartPunctuation, setSmartPunctuation] = React.useState(true);

  return (
    <div className="flex flex-col gap-6 w-[400px]">
      <Toggle
        label="Focus Mode"
        description="Dims all interface elements except the editor."
        checked={focusMode}
        onCheckedChange={setFocusMode}
      />
      <Toggle
        label="Typewriter Scroll"
        description="Keeps your active line vertically centered."
        checked={typewriter}
        onCheckedChange={setTypewriter}
      />
      <Toggle
        label="Smart Punctuation"
        description="Convert straight quotes to curly quotes."
        checked={smartPunctuation}
        onCheckedChange={setSmartPunctuation}
      />
    </div>
  );
}

/**
 * Multiple toggles in a group
 */
export const ToggleGroup: Story = {
  render: () => <ToggleGroupDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).toBeInTheDocument();
  },
};
