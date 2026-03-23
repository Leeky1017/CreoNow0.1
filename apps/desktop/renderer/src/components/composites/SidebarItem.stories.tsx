import type { Meta, StoryObj } from "@storybook/react";
import { FileText, BookOpen, Settings, Users, Brain } from "lucide-react";

import { SidebarItem } from "./SidebarItem";
import { within, expect } from "@storybook/test";

const meta: Meta<typeof SidebarItem> = {
  title: "Composites/SidebarItem",
  component: SidebarItem,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 240,
          background: "var(--color-bg-surface)",
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
    label: "Files",
    onClick: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("navigation")).toBeInTheDocument();
  },
};

export const Active: Story = {
  args: {
    icon: <BookOpen size={16} />,
    label: "Editor",
    active: true,
    onClick: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("navigation")).toBeInTheDocument();
  },
};

export const WithTrailing: Story = {
  args: {
    icon: <Brain size={16} />,
    label: "Memories",
    trailing: (
      <span className="rounded-full bg-[var(--color-accent-subtle)] px-1.5 text-xs">
        3
      </span>
    ),
    onClick: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("navigation")).toBeInTheDocument();
  },
};

export const SidebarList: Story = {
  render: () => (
    <div className="space-y-0.5">
      <SidebarItem
        icon={<FileText size={16} />}
        label="Files"
        onClick={() => {}}
      />
      <SidebarItem
        icon={<BookOpen size={16} />}
        label="Editor"
        active
        onClick={() => {}}
      />
      <SidebarItem
        icon={<Users size={16} />}
        label="Characters"
        onClick={() => {}}
      />
      <SidebarItem
        icon={<Brain size={16} />}
        label="Memory"
        trailing={
          <span className="rounded-full bg-[var(--color-accent-subtle)] px-1.5 text-xs">
            5
          </span>
        }
        onClick={() => {}}
      />
      <SidebarItem
        icon={<Settings size={16} />}
        label="Settings"
        onClick={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("navigation")).toBeInTheDocument();
  },
};
