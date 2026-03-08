import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

import {
  createPreferenceStore,
  type PreferenceStore,
} from "../../lib/preferences";
import { PreferenceProvider } from "../../lib/PreferenceContext";
import {
  loadGeneralSettings,
  saveGeneralSetting,
} from "./settingsGeneralPersistence";
import {
  SettingsGeneral,
  defaultGeneralSettings,
} from "./SettingsGeneral";

vi.mock("../../i18n", () => ({
  i18n: { changeLanguage: vi.fn(() => Promise.resolve()) },
}));

function createMockStorage(initial?: Record<string, string>): Storage {
  const store = new Map<string, string>(
    initial ? Object.entries(initial) : [],
  );
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
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

describe("loadGeneralSettings", () => {
  it("returns default values when store is empty", () => {
    const store = createPreferenceStore(createMockStorage());
    const settings = loadGeneralSettings(store);
    expect(settings).toEqual(defaultGeneralSettings);
  });

  it("merges stored values with defaults", () => {
    const store = createPreferenceStore(createMockStorage());
    store.set("creonow.settings.focusMode", false);
    store.set("creonow.settings.backupInterval", "1hour");

    const settings = loadGeneralSettings(store);
    expect(settings.focusMode).toBe(false);
    expect(settings.backupInterval).toBe("1hour");
    // Others remain default
    expect(settings.typewriterScroll).toBe(false);
    expect(settings.smartPunctuation).toBe(true);
  });
});

describe("saveGeneralSetting", () => {
  it("persists a single setting to the store", () => {
    const store = createPreferenceStore(createMockStorage());
    saveGeneralSetting(store, "interfaceScale", 120);
    expect(store.get("creonow.settings.interfaceScale")).toBe(120);
  });
});

describe("SettingsGeneral persistence integration", () => {
  let preferenceStore: PreferenceStore;

  beforeEach(() => {
    vi.clearAllMocks();
    preferenceStore = createPreferenceStore(createMockStorage());
  });

  it("AC-3: shows default values when no preferences exist", () => {
    renderWithPreferences(
      preferenceStore,
      <SettingsGeneral
        settings={defaultGeneralSettings}
        showAiMarks={false}
        onShowAiMarksChange={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    // Default language is zh-CN
    expect(screen.getByText("Chinese (Simplified)")).toBeInTheDocument();
  });

  it("AC-4: onSettingsChange propagates toggle interactions", async () => {
    const user = userEvent.setup();
    const onSettingsChange = vi.fn();

    renderWithPreferences(
      preferenceStore,
      <SettingsGeneral
        settings={defaultGeneralSettings}
        showAiMarks={false}
        onShowAiMarksChange={vi.fn()}
        onSettingsChange={onSettingsChange}
      />,
    );

    // Smart Punctuation toggle — default is on, click should turn off
    const toggles = screen.getAllByRole("switch");
    // Find the Smart Punctuation toggle (3rd writing toggle)
    const smartPuncToggle = toggles[2];
    await user.click(smartPuncToggle);

    expect(onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({ smartPunctuation: false }),
    );
  });

  it("AC-5: loads persisted values when preStore has data", () => {
    preferenceStore.set("creonow.settings.focusMode", false);
    preferenceStore.set("creonow.settings.backupInterval", "1hour");

    const loaded = loadGeneralSettings(preferenceStore);
    expect(loaded.focusMode).toBe(false);
    expect(loaded.backupInterval).toBe("1hour");
    // re-opening should retain
    const loaded2 = loadGeneralSettings(preferenceStore);
    expect(loaded2.focusMode).toBe(false);
  });

  it("AC-6: persists language change via PreferenceStore", async () => {
    // Radix Select uses pointer-events:none in jsdom, so disable the check
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    renderWithPreferences(
      preferenceStore,
      <SettingsGeneral
        settings={defaultGeneralSettings}
        showAiMarks={false}
        onShowAiMarksChange={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    // Open language selector and choose English
    const trigger = screen.getByText("Chinese (Simplified)");
    await user.click(trigger);

    const englishOption = await screen.findByText("English");
    await user.click(englishOption);

    expect(preferenceStore.get("creonow.settings.language")).toBe("en");
  });

  it("AC-6: loads persisted language preference", () => {
    preferenceStore.set("creonow.settings.language", "en");

    renderWithPreferences(
      preferenceStore,
      <SettingsGeneral
        settings={defaultGeneralSettings}
        showAiMarks={false}
        onShowAiMarksChange={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("AC-7: falls back to default on corrupted value in storage", () => {
    // Write corrupted JSON directly to the mock storage backing the store
    const storage = createMockStorage({
      "creonow.version": "1",
      "creonow.settings.interfaceScale": "not-valid-json{{{",
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const store = createPreferenceStore(storage);
    const settings = loadGeneralSettings(store);

    // Should fall back to default
    expect(settings.interfaceScale).toBe(100);
    errorSpy.mockRestore();
  });

  it("AC-7: does not throw on corrupted value", () => {
    const storage = createMockStorage({
      "creonow.version": "1",
      "creonow.settings.focusMode": "broken!!!",
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const store = createPreferenceStore(storage);

    expect(() => loadGeneralSettings(store)).not.toThrow();
    errorSpy.mockRestore();
  });

  it("AC-8: SettingsDialog.tsx has no direct localStorage calls", () => {
    const dialogSrc = fs.readFileSync(
      path.resolve(__dirname, "./SettingsDialog.tsx"),
      "utf-8",
    );
    expect(dialogSrc).not.toContain("localStorage.getItem");
    expect(dialogSrc).not.toContain("localStorage.setItem");
  });

  it("AC-8: SettingsGeneral.tsx has no direct localStorage calls", () => {
    const generalSrc = fs.readFileSync(
      path.resolve(__dirname, "./SettingsGeneral.tsx"),
      "utf-8",
    );
    expect(generalSrc).not.toContain("localStorage.getItem");
    expect(generalSrc).not.toContain("localStorage.setItem");
  });
});
