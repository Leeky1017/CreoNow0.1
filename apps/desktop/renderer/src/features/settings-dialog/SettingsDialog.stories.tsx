import type { Meta, StoryObj } from "@storybook/react";

import { AppToastProvider } from "../../components/providers/AppToastProvider";
import { createPreferenceStore } from "../../lib/preferences";
import { createThemeStore, ThemeStoreProvider } from "../../stores/themeStore";
import { SettingsDialog } from "./SettingsDialog";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  } satisfies Storage;
}

const preferences = createPreferenceStore(createMemoryStorage());
const themeStore = createThemeStore(preferences);

const meta: Meta<typeof SettingsDialog> = {
  title: "Features/SettingsDialog",
  component: SettingsDialog,
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "dark",
    },
  },
  argTypes: {
    open: { control: "boolean" },
    onOpenChange: { action: "openChange" },
    defaultTab: {
      control: "select",
      options: ["general", "appearance", "ai", "judge", "analytics", "account"],
    },
  },
  decorators: [
    (Story) => {
      return (
        <AppToastProvider>
          <ThemeStoreProvider store={themeStore}>
            <div
              className="w-full h-screen bg-[var(--color-bg-base)]"
              data-theme="dark"
            >
              <Story />
            </div>
          </ThemeStoreProvider>
        </AppToastProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof SettingsDialog>;

export const General: Story = {
  args: { open: true, defaultTab: "general" },
};

export const Appearance: Story = {
  args: { open: true, defaultTab: "appearance" },
};

export const AI: Story = {
  args: { open: true, defaultTab: "ai" },
};

export const Judge: Story = {
  args: { open: true, defaultTab: "judge" },
};

export const Analytics: Story = {
  args: { open: true, defaultTab: "analytics" },
};

export const Account: Story = {
  args: { open: true, defaultTab: "account" },
};
