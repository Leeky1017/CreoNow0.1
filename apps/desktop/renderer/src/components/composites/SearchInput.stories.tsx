import type { Meta, StoryObj } from "@storybook/react";

import { SearchInput } from "./SearchInput";

const meta: Meta<typeof SearchInput> = {
  title: "Composites/SearchInput",
  component: SearchInput,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: "",
    onChange: () => {},
    onClear: () => {},
    placeholder: "Search files...",
  },
};

export const WithValue: Story = {
  args: {
    value: "chapter",
    onChange: () => {},
    onClear: () => {},
    placeholder: "Search files...",
  },
};

export const WithShortcutHint: Story = {
  args: {
    value: "",
    onChange: () => {},
    onClear: () => {},
    placeholder: "Search...",
    shortcutHint: "⌘K",
  },
};
