import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SaveIndicator } from "./SaveIndicator";

describe("SaveIndicator aria-live (WB-FE-ARIA-S4)", () => {
  it("保存状态指示器应包含 aria-live='polite'", () => {
    render(<SaveIndicator autosaveStatus="idle" onRetry={vi.fn()} />);

    const indicator = screen.getByTestId("editor-autosave-status");
    expect(indicator).toHaveAttribute("aria-live", "polite");
  });

  it("error 状态应含 role='button' 和 aria-label", () => {
    render(<SaveIndicator autosaveStatus="error" onRetry={vi.fn()} />);

    const indicator = screen.getByTestId("editor-autosave-status");
    expect(indicator).toHaveAttribute("role", "button");
    expect(indicator).toHaveAttribute("aria-label");
  });

  it("非 error 状态应含 role='status'", () => {
    render(<SaveIndicator autosaveStatus="saving" onRetry={vi.fn()} />);

    const indicator = screen.getByTestId("editor-autosave-status");
    expect(indicator).toHaveAttribute("role", "status");
  });
});
