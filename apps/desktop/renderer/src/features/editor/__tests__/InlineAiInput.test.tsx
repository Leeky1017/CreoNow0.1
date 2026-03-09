import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { InlineAiInput } from "../InlineAiInput";

describe("InlineAiInput", () => {
  it("should render with role='dialog' and correct aria-label", () => {
    render(<InlineAiInput onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-label", "Inline AI Input");
  });

  it("should render input with placeholder and aria-label", () => {
    render(<InlineAiInput onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("placeholder", "Enter AI instruction…");
    expect(input).toHaveAttribute("aria-label", "AI instruction input");
  });

  it("should auto-focus the input on mount", () => {
    render(<InlineAiInput onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveFocus();
  });

  it("should call onSubmit with trimmed value on Enter when input is non-empty", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<InlineAiInput onSubmit={onSubmit} onCancel={vi.fn()} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "润色这段文字");
    await user.keyboard("{Enter}");

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("润色这段文字");
  });

  it("should NOT call onSubmit on Enter when input is empty", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<InlineAiInput onSubmit={onSubmit} onCancel={vi.fn()} />);
    const input = screen.getByRole("textbox");

    await user.click(input);
    await user.keyboard("{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("should NOT call onSubmit on Enter when input is whitespace-only", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<InlineAiInput onSubmit={onSubmit} onCancel={vi.fn()} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "   ");
    await user.keyboard("{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("should call onCancel on Escape", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(<InlineAiInput onSubmit={vi.fn()} onCancel={onCancel} />);
    const input = screen.getByRole("textbox");

    await user.click(input);
    await user.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
