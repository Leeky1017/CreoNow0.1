import type { Meta, StoryObj } from "@storybook/react";
import { FileText, Settings, Search, Plus } from "lucide-react";

import { CommandItem } from "./CommandItem";
import { expect } from "@storybook/test";

const meta: Meta<typeof CommandItem> = {
  title: "Composites/CommandItem",
  component: CommandItem,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div
        role="listbox"
        aria-label="Command options"
        style={{
          width: 480,
          background: "var(--color-bg-raised)",
          borderRadius: 8,
          padding: 4,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: <FileText size={16} />,
    label: "Open File",
    hint: "⌘O",
    onSelect: () => {},
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const Active: Story = {
  args: {
    icon: <Search size={16} />,
    label: "Search Project",
    hint: "⌘K",
    active: true,
    onSelect: () => {},
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const CommandList: Story = {
  render: () => (
    <div className="space-y-0.5">
      <CommandItem
        icon={<Plus size={16} />}
        label="New File"
        hint="⌘N"
        active
        onSelect={() => {}}
      />
      <CommandItem
        icon={<FileText size={16} />}
        label="Open File"
        hint="⌘O"
        onSelect={() => {}}
      />
      <CommandItem
        icon={<Search size={16} />}
        label="Search"
        hint="⌘K"
        onSelect={() => {}}
      />
      <CommandItem
        icon={<Settings size={16} />}
        label="Settings"
        hint="⌘,"
        onSelect={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
