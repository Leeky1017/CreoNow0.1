import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  SettingsAppearancePage,
  type AppearanceSettings,
} from "../SettingsAppearancePage";

// ── i18n mock ──────────────────────────────────────────────────────
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// ── Helpers ────────────────────────────────────────────────────────

function createSettings(
  overrides: Partial<AppearanceSettings> = {},
): AppearanceSettings {
  return {
    themeMode: "dark",
    accentColor: "#3b82f6",
    fontSize: 16,
    ...overrides,
  };
}

function renderPage(
  settings: AppearanceSettings = createSettings(),
  onChange = vi.fn(),
) {
  return {
    ...render(
      <SettingsAppearancePage settings={settings} onSettingsChange={onChange} />,
    ),
    onChange,
  };
}

// ── Primary Proof: Theme Selection ─────────────────────────────────

describe("SettingsAppearancePage — theme selection", () => {
  it("renders three theme options: light, dark, system", () => {
    renderPage();
    // Theme buttons contain preview + label text
    expect(
      screen.getByText("settingsDialog.appearance.themeLight"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("settingsDialog.appearance.themeDark"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("settingsDialog.appearance.themeSystem"),
    ).toBeInTheDocument();
  });

  it("calls onSettingsChange with selected theme when theme button is clicked", async () => {
    const user = userEvent.setup();
    const settings = createSettings({ themeMode: "dark" });
    const { onChange } = renderPage(settings);

    await user.click(
      screen.getByText("settingsDialog.appearance.themeLight"),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ themeMode: "light" }),
    );
  });
});

// ── Primary Proof: Accent Color Selection ──────────────────────────

describe("SettingsAppearancePage — accent color selection", () => {
  it("renders 6 accent color swatches", () => {
    renderPage();
    const swatches = screen.getAllByRole("button").filter((btn) =>
      btn.getAttribute("aria-label")?.includes("settingsDialog.appearance.selectAccentColor"),
    );
    expect(swatches).toHaveLength(6);
  });

  it("calls onSettingsChange with new accent color when swatch is clicked", async () => {
    const user = userEvent.setup();
    const settings = createSettings({ accentColor: "#ffffff" });
    const { onChange } = renderPage(settings);

    // All accent swatches share the same aria-label (mock t returns key as-is)
    const swatches = screen.getAllByLabelText(
      "settingsDialog.appearance.selectAccentColor",
    );
    // Click the second swatch (blue)
    await user.click(swatches[1]);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ accentColor: "#3b82f6" }),
    );
  });

  it("marks the currently selected accent color with a ring", () => {
    renderPage(createSettings({ accentColor: "#3b82f6" }));
    const swatches = screen.getAllByLabelText(
      "settingsDialog.appearance.selectAccentColor",
    );
    // The second swatch (blue) should have the selection ring
    expect(swatches[1].className).toContain("ring-2");
  });
});

// ── Primary Proof: Font Size Slider ────────────────────────────────

describe("SettingsAppearancePage — font size slider", () => {
  it("displays current font size value", () => {
    renderPage(createSettings({ fontSize: 18 }));
    // The component shows the font size in "settingsDialog.appearance.fontSizePx" format
    expect(
      screen.getByText("settingsDialog.appearance.fontSizePx"),
    ).toBeInTheDocument();
  });

  it("renders font size section with label", () => {
    renderPage();
    expect(
      screen.getByText("settingsDialog.appearance.fontSize"),
    ).toBeInTheDocument();
  });

  it("renders step marks below the slider (AC-6)", () => {
    renderPage();
    // Step marks should show min and max at least
    expect(screen.getByText("12px")).toBeInTheDocument();
    expect(screen.getByText("24px")).toBeInTheDocument();
  });
});

// ── Primary Proof: Section Headers ─────────────────────────────────

describe("SettingsAppearancePage — section headers (AC-4)", () => {
  it("renders theme section header", () => {
    renderPage();
    expect(
      screen.getByText("settingsDialog.appearance.theme"),
    ).toBeInTheDocument();
  });

  it("renders accent color section header", () => {
    renderPage();
    expect(
      screen.getByText("settingsDialog.appearance.accentColor"),
    ).toBeInTheDocument();
  });

  it("renders font size section header", () => {
    renderPage();
    expect(
      screen.getByText("settingsDialog.appearance.fontSize"),
    ).toBeInTheDocument();
  });

  it("section headers have uppercase text-transform", () => {
    renderPage();
    const themeHeader = screen.getByText(
      "settingsDialog.appearance.theme",
    );
    expect(themeHeader.className).toContain("uppercase");
  });

  it("section headers have letter-spacing", () => {
    renderPage();
    const themeHeader = screen.getByText(
      "settingsDialog.appearance.theme",
    );
    expect(themeHeader.className).toMatch(/tracking-/);
  });
});

// ── Primary Proof: Theme Preview ───────────────────────────────────

describe("SettingsAppearancePage — ThemePreview (AC-3/AC-5)", () => {
  it("renders a theme preview for each theme option", () => {
    renderPage();
    const themeButtons = screen
      .getAllByRole("button")
      .filter(
        (btn) =>
          !btn.getAttribute("aria-label")?.includes("selectAccentColor"),
      );
    expect(themeButtons.length).toBeGreaterThanOrEqual(3);
  });

  it("ThemePreview sets data-theme attribute matching the theme mode", () => {
    renderPage(createSettings({ themeMode: "dark" }));
    const previews = document.querySelectorAll("[data-theme]");
    const themeValues = Array.from(previews).map((el) =>
      el.getAttribute("data-theme"),
    );
    expect(themeValues).toContain("light");
    expect(themeValues).toContain("dark");
  });

  it("selected theme button has distinct visual state vs unselected", () => {
    renderPage(createSettings({ themeMode: "dark" }));
    const darkButton = screen
      .getByText("settingsDialog.appearance.themeDark")
      .closest("button");
    const lightButton = screen
      .getByText("settingsDialog.appearance.themeLight")
      .closest("button");
    expect(darkButton).not.toBeNull();
    expect(lightButton).not.toBeNull();
    expect(darkButton!.className).not.toEqual(lightButton!.className);
  });
});
