/**
 * Settings Stories — AiSettingsSection, AppearanceSection, JudgeSection
 *
 * Uses real components with mocked IPC boundary (window.creonow.invoke).
 *
 * @module features/settings/Settings.stories
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";

import { AiSettingsSection } from "./AiSettingsSection";
import { JudgeSection } from "./JudgeSection";
import { AppearanceSection } from "./AppearanceSection";
import {
  ThemeStoreProvider,
  createThemeStore,
} from "../../stores/themeStore";
import type { PreferenceStore, PreferenceKey } from "../../lib/preferences";

/* ------------------------------------------------------------------ */
/*  Mock helpers                                                       */
/* ------------------------------------------------------------------ */

function createMockAiIpc(options: {
  providerMode?: "openai-compatible" | "openai-byok" | "anthropic-byok";
  apiKeyConfigured?: boolean;
  testOk?: boolean;
}) {
  const {
    providerMode = "openai-compatible",
    apiKeyConfigured = true,
    testOk = true,
  } = options;

  return async (channel: string): Promise<unknown> => {
    if (channel === "ai:config:get") {
      return {
        ok: true,
        data: {
          providerMode,
          baseUrl: "https://api.openai.com",
          openAiCompatibleBaseUrl: "https://api.openai.com",
          openAiCompatibleApiKeyConfigured: apiKeyConfigured,
          openAiByokBaseUrl: "",
          openAiByokApiKeyConfigured: false,
          anthropicByokBaseUrl: "",
          anthropicByokApiKeyConfigured: false,
          apiKeyConfigured,
          enabled: true,
        },
      };
    }
    if (channel === "ai:config:update") {
      return {
        ok: true,
        data: {
          providerMode,
          baseUrl: "https://api.openai.com",
          openAiCompatibleBaseUrl: "https://api.openai.com",
          openAiCompatibleApiKeyConfigured: true,
          openAiByokBaseUrl: "",
          openAiByokApiKeyConfigured: false,
          anthropicByokBaseUrl: "",
          anthropicByokApiKeyConfigured: false,
          apiKeyConfigured: true,
          enabled: true,
        },
      };
    }
    if (channel === "ai:config:test") {
      if (testOk) {
        return { ok: true, data: { ok: true, latencyMs: 120 } };
      }
      return { ok: true, data: { ok: false, latencyMs: 500, error: { code: "TIMEOUT", message: "Connection timed out" } } };
    }
    return { ok: false, error: { code: "NOT_FOUND", message: `Unhandled: ${String(channel)}` } };
  };
}

function createMockJudgeIpc(status: "ready" | "not_ready" | "downloading" | "error") {
  return async (channel: string): Promise<unknown> => {
    if (channel === "judge:model:getstate") {
      if (status === "error") {
        return {
          ok: true,
          data: { state: { status: "error", error: { code: "INTERNAL", message: "MODEL_INIT_FAILED" } } },
        };
      }
      return { ok: true, data: { state: { status } } };
    }
    if (channel === "judge:model:ensure") {
      return { ok: true, data: { state: { status: "ready" } } };
    }
    return { ok: false, error: { code: "NOT_FOUND", message: `Unhandled: ${String(channel)}` } };
  };
}

