import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

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

describe("OnboardingPage", () => {
  it("renders the onboarding page with logo and title", () => {
    const onComplete = vi.fn();
    render(<OnboardingPage onComplete={onComplete} />);

    expect(screen.getByTestId("onboarding-page")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-logo")).toBeInTheDocument();
    expect(screen.getByText("Welcome to CreoNow")).toBeInTheDocument();
  });

  it("starts on step 1 by default", () => {
    const onComplete = vi.fn();
    render(<OnboardingPage onComplete={onComplete} />);

    expect(screen.getByTestId("onboarding-step-1")).toBeInTheDocument();
  });

  it("renders step indicator", () => {
    const onComplete = vi.fn();
    render(<OnboardingPage onComplete={onComplete} />);

    expect(screen.getByTestId("onboarding-step-indicator")).toBeInTheDocument();
  });
});
