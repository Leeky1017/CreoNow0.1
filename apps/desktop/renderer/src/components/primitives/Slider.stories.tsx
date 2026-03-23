import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "./Slider";
import { within, expect } from "@storybook/test";

/**
 * Slider component stories
 *
 * A range slider component for numeric values.
 * Based on design spec style from 10-settings.html.
 */
const meta: Meta<typeof Slider> = {
  title: "Primitives/Slider",
  component: Slider,
  args: {
    "aria-label": "Slider control",
  },
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
    },
  },
  argTypes: {
    value: { control: { type: "number", min: 0, max: 100 } },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    disabled: { control: "boolean" },
    showLabels: { control: "boolean" },
    onValueChange: { action: "valueChange" },
  },
  decorators: [
    (Story) => (
      <div
        className="p-8 bg-[var(--color-bg-surface)] w-[300px]"
        data-theme="dark"
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Slider>;

/**
 * Default slider (0-100)
 */
export const Default: Story = {
  args: {
    defaultValue: 50,
    min: 0,
    max: 100,
    step: 1,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("slider")).toBeInTheDocument();
  },
};

/**
 * Slider with labels
 */
export const WithLabels: Story = {
  args: {
    defaultValue: 100,
    min: 80,
    max: 120,
    step: 10,
    showLabels: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("slider")).toBeInTheDocument();
  },
};

/**
 * Interface scale slider wrapper component
 */
function InterfaceScaleSlider(): JSX.Element {
  const [scale, setScale] = React.useState(100);
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[var(--color-fg-muted)]">
          Interface Scale
        </span>
        <span className="text-[13px] text-[var(--color-fg-default)] font-medium">
          {scale}%
        </span>
      </div>
      <Slider
        aria-label="Interface scale"
        min={80}
        max={120}
        step={10}
        value={scale}
        onValueChange={setScale}
        showLabels
      />
    </div>
  );
}

/**
 * Interface scale slider (as used in settings)
 */
export const InterfaceScale: Story = {
  render: () => <InterfaceScaleSlider />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("slider")).toBeInTheDocument();
  },
};

/**
 * Font size slider wrapper component
 */
function FontSizeSlider(): JSX.Element {
  const [fontSize, setFontSize] = React.useState(16);
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[var(--color-fg-muted)]">
          Font Size
        </span>
        <span className="text-[13px] text-[var(--color-fg-default)] font-medium">
          {fontSize}px
        </span>
      </div>
      <Slider
        aria-label="Font size"
        min={12}
        max={24}
        step={1}
        value={fontSize}
        onValueChange={setFontSize}
        showLabels
        formatLabel={(v) => `${v}px`}
      />
    </div>
  );
}

/**
 * Font size slider
 */
export const FontSize: Story = {
  render: () => <FontSizeSlider />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("slider")).toBeInTheDocument();
  },
};

/**
 * Disabled slider
 */
export const Disabled: Story = {
  args: {
    defaultValue: 50,
    min: 0,
    max: 100,
    disabled: true,
    showLabels: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("slider")).toBeInTheDocument();
  },
};

/**
 * Volume slider wrapper component
 */
function VolumeSlider(): JSX.Element {
  const [volume, setVolume] = React.useState(75);
  return (
    <div className="flex items-center gap-3 w-full">
      <svg
        className="w-5 h-5 text-[var(--color-fg-muted)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5 9v6h4l5 5V4L9 9H5z"
        />
      </svg>
      <Slider
        aria-label="Volume"
        min={0}
        max={100}
        step={1}
        value={volume}
        onValueChange={setVolume}
      />
      <span className="text-[12px] text-[var(--color-fg-muted)] w-8 text-right">
        {volume}
      </span>
    </div>
  );
}

/**
 * Volume slider (0-100)
 */
export const Volume: Story = {
  render: () => <VolumeSlider />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("slider")).toBeInTheDocument();
  },
};
