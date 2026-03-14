import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createPreferenceStore } from "../../lib/preferences";
import type { PreferenceStore } from "../../lib/preferences";
import { PreferencesProvider } from "../../contexts/PreferencesContext";
import { AppToastProvider } from "../../components/providers/AppToastProvider";
import { SettingsDialog } from "./SettingsDialog";

vi.mock("./SettingsAccount", () => ({
  SettingsAccount: () => <div data-testid="mock-account-section">Account</div>,
  defaultAccountSettings: {
    name: "Test User",
    email: "test@example.com",
    plan: "free",
  },
}));

vi.mock("../settings/AppearanceSection", () => ({
  AppearanceSection: () => (
    <div data-testid="mock-appearance-section">Appearance</div>
  ),
}));

vi.mock("../settings/AiSettingsSection", () => ({
  AiSettingsSection: () => (
    <div data-testid="mock-ai-settings-section">AI Settings</div>
  ),
}));

vi.mock("../settings/JudgeSection", () => ({
  JudgeSection: () => <div data-testid="mock-judge-section">Judge</div>,
}));

vi.mock("../analytics/AnalyticsPage", () => ({
  AnalyticsPageContent: () => (
    <div data-testid="mock-analytics-content">Analytics</div>
  ),
}));

vi.mock("../../i18n", () => ({
  i18n: { changeLanguage: vi.fn(() => Promise.resolve()) },
}));

function createBrowserPreferences(): PreferenceStore {
  window.localStorage.clear();
  return createPreferenceStore(window.localStorage);
}

function renderWithProviders(ui: JSX.Element, preferences: PreferenceStore) {
  return render(
    <PreferencesProvider value={preferences}>
      <AppToastProvider>{ui}</AppToastProvider>
    </PreferencesProvider>,
  );
}

describe("SettingsDialog — persistence via PreferenceStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("A0-14-PERSIST-01 toggle writes to PreferenceStore", async () => {
    const user = userEvent.setup();
    const preferences = createBrowserPreferences();

    renderWithProviders(
      <SettingsDialog open={true} onOpenChange={vi.fn()} />,
      preferences,
    );

    const focusModeToggle = screen.getByRole("switch", {
      name: /focus mode/i,
    });
    await user.click(focusModeToggle);

    expect(preferences.get<boolean>("creonow.settings.focusMode")).toBe(false);
  });

  it("A0-14-PERSIST-02 reads stored values on open instead of defaults", () => {
    const preferences = createBrowserPreferences();

    preferences.set("creonow.settings.focusMode", false);
    preferences.set("creonow.settings.typewriterScroll", true);

    renderWithProviders(
      <SettingsDialog open={true} onOpenChange={vi.fn()} />,
      preferences,
    );

    const focusModeToggle = screen.getByRole("switch", {
      name: /focus mode/i,
    });
    expect(focusModeToggle).not.toBeChecked();

    const typewriterToggle = screen.getByRole("switch", {
      name: /typewriter scroll/i,
    });
    expect(typewriterToggle).toBeChecked();
  });

  it("A0-14-PERSIST-03 display language reads from the shared PreferenceStore key", () => {
    const preferences = createBrowserPreferences();
    preferences.set("creonow.settings.language", "en");

    renderWithProviders(
      <SettingsDialog open={true} onOpenChange={vi.fn()} />,
      preferences,
    );

    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("A0-14-PERSIST-04 changing language writes back to the shared PreferenceStore key", async () => {
    const user = userEvent.setup();
    const preferences = createBrowserPreferences();

    renderWithProviders(
      <SettingsDialog open={true} onOpenChange={vi.fn()} />,
      preferences,
    );

    const trigger = screen.getAllByRole("combobox")[0];
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "English" }));

    expect(preferences.get<string>("creonow.settings.language")).toBe("en");
  });

  it("A0-14-DEFAULT-02 shows defaults when no stored values exist", () => {
    const preferences = createBrowserPreferences();

    renderWithProviders(
      <SettingsDialog open={true} onOpenChange={vi.fn()} />,
      preferences,
    );

    const focusModeToggle = screen.getByRole("switch", {
      name: /focus mode/i,
    });
    expect(focusModeToggle).toBeChecked();

    const typewriterToggle = screen.getByRole("switch", {
      name: /typewriter scroll/i,
    });
    expect(typewriterToggle).not.toBeChecked();
  });

  it("A0-14-CORRUPT-02 shows defaults when stored values are corrupt", () => {
    const preferences = createBrowserPreferences();

    window.localStorage.setItem("creonow.settings.focusMode", "{bad-json");
    window.localStorage.setItem(
      "creonow.settings.typewriterScroll",
      "not-a-bool",
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithProviders(
      <SettingsDialog open={true} onOpenChange={vi.fn()} />,
      preferences,
    );

    const focusModeToggle = screen.getByRole("switch", {
      name: /focus mode/i,
    });
    expect(focusModeToggle).toBeChecked();

    errorSpy.mockRestore();
  });
});
