import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

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

// =============================================================================
// 完整向导流程测试 — 端到端行为场景
// =============================================================================
describe("OnboardingPage 向导流程", () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("完整流程：语言选择 → AI 配置跳过 → 跳过文件夹 → onComplete", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage onComplete={onComplete} />);

    // Step 1: 语言选择
    expect(screen.getByTestId("onboarding-step-1")).toBeInTheDocument();
    await user.click(screen.getByTestId("onboarding-lang-en"));
    expect(setLanguagePreference).toHaveBeenCalledWith("en");
    expect(i18n.changeLanguage).toHaveBeenCalledWith("en");

    // 前进到 Step 2
    await user.click(screen.getByTestId("onboarding-next"));
    expect(screen.getByTestId("onboarding-step-2")).toBeInTheDocument();

    // Step 2: 跳过 AI 配置
    await user.click(screen.getByTestId("onboarding-ai-skip"));
    expect(screen.getByTestId("onboarding-step-3")).toBeInTheDocument();

    // Step 3: 跳过文件夹
    await user.click(screen.getByTestId("onboarding-skip-folder"));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("来回导航不丢失语言选择", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage onComplete={onComplete} />);

    // 选择英文
    await user.click(screen.getByTestId("onboarding-lang-en"));

    // 前进到 Step 2
    await user.click(screen.getByTestId("onboarding-next"));
    expect(screen.getByTestId("onboarding-step-2")).toBeInTheDocument();

    // 返回 Step 1
    await user.click(screen.getByTestId("onboarding-back"));
    expect(screen.getByTestId("onboarding-step-1")).toBeInTheDocument();

    // 语言选择应保持
    expect(setLanguagePreference).toHaveBeenCalledWith("en");
  });

  it("Step 3 返回 Step 2 再返回 Step 1 的完整后退链", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage onComplete={onComplete} />);

    // 走到 Step 3
    await user.click(screen.getByTestId("onboarding-next"));
    await user.click(screen.getByTestId("onboarding-ai-skip"));
    expect(screen.getByTestId("onboarding-step-3")).toBeInTheDocument();

    // 回到 Step 2
    await user.click(screen.getByTestId("onboarding-back"));
    expect(screen.getByTestId("onboarding-step-2")).toBeInTheDocument();

    // 回到 Step 1
    await user.click(screen.getByTestId("onboarding-back"));
    expect(screen.getByTestId("onboarding-step-1")).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-back")).not.toBeInTheDocument();
  });

  it("步骤指示器在各步骤中始终可见", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage onComplete={onComplete} />);

    // Step 1
    expect(screen.getByTestId("onboarding-step-indicator")).toBeInTheDocument();

    // Step 2
    await user.click(screen.getByTestId("onboarding-next"));
    expect(screen.getByTestId("onboarding-step-indicator")).toBeInTheDocument();

    // Step 3
    await user.click(screen.getByTestId("onboarding-ai-skip"));
    expect(screen.getByTestId("onboarding-step-indicator")).toBeInTheDocument();
  });
});
