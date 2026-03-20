import type React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// =============================================================================
// Mock 设置
// =============================================================================

vi.mock("../../i18n/languagePreference", () => ({
  getLanguagePreference: vi.fn(() => "zh-CN"),
  setLanguagePreference: vi.fn(),
}));

vi.mock("../../i18n", () => ({
  i18n: { changeLanguage: vi.fn(() => Promise.resolve()) },
}));

import { SettingsGeneral, defaultGeneralSettings } from "./SettingsGeneral";

function renderSettingsGeneral(
  overrides?: Partial<React.ComponentProps<typeof SettingsGeneral>>,
) {
  return render(
    <SettingsGeneral
      settings={defaultGeneralSettings}
      showAiMarks={false}
      onShowAiMarksChange={vi.fn()}
      onSettingsChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("SettingsGeneral 语言设置", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // 渲染 — 语言区域结构
  // ===========================================================================
  describe("渲染", () => {
    it("显示 Language 区域标题", () => {
      renderSettingsGeneral();

      expect(screen.getByText("Language")).toBeInTheDocument();
    });

    it("显示 Display Language 标签", () => {
      renderSettingsGeneral();

      expect(screen.getByText("Display Language")).toBeInTheDocument();
    });

    it("当前语言偏好为 zh-CN 时显示 Chinese (Simplified)", () => {
      renderSettingsGeneral();

      expect(screen.getByText("Chinese (Simplified)")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 交互 — 语言切换
  // ===========================================================================
  describe("交互", () => {
    it("切换语言触发器呈现为可交互的 combobox", () => {
      renderSettingsGeneral();

      // The language selector is the first combobox in the component.
      // We verify it is interactive and shows current language.
      const selects = screen.getAllByRole("combobox");
      expect(selects[0]).toBeInTheDocument();
      expect(selects[0]).not.toBeDisabled();
    });
  });
});
