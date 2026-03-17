import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

function renderSettingsGeneral(overrides?: {
  onManualBackup?: () => void;
  onManualRestore?: () => void;
}) {
  return render(
    <SettingsGeneral
      settings={defaultGeneralSettings}
      showAiMarks={false}
      onShowAiMarksChange={vi.fn()}
      onSettingsChange={vi.fn()}
      onManualBackup={overrides?.onManualBackup}
      onManualRestore={overrides?.onManualRestore}
    />,
  );
}

describe("SettingsGeneral backup interval visible", () => {
  it("renders backup interval label", () => {
    renderSettingsGeneral();

    expect(screen.getByText("Backup Interval")).toBeInTheDocument();
  });

  it("renders Data & Storage section", () => {
    renderSettingsGeneral();

    expect(screen.getByText("Data & Storage")).toBeInTheDocument();
  });

  it("renders manual backup and restore action buttons", () => {
    renderSettingsGeneral();

    expect(
      screen.getByRole("button", { name: "Backup Now" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Restore Latest" }),
    ).toBeInTheDocument();
  });

  it("invokes callbacks when backup and restore buttons are clicked", async () => {
    const user = userEvent.setup();
    const onManualBackup = vi.fn();
    const onManualRestore = vi.fn();
    renderSettingsGeneral({ onManualBackup, onManualRestore });

    await user.click(screen.getByRole("button", { name: "Backup Now" }));
    await user.click(screen.getByRole("button", { name: "Restore Latest" }));

    expect(onManualBackup).toHaveBeenCalledTimes(1);
    expect(onManualRestore).toHaveBeenCalledTimes(1);
  });
});

describe("i18n backup keys", () => {
  it("en locale has backupInterval key", () => {
    expect(enLocale.settings.general.backupInterval).toBe("Backup Interval");
  });

  it("en locale has backupIntervalHelp key", () => {
    expect(enLocale.settings.general.backupIntervalHelp).toBe(
      "Last backup: 2 minutes ago",
    );
  });

  it("en locale has backup option keys", () => {
    expect(enLocale.settings.general.backupOption_5min).toBe("Every 5 minutes");
    expect(enLocale.settings.general.backupOption_15min).toBe(
      "Every 15 minutes",
    );
    expect(enLocale.settings.general.backupOption_1hour).toBe("Every hour");
  });

  it("en locale has manual backup keys", () => {
    expect(enLocale.settings.general.manualBackup).toBe(
      "Manual Backup & Restore",
    );
    expect(enLocale.settings.general.backupNow).toBe("Backup Now");
    expect(enLocale.settings.general.restoreLatest).toBe("Restore Latest");
  });

  it("zh-CN locale has backupInterval key", () => {
    expect(zhCNLocale.settings.general.backupInterval).toBe("备份间隔");
  });

  it("zh-CN locale has backupIntervalHelp key", () => {
    expect(zhCNLocale.settings.general.backupIntervalHelp).toBe(
      "上次备份：2 分钟前",
    );
  });

  it("zh-CN locale has backup option keys", () => {
    expect(zhCNLocale.settings.general.backupOption_5min).toBe("每 5 分钟");
    expect(zhCNLocale.settings.general.backupOption_15min).toBe("每 15 分钟");
    expect(zhCNLocale.settings.general.backupOption_1hour).toBe("每小时");
  });

  it("zh-CN locale has manual backup keys", () => {
    expect(zhCNLocale.settings.general.manualBackup).toBe("手动备份与恢复");
    expect(zhCNLocale.settings.general.backupNow).toBe("立即备份");
    expect(zhCNLocale.settings.general.restoreLatest).toBe("恢复最近备份");
  });
});
