import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";

import { AppToastProvider } from "../../components/providers/AppToastProvider";
import { createPreferenceStore } from "../../lib/preferences";
import {
  ProjectStoreProvider,
  createProjectStore,
} from "../../stores/projectStore";
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
const storyInvoke = (async (channel: string) => {
  if (channel === "project:project:getcurrent") {
    return {
      ok: true,
      data: {
        projectId: "storybook-project",
        rootPath: "/tmp/storybook-project",
      },
    };
  }
  if (channel === "project:project:list") {
    return {
      ok: true,
      data: {
        items: [
          {
            projectId: "storybook-project",
            name: "Storybook Project",
            rootPath: "/tmp/storybook-project",
            updatedAt: Date.now(),
          },
        ],
      },
    };
  }
  return { ok: true, data: {} };
}) as Parameters<typeof createProjectStore>[0]["invoke"];

const projectStore = createProjectStore({
  invoke: storyInvoke,
});

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
          <ProjectStoreProvider store={projectStore}>
            <ThemeStoreProvider store={themeStore}>
              <div
                className="w-full h-screen bg-[var(--color-bg-base)]"
                data-theme="dark"
              >
                <Story />
              </div>
            </ThemeStoreProvider>
          </ProjectStoreProvider>
        </AppToastProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof SettingsDialog>;

export const General: Story = {
  args: { open: true, defaultTab: "general" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByTestId("settings-dialog"),
    ).toBeInTheDocument();
  },
};

export const Appearance: Story = {
  args: { open: true, defaultTab: "appearance" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByTestId("settings-dialog"),
    ).toBeInTheDocument();
  },
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
