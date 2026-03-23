import type { Meta, StoryObj } from "@storybook/react";

import { OnboardingPage } from "./OnboardingPage";
import { expect } from "@storybook/test";

/**
 * OnboardingPage displays the multi-step onboarding wizard.
 *
 * Features:
 * - Welcome message with logo
 * - Feature introduction cards
 * - Step progress indicator
 * - Skip and Next navigation
 */
const meta: Meta<typeof OnboardingPage> = {
  title: "Features/Onboarding/OnboardingPage",
  component: OnboardingPage,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onComplete: () => {
      console.log("Onboarding completed");
    },
  },
};

export default meta;
type Story = StoryObj<typeof OnboardingPage>;

/**
 * Default state showing the first step of onboarding.
 */
export const Default: Story = {};

/**
 * Dark theme variant.
 */
export const DarkTheme: Story = {
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div data-theme="dark" className="h-screen w-screen">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Light theme variant.
 */
export const LightTheme: Story = {
  decorators: [
    (Story) => (
      <div data-theme="light" className="h-screen w-screen">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Mobile viewport (narrow width).
 */
export const MobileViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
