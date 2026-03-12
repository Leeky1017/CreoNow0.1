import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "../primitives";
import { AppToastProvider, useAppToast } from "./AppToastProvider";

function StoryDemo(): JSX.Element {
  const { showToast } = useAppToast();

  return (
    <div className="flex min-h-[280px] items-end gap-3 bg-[var(--color-bg-base)] p-6">
      <Button
        onClick={() => {
          showToast({
            title: "Saved successfully",
            description: "The latest changes are now stored.",
            variant: "success",
          });
        }}
      >
        Success Toast
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          showToast({
            title: "Save failed",
            description: "Please try again after checking disk space.",
            variant: "error",
            action: {
              label: "Retry save",
              onClick: () => {},
            },
          });
        }}
      >
        Error Toast
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          showToast({ title: "Export completed", variant: "success" });
          showToast({
            title: "AI request failed",
            description: "The service is busy. Please retry in a moment.",
            variant: "error",
          });
        }}
      >
        Stacked Toasts
      </Button>
    </div>
  );
}

const meta: Meta<typeof AppToastProvider> = {
  title: "Providers/AppToastProvider",
  component: AppToastProvider,
  render: () => (
    <AppToastProvider>
      <StoryDemo />
    </AppToastProvider>
  ),
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
