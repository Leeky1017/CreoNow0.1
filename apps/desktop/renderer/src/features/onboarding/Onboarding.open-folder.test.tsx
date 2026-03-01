import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OnboardingPage } from "./OnboardingPage";

const mockInvoke = vi.fn();
vi.mock("../../lib/ipcClient", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

describe("Onboarding Open Folder Entry Point", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue({
      ok: true,
      data: { selectedPath: "/home/user/project" },
    });
  });

  // WB-FE-OPENF-UI-S1: Open Folder button exists in onboarding
  it("renders open folder button in onboarding", () => {
    render(<OnboardingPage onComplete={vi.fn()} />);

    expect(screen.getByTestId("onboarding-open-folder")).toBeInTheDocument();
  });

  // WB-FE-OPENF-UI-S1b: Click triggers dialog:folder:open IPC
  it("calls dialog:folder:open IPC on click", async () => {
    render(<OnboardingPage onComplete={vi.fn()} />);

    await userEvent.click(screen.getByTestId("onboarding-open-folder"));

    expect(mockInvoke).toHaveBeenCalledWith("dialog:folder:open", {});
  });
});
