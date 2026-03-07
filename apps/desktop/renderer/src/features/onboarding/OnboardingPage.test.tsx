import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the onboarding shell and starts on step 1", () => {
    const onComplete = vi.fn();
    render(<OnboardingPage onComplete={onComplete} />);

    expect(screen.getByTestId("onboarding-page")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-logo")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-step-1")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-next")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-step-indicator")).toBeInTheDocument();
  });

  it("persists language selection when a language option is clicked", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OnboardingPage onComplete={onComplete} />);

    await user.click(screen.getByTestId("onboarding-lang-en"));

    expect(setLanguagePreference).toHaveBeenCalledWith("en");
    expect(i18n.changeLanguage).toHaveBeenCalledWith("en");
  });

  it("advances from step 1 to step 2 when next is clicked", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OnboardingPage onComplete={onComplete} />);

    await user.click(screen.getByTestId("onboarding-next"));

    expect(screen.getByTestId("onboarding-step-2")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-ai-skip")).toBeInTheDocument();
  });
});
