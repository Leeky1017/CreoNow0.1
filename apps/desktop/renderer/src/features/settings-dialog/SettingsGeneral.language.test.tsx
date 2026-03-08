import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPreferenceStore, type PreferenceStore } from "../../lib/preferences";
import { PreferenceProvider } from "../../lib/PreferenceContext";

vi.mock("../../i18n", () => ({
  i18n: { changeLanguage: vi.fn(() => Promise.resolve()) },
}));

import {
  SettingsGeneral,
  defaultGeneralSettings,
} from "./SettingsGeneral";

function createMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; },
  };
}

function renderWithPreferences(
  preferenceStore: PreferenceStore,
  ui: React.ReactElement,
) {
  return render(
    <PreferenceProvider value={preferenceStore}>{ui}</PreferenceProvider>,
  );
}

describe("SettingsGeneral language selector", () => {
  let preferenceStore: PreferenceStore;

  beforeEach(() => {
    vi.clearAllMocks();
    preferenceStore = createPreferenceStore(createMockStorage());
  });

  it("renders a Language section heading", () => {
    renderWithPreferences(
      preferenceStore,
      <SettingsGeneral
        settings={defaultGeneralSettings}
        showAiMarks={false}
        onShowAiMarksChange={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Language")).toBeInTheDocument();
  });

  it("renders a Display Language label", () => {
    renderWithPreferences(
      preferenceStore,
      <SettingsGeneral
        settings={defaultGeneralSettings}
        showAiMarks={false}
        onShowAiMarksChange={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Display Language")).toBeInTheDocument();
  });

  it("shows default language when no preference stored", () => {
    renderWithPreferences(
      preferenceStore,
      <SettingsGeneral
        settings={defaultGeneralSettings}
        showAiMarks={false}
        onShowAiMarksChange={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    // Default is zh-CN, so it should render the Chinese label
    expect(screen.getByText("Chinese (Simplified)")).toBeInTheDocument();
  });
});
