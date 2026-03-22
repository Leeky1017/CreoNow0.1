import type { Meta, StoryObj } from "@storybook/react";

import { ImageCropper } from "./ImageCropper";
import { expect } from "@storybook/test";

const meta: Meta<typeof ImageCropper> = {
  title: "Composites/ImageCropper",
  component: ImageCropper,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 400, height: 400 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const NoFile: Story = {
  args: {
    file: null,
    onCropChange: () => {},
    aspectRatio: 1,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
