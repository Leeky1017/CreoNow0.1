import type React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// =============================================================================
// Mock 设置
// =============================================================================

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

function renderSettingsGeneral(
  overrides?: Partial<React.ComponentProps<typeof SettingsGeneral>>,
) {
  const props = {
    settings: defaultGeneralSettings,
    showAiMarks: false,
    onShowAiMarksChange: vi.fn(),
    onSettingsChange: vi.fn(),
    onManualBackup: vi.fn(),
    onManualRestore: vi.fn(),
    ...overrides,
  };
  return { ...render(<SettingsGeneral {...props} />), props };
}

// =============================================================================
// 数据与存储 — 备份设置区域
// =============================================================================
describe("SettingsGeneral 数据与存储", () => {
  describe("渲染", () => {
    it("显示 Data & Storage 区域标题", () => {
      renderSettingsGeneral();

      expect(screen.getByText("Data & Storage")).toBeInTheDocument();
    });

    it("显示备份间隔标签", () => {
      renderSettingsGeneral();

      expect(screen.getByText("Backup Interval")).toBeInTheDocument();
    });

    it("显示手动备份和恢复按钮", () => {
      renderSettingsGeneral();

      expect(
        screen.getByRole("button", { name: "Backup Now" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Restore Latest" }),
      ).toBeInTheDocument();
    });

    it("显示自动保存开关", () => {
      renderSettingsGeneral();

      expect(screen.getByText("Local Auto-Save")).toBeInTheDocument();
    });
  });

  describe("交互", () => {
    it("点击 Backup Now 调用 onManualBackup 回调", async () => {
      const user = userEvent.setup();
      const onManualBackup = vi.fn();
      renderSettingsGeneral({ onManualBackup });

      await user.click(screen.getByRole("button", { name: "Backup Now" }));

      expect(onManualBackup).toHaveBeenCalledTimes(1);
    });

    it("点击 Restore Latest 调用 onManualRestore 回调", async () => {
      const user = userEvent.setup();
      const onManualRestore = vi.fn();
      renderSettingsGeneral({ onManualRestore });

      await user.click(screen.getByRole("button", { name: "Restore Latest" }));

      expect(onManualRestore).toHaveBeenCalledTimes(1);
    });

    it("backupActionsDisabled 为 true 时备份按钮禁用", () => {
      renderSettingsGeneral({ backupActionsDisabled: true });

      expect(screen.getByRole("button", { name: "Backup Now" })).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Restore Latest" }),
      ).toBeDisabled();
    });
  });
});

// =============================================================================
// 写作体验 — Toggle 开关区域
// =============================================================================
describe("SettingsGeneral 写作体验", () => {
  it("显示三个写作体验开关标签", () => {
    renderSettingsGeneral();

    expect(screen.getByText("Focus Mode")).toBeInTheDocument();
    expect(screen.getByText("Typewriter Scroll")).toBeInTheDocument();
    expect(screen.getByText("Smart Punctuation")).toBeInTheDocument();
  });

  it("点击 Toggle 调用 onSettingsChange 并传递更新后的设置", async () => {
    const user = userEvent.setup();
    const onSettingsChange = vi.fn();
    renderSettingsGeneral({ onSettingsChange });

    const switches = screen.getAllByRole("switch");
    // Focus Mode is the first switch and is checked by default
    await user.click(switches[0]);

    expect(onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({ focusMode: false }),
    );
  });
});

// =============================================================================
// 编辑器默认值 — AI 标记、字体、缩放
// =============================================================================
describe("SettingsGeneral 编辑器默认值", () => {
  it("显示 Editor Defaults 区域标题", () => {
    renderSettingsGeneral();

    expect(screen.getByText("Editor Defaults")).toBeInTheDocument();
  });

  it("显示 AI 编辑标记开关", () => {
    renderSettingsGeneral();

    expect(screen.getByText("Differentiate AI edits")).toBeInTheDocument();
  });

  it("点击 AI 编辑标记开关调用 onShowAiMarksChange", async () => {
    const user = userEvent.setup();
    const onShowAiMarksChange = vi.fn();
    renderSettingsGeneral({ onShowAiMarksChange });

    // AI marks toggle — find by its label text
    const switches = screen.getAllByRole("switch");
    // Last switch in the list (after focusMode, typewriterScroll, smartPunctuation, localAutoSave)
    const aiMarksSwitch = switches[switches.length - 1];
    await user.click(aiMarksSwitch);

    expect(onShowAiMarksChange).toHaveBeenCalledWith(true);
  });

  it("显示字体选择和界面缩放控件", () => {
    renderSettingsGeneral();

    expect(screen.getByText("Default Typography")).toBeInTheDocument();
    expect(screen.getByText("Interface Scale")).toBeInTheDocument();
  });

  it("界面缩放滑块存在且可用", () => {
    renderSettingsGeneral();

    expect(screen.getByRole("slider")).toBeInTheDocument();
  });
});

// =============================================================================
// 国际化键值 — 确保 locale 文件包含所有备份相关键
// =============================================================================
describe("i18n 备份键值完整性", () => {
  it("en locale 包含备份间隔相关键", () => {
    expect(enLocale.settings.general.backupInterval).toBe("Backup Interval");
    expect(enLocale.settings.general.backupIntervalHelp).toBe(
      "Last backup: 2 minutes ago",
    );
    expect(enLocale.settings.general.backupOption_5min).toBe("Every 5 minutes");
    expect(enLocale.settings.general.backupOption_15min).toBe(
      "Every 15 minutes",
    );
    expect(enLocale.settings.general.backupOption_1hour).toBe("Every hour");
  });

  it("en locale 包含手动备份相关键", () => {
    expect(enLocale.settings.general.manualBackup).toBe(
      "Manual Backup & Restore",
    );
    expect(enLocale.settings.general.backupNow).toBe("Backup Now");
    expect(enLocale.settings.general.restoreLatest).toBe("Restore Latest");
  });

  it("zh-CN locale 包含备份间隔相关键", () => {
    expect(zhCNLocale.settings.general.backupInterval).toBe("备份间隔");
    expect(zhCNLocale.settings.general.backupIntervalHelp).toBe(
      "上次备份：2 分钟前",
    );
    expect(zhCNLocale.settings.general.backupOption_5min).toBe("每 5 分钟");
    expect(zhCNLocale.settings.general.backupOption_15min).toBe("每 15 分钟");
    expect(zhCNLocale.settings.general.backupOption_1hour).toBe("每小时");
  });

  it("zh-CN locale 包含手动备份相关键", () => {
    expect(zhCNLocale.settings.general.manualBackup).toBe("手动备份与恢复");
    expect(zhCNLocale.settings.general.backupNow).toBe("立即备份");
    expect(zhCNLocale.settings.general.restoreLatest).toBe("恢复最近备份");
  });
});
