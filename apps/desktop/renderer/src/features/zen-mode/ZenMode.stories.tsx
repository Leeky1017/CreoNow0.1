import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
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
          "Fullscreen distraction-free writing mode with real TipTap editor, subtle glow effects, and minimal UI hints that appear on hover. Editor instance is null in Storybook — use the running app for full editing experience.",
      },
    },
  },
  args: {
    open: true,
    onExit: fn(),
    editor: null,
    title: "The Architecture of Silence",
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

/**
 * Default fullscreen zen mode (no editor instance in Storybook)
 */
export const DefaultZenMode: Story = {
  name: "Default Zen Mode",
  args: {
    open: true,
    title: "The Architecture of Silence",
    stats: defaultStats,
    currentTime: "11:32 PM",
  },
};

/**
 * Hover top to reveal exit button
 */
export const HoverTopShowExit: Story = {
  name: "Hover Top Show Exit",
  args: {
    open: true,
    title: "The Architecture of Silence",
    stats: defaultStats,
  },
};

/**
 * Hover bottom to reveal status bar
 */
export const HoverBottomShowStatus: Story = {
  name: "Hover Bottom Show Status",
  args: {
    open: true,
    title: "The Architecture of Silence",
    stats: {
      wordCount: 847,
      saveStatus: "Saved",
      readTimeMinutes: 4,
    },
    currentTime: "11:32 PM",
  },
};

/**
 * Closed state - renders nothing
 */
export const Closed: Story = {
  name: "Closed State",
  args: {
    open: false,
    title: "The Architecture of Silence",
    stats: defaultStats,
  },
};

/**
 * Empty document — shows untitled and placeholder
 */
export const EmptyDocument: Story = {
  name: "Empty Document",
  args: {
    open: true,
    editor: null,
    title: "Untitled Document",
    stats: {
      wordCount: 0,
      saveStatus: "Saved",
      readTimeMinutes: 1,
    },
    currentTime: "11:45 PM",
  },
};

/**
 * Unsaved changes status
 */
export const UnsavedChanges: Story = {
  name: "Unsaved Changes",
  args: {
    open: true,
    title: "The Architecture of Silence",
    stats: {
      wordCount: 1243,
      saveStatus: "Unsaved",
      readTimeMinutes: 6,
    },
    currentTime: "11:35 PM",
  },
};

/**
 * Saving state
 */
export const SavingState: Story = {
  name: "Saving State",
  args: {
    open: true,
    title: "The Architecture of Silence",
    stats: {
      wordCount: 1245,
      saveStatus: "Saving...",
      readTimeMinutes: 6,
    },
    currentTime: "11:36 PM",
  },
};

/**
 * Saved confirmation
 */
export const SavedConfirmation: Story = {
  name: "Saved Confirmation",
  args: {
    open: true,
    title: "The Architecture of Silence",
    stats: {
      wordCount: 1245,
      saveStatus: "Saved",
      readTimeMinutes: 6,
    },
    currentTime: "11:36 PM",
  },
};
