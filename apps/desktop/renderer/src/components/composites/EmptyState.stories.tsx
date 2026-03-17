import type { Meta, StoryObj } from "@storybook/react";
import { FileText, Search, Users } from "lucide-react";

import { Button } from "../primitives/Button";
import { EmptyState } from "./EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "Composites/EmptyState",
  component: EmptyState,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 400, minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const NoFiles: Story = {
  args: {
    icon: <FileText size={48} />,
    title: "No files yet",
    description: "Create your first file to get started.",
    action: <Button size="sm" onClick={() => {}}>New File</Button>,
  },
};

export const NoSearchResults: Story = {
  args: {
    icon: <Search size={48} />,
    title: "No results found",
    description: "Try adjusting your search terms.",
  },
};

export const NoCharacters: Story = {
  args: {
    icon: <Users size={48} />,
    title: "No characters",
    description: "Create a character to start building your story world.",
    action: <Button size="sm" onClick={() => {}}>Add Character</Button>,
  },
};
