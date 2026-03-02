import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../i18n/languagePreference", () => ({
  getLanguagePreference: vi.fn(() => "zh-CN"),
  setLanguagePreference: vi.fn(),
}));

vi.mock("../../i18n", () => ({
  i18n: { changeLanguage: vi.fn(() => Promise.resolve()) },
}));

import {
  SettingsGeneral,
  defaultGeneralSettings,
} from "./SettingsGeneral";

describe("SettingsGeneral language selector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a Language section heading", () => {
    render(
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
    render(
      <SettingsGeneral
        settings={defaultGeneralSettings}
        showAiMarks={false}
        onShowAiMarksChange={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Display Language")).toBeInTheDocument();
  });

  it("shows current language preference as default", () => {
    render(
      <SettingsGeneral
        settings={defaultGeneralSettings}
        showAiMarks={false}
        onShowAiMarksChange={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    // getLanguagePreference mock returns "zh-CN", so the Select should
    // display the matching label from languageOptions.
    expect(screen.getByText("中文 (简体)")).toBeInTheDocument();
  });
});
