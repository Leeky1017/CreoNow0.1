import type { Meta, StoryObj } from "@storybook/react";
import { FileText } from "lucide-react";

import { Button } from "../primitives";
import { PanelContainer } from "./PanelContainer";

const meta: Meta<typeof PanelContainer> = {
  title: "Composites/PanelContainer",
  component: PanelContainer,
  parameters: { layout: "centered" },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Files",
    icon: <FileText size={16} />,
    children: (
      <div className="space-y-2 p-3">
        <div className="h-8 rounded bg-[var(--color-bg-hover)]" />
        <div className="h-8 rounded bg-[var(--color-bg-hover)]" />
        <div className="h-8 rounded bg-[var(--color-bg-hover)]" />
      </div>
    ),
  },
};

export const WithActions: Story = {
  args: {
    title: "Characters",
    icon: <FileText size={16} />,
    actions: (
      <Button size="sm" variant="ghost">
        Add
      </Button>
    ),
    children: (
      <div className="p-3 text-sm text-[var(--color-fg-muted)]">
        Panel content with action buttons in header
      </div>
    ),
  },
};
