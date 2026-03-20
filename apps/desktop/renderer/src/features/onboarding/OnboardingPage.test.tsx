import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

vi.mock("../../lib/ipcClient", () => ({
  invoke: vi.fn(() => Promise.resolve({ ok: true, data: {} })),
}));

import { OnboardingPage } from "./OnboardingPage";
import { setLanguagePreference } from "../../i18n/languagePreference";
import { i18n } from "../../i18n";
import { invoke } from "../../lib/ipcClient";

describe("OnboardingPage", () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // 渲染 — 初始页面结构
  // ===========================================================================
  describe("渲染", () => {
    it("渲染 onboarding 外壳、Logo 和步骤指示器", () => {
      render(<OnboardingPage onComplete={onComplete} />);

      expect(screen.getByTestId("onboarding-page")).toBeInTheDocument();
      expect(screen.getByTestId("onboarding-logo")).toBeInTheDocument();
      expect(
        screen.getByTestId("onboarding-step-indicator"),
      ).toBeInTheDocument();
    });

    it("默认从 Step 1（语言选择）开始", () => {
      render(<OnboardingPage onComplete={onComplete} />);

      expect(screen.getByTestId("onboarding-step-1")).toBeInTheDocument();
      expect(
        screen.getByTestId("onboarding-language-select"),
      ).toBeInTheDocument();
    });

    it("Step 1 显示 Next 按钮但不显示 Back 按钮", () => {
      render(<OnboardingPage onComplete={onComplete} />);

      expect(screen.getByTestId("onboarding-next")).toBeInTheDocument();
      expect(screen.queryByTestId("onboarding-back")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 步骤导航 — 前进与后退
  // ===========================================================================
  describe("步骤导航", () => {
    it("点击 Next 从 Step 1 前进到 Step 2", async () => {
      const user = userEvent.setup();
      render(<OnboardingPage onComplete={onComplete} />);

      await user.click(screen.getByTestId("onboarding-next"));

      expect(screen.getByTestId("onboarding-step-2")).toBeInTheDocument();
      expect(
        screen.queryByTestId("onboarding-step-1"),
      ).not.toBeInTheDocument();
    });

    it("Step 2 显示 AI 配置内容和 Skip 按钮", async () => {
      const user = userEvent.setup();
      render(<OnboardingPage onComplete={onComplete} />);

      await user.click(screen.getByTestId("onboarding-next"));

      expect(screen.getByTestId("onboarding-step-2")).toBeInTheDocument();
      expect(screen.getByTestId("onboarding-ai-skip")).toBeInTheDocument();
    });

    it("Step 2 点击 Skip 前进到 Step 3", async () => {
      const user = userEvent.setup();
      render(<OnboardingPage onComplete={onComplete} />);

      await user.click(screen.getByTestId("onboarding-next"));
      await user.click(screen.getByTestId("onboarding-ai-skip"));

      expect(screen.getByTestId("onboarding-step-3")).toBeInTheDocument();
    });

    it("Step 3 显示打开文件夹按钮和跳过按钮", async () => {
      const user = userEvent.setup();
      render(<OnboardingPage onComplete={onComplete} />);

      await user.click(screen.getByTestId("onboarding-next"));
      await user.click(screen.getByTestId("onboarding-ai-skip"));

      expect(screen.getByTestId("onboarding-open-folder")).toBeInTheDocument();
      expect(screen.getByTestId("onboarding-skip-folder")).toBeInTheDocument();
    });

    it("Step 2 点击 Back 返回 Step 1", async () => {
      const user = userEvent.setup();
      render(<OnboardingPage onComplete={onComplete} />);

      await user.click(screen.getByTestId("onboarding-next"));
      expect(screen.getByTestId("onboarding-step-2")).toBeInTheDocument();

      await user.click(screen.getByTestId("onboarding-back"));
      expect(screen.getByTestId("onboarding-step-1")).toBeInTheDocument();
    });

    it("Step 3 点击 Back 返回 Step 2", async () => {
      const user = userEvent.setup();
      render(<OnboardingPage onComplete={onComplete} />);

      await user.click(screen.getByTestId("onboarding-next"));
      await user.click(screen.getByTestId("onboarding-ai-skip"));
      expect(screen.getByTestId("onboarding-step-3")).toBeInTheDocument();

      await user.click(screen.getByTestId("onboarding-back"));
      expect(screen.getByTestId("onboarding-step-2")).toBeInTheDocument();
    });

    it("Step 2+ 显示 Back 按钮", async () => {
      const user = userEvent.setup();
      render(<OnboardingPage onComplete={onComplete} />);

      await user.click(screen.getByTestId("onboarding-next"));
      expect(screen.getByTestId("onboarding-back")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 语言选择 — 持久化与 i18n 切换
  // ===========================================================================
  describe("语言选择", () => {
    it("点击语言选项调用 setLanguagePreference 和 i18n.changeLanguage", async () => {
      const user = userEvent.setup();
      render(<OnboardingPage onComplete={onComplete} />);

      await user.click(screen.getByTestId("onboarding-lang-en"));

      expect(setLanguagePreference).toHaveBeenCalledWith("en");
      expect(i18n.changeLanguage).toHaveBeenCalledWith("en");
    });

    it("点击中文语言选项设置 zh-CN", async () => {
      const user = userEvent.setup();
      render(<OnboardingPage onComplete={onComplete} />);

      await user.click(screen.getByTestId("onboarding-lang-zh-CN"));

      expect(setLanguagePreference).toHaveBeenCalledWith("zh-CN");
      expect(i18n.changeLanguage).toHaveBeenCalledWith("zh-CN");
    });
  });

  // ===========================================================================
  // 完成 — onComplete 回调
  // ===========================================================================
  describe("完成", () => {
    it("Step 3 点击跳过文件夹按钮触发 onComplete", async () => {
      const user = userEvent.setup();
      render(<OnboardingPage onComplete={onComplete} />);

      await user.click(screen.getByTestId("onboarding-next"));
      await user.click(screen.getByTestId("onboarding-ai-skip"));
      await user.click(screen.getByTestId("onboarding-skip-folder"));

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("打开文件夹并选中路径后触发 onComplete", async () => {
      const user = userEvent.setup();
      vi.mocked(invoke).mockResolvedValueOnce({
        ok: true,
        data: { selectedPath: "/home/user/projects" },
      });

      render(<OnboardingPage onComplete={onComplete} />);

      await user.click(screen.getByTestId("onboarding-next"));
      await user.click(screen.getByTestId("onboarding-ai-skip"));
      await user.click(screen.getByTestId("onboarding-open-folder"));

      expect(invoke).toHaveBeenCalledWith("dialog:folder:open", {});
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("打开文件夹对话框取消后不触发 onComplete", async () => {
      const user = userEvent.setup();
      vi.mocked(invoke).mockResolvedValueOnce({
        ok: true,
        data: {},
      });

      render(<OnboardingPage onComplete={onComplete} />);

      await user.click(screen.getByTestId("onboarding-next"));
      await user.click(screen.getByTestId("onboarding-ai-skip"));
      await user.click(screen.getByTestId("onboarding-open-folder"));

      expect(invoke).toHaveBeenCalledWith("dialog:folder:open", {});
      expect(onComplete).not.toHaveBeenCalled();
    });
  });
});
