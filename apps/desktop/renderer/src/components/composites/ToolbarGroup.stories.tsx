import type { Meta, StoryObj } from "@storybook/react";
import { Bold, Italic, Underline, Strikethrough } from "lucide-react";

import { Button } from "../primitives";
import { ToolbarGroup } from "./ToolbarGroup";

const meta: Meta<typeof ToolbarGroup> = {
  title: "Composites/ToolbarGroup",
  component: ToolbarGroup,
  parameters: { layout: "centered" },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Button size="sm" variant="ghost">
          <Bold size={16} />
        </Button>
        <Button size="sm" variant="ghost">
          <Italic size={16} />
        </Button>
        <Button size="sm" variant="ghost">
          <Underline size={16} />
        </Button>
      </>
    ),
  },
};

export const WithSeparator: Story = {
  args: {
    separator: true,
    children: (
      <>
        <Button size="sm" variant="ghost">
          <Bold size={16} />
        </Button>
        <Button size="sm" variant="ghost">
          <Italic size={16} />
        </Button>
        <Button size="sm" variant="ghost">
          <Strikethrough size={16} />
        </Button>
      </>
    ),
  },
};

export const ToolbarLayout: Story = {
  render: () => (
    <div className="flex items-center gap-1 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-1">
      <ToolbarGroup separator>
        <Button size="sm" variant="ghost">
          <Bold size={16} />
        </Button>
        <Button size="sm" variant="ghost">
          <Italic size={16} />
        </Button>
        <Button size="sm" variant="ghost">
          <Underline size={16} />
        </Button>
      </ToolbarGroup>
      <ToolbarGroup>
        <Button size="sm" variant="ghost">
          <Strikethrough size={16} />
        </Button>
      </ToolbarGroup>
    </div>
  ),
};
