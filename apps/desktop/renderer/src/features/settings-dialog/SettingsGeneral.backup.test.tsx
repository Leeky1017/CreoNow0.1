import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../i18n/languagePreference", () => ({
  getLanguagePreference: vi.fn(() => "en"),
  setLanguagePreference: vi.fn(),
}));

vi.mock("../../i18n", () => ({
  i18n: { changeLanguage: vi.fn(() => Promise.resolve()) },
}));

import { SettingsGeneral, defaultGeneralSettings } from "./SettingsGeneral";

import enLocale from "../../i18n/locales/en.json";
import zhCNLocale from "../../i18n/locales/zh-CN.json";

function renderSettingsGeneral() {
  return render(
    <SettingsGeneral
      settings={defaultGeneralSettings}
      showAiMarks={false}
      onShowAiMarksChange={vi.fn()}
      onSettingsChange={vi.fn()}
    />,
  );
}

describe("SettingsGeneral backup entry hidden (A0-17)", () => {
  it("does not render backup interval selector", () => {
    renderSettingsGeneral();

    expect(screen.queryByLabelText(/backup interval/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/备份间隔/i)).not.toBeInTheDocument();
  });

  it("does not render backup-related text in the DOM", () => {
    renderSettingsGeneral();

    expect(screen.queryByText(/backup interval/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/备份间隔/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/last backup/i)).not.toBeInTheDocument();
  });

  it("does not render a select with backup interval options", () => {
    renderSettingsGeneral();

    expect(screen.queryByText("Every 5 minutes")).not.toBeInTheDocument();
    expect(screen.queryByText("Every 15 minutes")).not.toBeInTheDocument();
    expect(screen.queryByText("Every hour")).not.toBeInTheDocument();
  });

  it("still renders Data & Storage section (auto-save remains)", () => {
    renderSettingsGeneral();

    expect(screen.getByText("Data & Storage")).toBeInTheDocument();
  });
});

describe("i18n backup keys preserved for future use", () => {
  it("en locale retains backupInterval key", () => {
    expect(enLocale.settings.general.backupInterval).toBe("Backup Interval");
  });

  it("en locale retains backupIntervalHelp key", () => {
    expect(enLocale.settings.general.backupIntervalHelp).toBe(
      "Last backup: 2 minutes ago",
    );
  });

  it("zh-CN locale retains backupInterval key", () => {
    expect(zhCNLocale.settings.general.backupInterval).toBe("备份间隔");
  });

  it("zh-CN locale retains backupIntervalHelp key", () => {
    expect(zhCNLocale.settings.general.backupIntervalHelp).toBe(
      "上次备份：2 分钟前",
    );
  });
});
