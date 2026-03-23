import type { Meta, StoryObj } from "@storybook/react";

import { FormField } from "./FormField";
import { Input } from "../primitives";
import { expect } from "@storybook/test";

const meta: Meta<typeof FormField> = {
  title: "Composites/FormField",
  component: FormField,
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
    label: "Project Name",
    htmlFor: "name",
    children: <Input id="name" placeholder="Enter project name" />,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const WithHelp: Story = {
  args: {
    label: "API Key",
    htmlFor: "api-key",
    help: "You can find your API key in Settings → API.",
    children: <Input id="api-key" placeholder="sk-..." />,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const WithError: Story = {
  args: {
    label: "Email",
    htmlFor: "email",
    error: "Please enter a valid email address",
    children: <Input id="email" defaultValue="not-an-email" />,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const Required: Story = {
  args: {
    label: "Username",
    htmlFor: "username",
    required: true,
    children: <Input id="username" placeholder="Required field" />,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
