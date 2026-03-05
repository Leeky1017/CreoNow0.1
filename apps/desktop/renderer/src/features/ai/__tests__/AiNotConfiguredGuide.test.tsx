import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AiNotConfiguredGuide } from "../AiNotConfiguredGuide";

describe("AiNotConfiguredGuide", () => {
  it("renders when no API key configured", () => {
    render(<AiNotConfiguredGuide onNavigateToSettings={vi.fn()} />);

    expect(
      screen.getByText(/Please configure AI service in Settings first/),
    ).toBeInTheDocument();
  });

  it("has settings navigation button", () => {
    render(<AiNotConfiguredGuide onNavigateToSettings={vi.fn()} />);

    const button = screen.getByRole("button", { name: /Settings/i });
    expect(button).toBeInTheDocument();
  });

  it("calls onNavigateToSettings when button clicked", async () => {
    const onNav = vi.fn();
    render(<AiNotConfiguredGuide onNavigateToSettings={onNav} />);

    const button = screen.getByRole("button", { name: /Settings/i });
    await userEvent.click(button);

    expect(onNav).toHaveBeenCalledTimes(1);
  });

  it("shows guidance text about API key", () => {
    render(<AiNotConfiguredGuide onNavigateToSettings={vi.fn()} />);

    expect(
      screen.getByText(/API Key/i),
    ).toBeInTheDocument();
  });
});
