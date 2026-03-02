import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../../i18n/languagePreference", () => ({
  getLanguagePreference: vi.fn(() => "zh-CN"),
  setLanguagePreference: vi.fn(),
}));

vi.mock("../../i18n", () => ({
  i18n: { changeLanguage: vi.fn(() => Promise.resolve()) },
}));

const mockInvoke = vi.fn();
vi.mock("../../lib/ipcClient", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

import { OnboardingPage } from "./OnboardingPage";

/** Navigate from step 1 to step 3 (open folder step) */
function navigateToStep3(): void {
  fireEvent.click(screen.getByTestId("onboarding-next")); // step 1 → 2
  fireEvent.click(screen.getByTestId("onboarding-ai-skip")); // step 2 → 3
}

describe("Onboarding Open Folder Entry Point", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue({
      ok: true,
      data: { selectedPath: "/home/user/project" },
    });
  });

  // WB-FE-OPENF-UI-S1: Open Folder button exists in onboarding (step 3)
  it("renders open folder button in onboarding step 3", () => {
    render(<OnboardingPage onComplete={vi.fn()} />);
    navigateToStep3();

    expect(screen.getByTestId("onboarding-open-folder")).toBeInTheDocument();
  });

  // WB-FE-OPENF-UI-S1b: Click triggers dialog:folder:open IPC
  it("calls dialog:folder:open IPC on click", async () => {
    render(<OnboardingPage onComplete={vi.fn()} />);
    navigateToStep3();

    await userEvent.click(screen.getByTestId("onboarding-open-folder"));

    expect(mockInvoke).toHaveBeenCalledWith("dialog:folder:open", {});
  });

  // Cancelled dialog should NOT complete onboarding
  it("does NOT call onComplete when folder dialog is cancelled", async () => {
    const onComplete = vi.fn();
    mockInvoke.mockResolvedValue({
      ok: true,
      data: {},
    });

    render(<OnboardingPage onComplete={onComplete} />);
    navigateToStep3();

    await userEvent.click(screen.getByTestId("onboarding-open-folder"));

    expect(mockInvoke).toHaveBeenCalledWith("dialog:folder:open", {});
    expect(onComplete).not.toHaveBeenCalled();
  });

  // IPC error should NOT complete onboarding
  it("does NOT call onComplete when folder dialog errors", async () => {
    const onComplete = vi.fn();
    mockInvoke.mockResolvedValue({
      ok: false,
      error: { code: "CANCELED", message: "cancelled" },
    });

    render(<OnboardingPage onComplete={onComplete} />);
    navigateToStep3();

    await userEvent.click(screen.getByTestId("onboarding-open-folder"));

    expect(onComplete).not.toHaveBeenCalled();
  });
});
