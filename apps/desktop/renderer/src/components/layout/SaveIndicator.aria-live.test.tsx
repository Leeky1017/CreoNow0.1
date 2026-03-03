import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SaveIndicator } from "./SaveIndicator";

describe("SaveIndicator aria-live (WB-FE-ARIA-S4)", () => {
  it("保存状态指示器应包含 aria-live='polite'", () => {
    render(<SaveIndicator autosaveStatus="idle" onRetry={vi.fn()} />);

    const indicator = screen.getByTestId("editor-autosave-status");
    expect(indicator).toHaveAttribute("aria-live", "polite");
  });
});
