import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { InlineAiDiffPreview } from "../InlineAiDiffPreview";

const defaultProps = {
  originalText: "原始文本 hello world",
  modifiedText: "修改文本 hello world",
  onAccept: vi.fn(),
  onReject: vi.fn(),
  onRegenerate: vi.fn(),
};

describe("InlineAiDiffPreview", () => {
  it("should render with role='region' and correct aria-label", () => {
    render(<InlineAiDiffPreview {...defaultProps} state="ready" />);
    const region = screen.getByRole("region");
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute("aria-label", "AI modification preview");
  });

  it("should show aria-busy='true' during streaming", () => {
    render(<InlineAiDiffPreview {...defaultProps} state="streaming" />);
    const region = screen.getByRole("region");
    expect(region).toHaveAttribute("aria-busy", "true");
  });

  it("should show aria-busy='false' when ready", () => {
    render(<InlineAiDiffPreview {...defaultProps} state="ready" />);
    const region = screen.getByRole("region");
    expect(region).toHaveAttribute("aria-busy", "false");
  });

  it("should show generating indicator during streaming", () => {
    render(<InlineAiDiffPreview {...defaultProps} state="streaming" />);
    expect(screen.getByTestId("inline-ai-generating")).toHaveTextContent(
      "AI is generating…",
    );
  });

  it("should NOT show generating indicator when ready", () => {
    render(<InlineAiDiffPreview {...defaultProps} state="ready" />);
    expect(screen.queryByTestId("inline-ai-generating")).not.toBeInTheDocument();
  });

  it("should disable Accept and Regenerate buttons during streaming", () => {
    render(<InlineAiDiffPreview {...defaultProps} state="streaming" />);
    expect(screen.getByTestId("inline-ai-accept")).toBeDisabled();
    expect(screen.getByTestId("inline-ai-regenerate")).toBeDisabled();
  });

  it("should keep Reject button enabled during streaming", () => {
    render(<InlineAiDiffPreview {...defaultProps} state="streaming" />);
    expect(screen.getByTestId("inline-ai-reject")).toBeEnabled();
  });

  it("should enable all buttons when ready", () => {
    render(<InlineAiDiffPreview {...defaultProps} state="ready" />);
    expect(screen.getByTestId("inline-ai-accept")).toBeEnabled();
    expect(screen.getByTestId("inline-ai-reject")).toBeEnabled();
    expect(screen.getByTestId("inline-ai-regenerate")).toBeEnabled();
  });

  it("should call onAccept when Accept is clicked", async () => {
    const onAccept = vi.fn();
    const user = userEvent.setup();
    render(<InlineAiDiffPreview {...defaultProps} state="ready" onAccept={onAccept} />);
    await user.click(screen.getByTestId("inline-ai-accept"));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it("should call onReject when Reject is clicked", async () => {
    const onReject = vi.fn();
    const user = userEvent.setup();
    render(<InlineAiDiffPreview {...defaultProps} state="ready" onReject={onReject} />);
    await user.click(screen.getByTestId("inline-ai-reject"));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("should call onRegenerate when Regenerate is clicked", async () => {
    const onRegenerate = vi.fn();
    const user = userEvent.setup();
    render(
      <InlineAiDiffPreview
        {...defaultProps}
        state="ready"
        onRegenerate={onRegenerate}
      />,
    );
    await user.click(screen.getByTestId("inline-ai-regenerate"));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it("should have correct aria-labels on action buttons", () => {
    render(<InlineAiDiffPreview {...defaultProps} state="ready" />);
    expect(screen.getByTestId("inline-ai-accept")).toHaveAttribute(
      "aria-label",
      "Accept AI changes",
    );
    expect(screen.getByTestId("inline-ai-reject")).toHaveAttribute(
      "aria-label",
      "Reject AI changes",
    );
    expect(screen.getByTestId("inline-ai-regenerate")).toHaveAttribute(
      "aria-label",
      "Regenerate AI changes",
    );
  });

  it("should render diff content with word-level markup", () => {
    render(
      <InlineAiDiffPreview
        originalText="hello world"
        modifiedText="hello earth"
        state="ready"
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onRegenerate={vi.fn()}
      />,
    );
    const content = screen.getByTestId("inline-ai-diff-content");
    expect(content).toBeInTheDocument();
    // Should contain both the removed ("world") and added ("earth") text
    expect(content.textContent).toContain("world");
    expect(content.textContent).toContain("earth");
  });
});
