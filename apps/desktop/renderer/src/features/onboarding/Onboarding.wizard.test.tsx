import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../i18n/languagePreference", () => ({
  getLanguagePreference: vi.fn(() => "zh-CN"),
  setLanguagePreference: vi.fn(),
}));

vi.mock("../../i18n", () => ({
  i18n: { changeLanguage: vi.fn(() => Promise.resolve()) },
}));

vi.mock("../../lib/ipcClient", () => ({
  invoke: vi.fn(() => Promise.resolve({ ok: true })),
}));

import { OnboardingPage } from "./OnboardingPage";
import { setLanguagePreference } from "../../i18n/languagePreference";
import { i18n } from "../../i18n";

describe("OnboardingPage wizard flow", () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders step 1 (language selection) by default", () => {
    render(<OnboardingPage onComplete={onComplete} />);
    expect(screen.getByTestId("onboarding-step-1")).toBeInTheDocument();
    expect(
      screen.getByTestId("onboarding-language-select"),
    ).toBeInTheDocument();
  });

  it("persists language selection on step 1", () => {
    render(<OnboardingPage onComplete={onComplete} />);

    const englishOption = screen.getByText("English");
    fireEvent.click(englishOption);

    expect(setLanguagePreference).toHaveBeenCalledWith("en");
    expect(i18n.changeLanguage).toHaveBeenCalledWith("en");
  });

  it("advances from step 1 to step 2", () => {
    render(<OnboardingPage onComplete={onComplete} />);

    const nextBtn = screen.getByTestId("onboarding-next");
    fireEvent.click(nextBtn);

    expect(screen.getByTestId("onboarding-step-2")).toBeInTheDocument();
  });

  it("renders AI config step with skip option in step 2", () => {
    render(<OnboardingPage onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId("onboarding-next"));

    expect(screen.getByTestId("onboarding-step-2")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-ai-skip")).toBeInTheDocument();
  });

  it("skip in step 2 advances to step 3", () => {
    render(<OnboardingPage onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId("onboarding-next"));
    fireEvent.click(screen.getByTestId("onboarding-ai-skip"));

    expect(screen.getByTestId("onboarding-step-3")).toBeInTheDocument();
  });

  it("renders open folder button in step 3", () => {
    render(<OnboardingPage onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId("onboarding-next"));
    fireEvent.click(screen.getByTestId("onboarding-ai-skip"));

    expect(screen.getByTestId("onboarding-open-folder")).toBeInTheDocument();
  });

  it("calls onComplete when skipping folder in step 3", () => {
    render(<OnboardingPage onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId("onboarding-next"));
    fireEvent.click(screen.getByTestId("onboarding-ai-skip"));

    fireEvent.click(screen.getByTestId("onboarding-skip-folder"));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("back button returns to previous step", () => {
    render(<OnboardingPage onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId("onboarding-next"));
    expect(screen.getByTestId("onboarding-step-2")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("onboarding-back"));
    expect(screen.getByTestId("onboarding-step-1")).toBeInTheDocument();
  });

  it("back button on step 3 returns to step 2", () => {
    render(<OnboardingPage onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId("onboarding-next"));
    fireEvent.click(screen.getByTestId("onboarding-ai-skip"));
    expect(screen.getByTestId("onboarding-step-3")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("onboarding-back"));
    expect(screen.getByTestId("onboarding-step-2")).toBeInTheDocument();
  });

  it("renders step indicator", () => {
    render(<OnboardingPage onComplete={onComplete} />);
    expect(screen.getByTestId("onboarding-step-indicator")).toBeInTheDocument();
  });

  it("does not render back button on step 1", () => {
    render(<OnboardingPage onComplete={onComplete} />);
    expect(screen.queryByTestId("onboarding-back")).not.toBeInTheDocument();
  });
});