function createMockPreferences(initial: "dark" | "light" | "system" = "system"): PreferenceStore {
  const store = new Map<string, unknown>();
  store.set("creonow.theme.mode", initial);
  return {
    get<T>(key: PreferenceKey): T | null {
      return (store.get(key) as T | undefined) ?? null;
    },
    set<T>(key: PreferenceKey, value: T): void {
      store.set(key, value);
    },
    remove(key: PreferenceKey): void {
      store.delete(key);
    },
    clear(): void {
      store.clear();
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Wrappers                                                           */
/* ------------------------------------------------------------------ */

function AiSettingsWrapper(props: {
  providerMode?: "openai-compatible" | "openai-byok" | "anthropic-byok";
  apiKeyConfigured?: boolean;
  testOk?: boolean;
}): JSX.Element {
  const mockInvoke = React.useMemo(() => createMockAiIpc(props), [props]);

  React.useEffect(() => {
    const prev = window.creonow;
    window.creonow = { invoke: mockInvoke as NonNullable<Window["creonow"]>["invoke"] };
    return () => { window.creonow = prev; };
  }, [mockInvoke]);

  return (
    <div style={{ width: 440, padding: 16, backgroundColor: "var(--color-bg-surface)" }}>
      <AiSettingsSection />
    </div>
  );
}

function JudgeSectionWrapper(props: {
  status: "ready" | "not_ready" | "downloading" | "error";
}): JSX.Element {
  const mockInvoke = React.useMemo(() => createMockJudgeIpc(props.status), [props.status]);

  React.useEffect(() => {
    const prev = window.creonow;
    window.creonow = { invoke: mockInvoke as NonNullable<Window["creonow"]>["invoke"] };
    return () => { window.creonow = prev; };
  }, [mockInvoke]);

  return (
    <div style={{ width: 440, padding: 16, backgroundColor: "var(--color-bg-surface)" }}>
      <JudgeSection />
    </div>
  );
}

function AppearanceWrapper(props: { initial?: "dark" | "light" | "system" }): JSX.Element {
  const [themeStore] = React.useState(() =>
    createThemeStore(createMockPreferences(props.initial ?? "dark")),
  );

  return (
    <ThemeStoreProvider store={themeStore}>
      <div style={{ width: 440, padding: 16, backgroundColor: "var(--color-bg-surface)" }}>
        <AppearanceSection />
      </div>
    </ThemeStoreProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Meta                                                               */
/* ------------------------------------------------------------------ */

const meta: Meta = {
  title: "Features/Settings",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

/* ------------------------------------------------------------------ */
/*  AI Settings stories                                               */
/* ------------------------------------------------------------------ */

export const AiSettingsDefault: Story = {
  render: () => <AiSettingsWrapper providerMode="openai-compatible" apiKeyConfigured={true} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("settings-ai-section")).toBeInTheDocument();
    await expect(canvas.getByTestId("ai-provider-mode")).toBeInTheDocument();
    await expect(canvas.getByTestId("ai-base-url")).toBeInTheDocument();
    await expect(canvas.getByTestId("ai-api-key")).toBeInTheDocument();
    await expect(canvas.getByTestId("ai-save-btn")).toBeInTheDocument();
    await expect(canvas.getByTestId("ai-test-btn")).toBeInTheDocument();
  },
};

export const AiSettingsUnconfigured: Story = {
  render: () => <AiSettingsWrapper providerMode="openai-compatible" apiKeyConfigured={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("settings-ai-section")).toBeInTheDocument();
  },
};

/* ------------------------------------------------------------------ */
/*  Judge Section stories                                             */
/* ------------------------------------------------------------------ */

export const JudgeReady: Story = {
  render: () => <JudgeSectionWrapper status="ready" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("settings-judge-section")).toBeInTheDocument();
    await expect(canvas.getByTestId("judge-ensure")).toBeInTheDocument();
  },
};

export const JudgeNotReady: Story = {
  render: () => <JudgeSectionWrapper status="not_ready" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("settings-judge-section")).toBeInTheDocument();
    await expect(canvas.getByTestId("judge-ensure")).toBeInTheDocument();
  },
};

export const JudgeError: Story = {
  render: () => <JudgeSectionWrapper status="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("settings-judge-section")).toBeInTheDocument();
  },
};

/* ------------------------------------------------------------------ */
/*  Appearance stories                                                */
/* ------------------------------------------------------------------ */

export const AppearanceDark: Story = {
  render: () => <AppearanceWrapper initial="dark" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("settings-appearance-section")).toBeInTheDocument();
    await expect(canvas.getByTestId("theme-mode-dark")).toBeInTheDocument();
    await expect(canvas.getByTestId("theme-mode-light")).toBeInTheDocument();
    await expect(canvas.getByTestId("theme-mode-system")).toBeInTheDocument();
  },
};

export const AppearanceLight: Story = {
  render: () => <AppearanceWrapper initial="light" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("settings-appearance-section")).toBeInTheDocument();
  },
};
