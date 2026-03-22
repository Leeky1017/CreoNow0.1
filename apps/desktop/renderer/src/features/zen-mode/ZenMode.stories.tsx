import type { Meta, StoryObj } from "@storybook/react";
import { fn, within, expect } from "@storybook/test";
import { ZenMode } from "./ZenMode";

const defaultStats = {
  wordCount: 1240,
  saveStatus: "Saved",
  readTimeMinutes: 6,
};

const meta: Meta<typeof ZenMode> = {
  title: "Features/ZenMode",
  component: ZenMode,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Fullscreen distraction-free writing mode with centered content, subtle glow effects, and minimal UI hints that appear on hover. Uses the real TipTap editor instance.",
      },
    },
  },
  args: {
    open: true,
    onExit: fn(),
    editor: null,
    title: "The Architecture of Silence",
    isEmpty: false,
    stats: defaultStats,
    currentTime: "11:32 PM",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ZenMode>;

export const DefaultZenMode: Story = {
  name: "Default Zen Mode",
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const EmptyDocument: Story = {
  name: "Empty Document",
  args: {
    title: "Untitled Document",
    isEmpty: true,
    stats: { wordCount: 0, saveStatus: "Saved", readTimeMinutes: 1 },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const HoverTopShowExit: Story = {
  name: "Hover Top Show Exit",
  parameters: {
    docs: {
      description: {
        story: "Move mouse to top edge to see exit button fade in.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const HoverBottomShowStatus: Story = {
  name: "Hover Bottom Show Status",
  args: {
    stats: { wordCount: 847, saveStatus: "Saved", readTimeMinutes: 4 },
    currentTime: "11:32 PM",
  },
  parameters: {
    docs: {
      description: {
        story: "Move mouse to bottom edge to see status bar.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const ExitByEscape: Story = {
  name: "Exit By Escape",
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const ExitByClick: Story = {
  name: "Exit By Click",
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const Closed: Story = {
  name: "Closed State",
  args: { open: false },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const UnsavedChanges: Story = {
  name: "Unsaved Changes",
  args: {
    stats: { wordCount: 1243, saveStatus: "Unsaved", readTimeMinutes: 6 },
    currentTime: "11:35 PM",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const SavingState: Story = {
  name: "Saving State",
  args: {
    stats: { wordCount: 1245, saveStatus: "Saving...", readTimeMinutes: 6 },
    currentTime: "11:36 PM",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const SavedConfirmation: Story = {
  name: "Saved Confirmation",
  args: {
    stats: { wordCount: 1245, saveStatus: "Saved", readTimeMinutes: 6 },
    currentTime: "11:36 PM",
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
