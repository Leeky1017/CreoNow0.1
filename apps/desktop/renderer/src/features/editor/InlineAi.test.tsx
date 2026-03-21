import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { createInlineAiStore, type InlineAiStore } from "./inlineAiStore";
import { InlineAiInput } from "./InlineAiInput";
import { InlineAiDiffPreview } from "./InlineAiDiffPreview";
import { EDITOR_SHORTCUTS } from "../../config/shortcuts";

// ---------------------------------------------------------------------------
// 1. Shortcut registration
// ---------------------------------------------------------------------------

describe("EDITOR_SHORTCUTS.inlineAi", () => {
  it("registers mod+K shortcut", () => {
    expect(EDITOR_SHORTCUTS.inlineAi).toBeDefined();
    expect(EDITOR_SHORTCUTS.inlineAi.keys).toBe("mod+K");
    expect(EDITOR_SHORTCUTS.inlineAi.id).toBe("inlineAi");
  });
});

// ---------------------------------------------------------------------------
// 2. inlineAiStore state machine
// ---------------------------------------------------------------------------

describe("inlineAiStore", () => {
  let store: ReturnType<typeof createInlineAiStore>;
  const get = (): InlineAiStore => store.getState();

  beforeEach(() => {
    store = createInlineAiStore();
  });

  it("starts in idle phase", () => {
    expect(get().phase).toBe("idle");
    expect(get().selectionRef).toBeNull();
  });

  it("openInput transitions from idle to input with selectionRef", () => {
    get().openInput({
      from: 0,
      to: 5,
      text: "hello",
      selectionTextHash: "hash",
    });
    expect(get().phase).toBe("input");
    expect(get().selectionRef).toEqual({
      from: 0,
      to: 5,
      text: "hello",
      selectionTextHash: "hash",
    });
  });

  it("dismiss resets to idle from input", () => {
    get().openInput({
      from: 0,
      to: 5,
      text: "hello",
      selectionTextHash: "hash",
    });
    get().dismiss();
    expect(get().phase).toBe("idle");
    expect(get().selectionRef).toBeNull();
  });

  it("submitInstruction transitions from input to streaming", () => {
    get().openInput({
      from: 0,
      to: 5,
      text: "hello",
      selectionTextHash: "hash",
    });
    get().submitInstruction("make it better");
    expect(get().phase).toBe("streaming");
    expect(get().instruction).toBe("make it better");
    expect(get().result).toBe("");
  });

  it("appendChunk accumulates result text", () => {
    get().openInput({
      from: 0,
      to: 5,
      text: "hello",
      selectionTextHash: "hash",
    });
    get().submitInstruction("improve");
    get().appendChunk("Hi");
    get().appendChunk(" there");
    expect(get().result).toBe("Hi there");
  });

  it("setReady transitions from streaming to ready", () => {
    get().openInput({
      from: 0,
      to: 5,
      text: "hello",
      selectionTextHash: "hash",
    });
    get().submitInstruction("improve");
    get().setReady("Hi there");
    expect(get().phase).toBe("ready");
    expect(get().result).toBe("Hi there");
  });

  it("accept resets to idle", () => {
    get().openInput({
      from: 0,
      to: 5,
      text: "hello",
      selectionTextHash: "hash",
    });
    get().submitInstruction("improve");
    get().setReady("Hi there");
    get().accept();
    expect(get().phase).toBe("idle");
  });

  it("reject resets to idle", () => {
    get().openInput({
      from: 0,
      to: 5,
      text: "hello",
      selectionTextHash: "hash",
    });
    get().submitInstruction("improve");
    get().setReady("Hi there");
    get().reject();
    expect(get().phase).toBe("idle");
  });

  it("regenerate transitions back to streaming from ready", () => {
    get().openInput({
      from: 0,
      to: 5,
      text: "hello",
      selectionTextHash: "hash",
    });
    get().submitInstruction("improve");
    get().setReady("Hi there");
    get().regenerate();
    expect(get().phase).toBe("streaming");
    expect(get().result).toBe("");
    expect(get().instruction).toBe("improve");
  });

  it("setError resets to idle", () => {
    get().openInput({
      from: 0,
      to: 5,
      text: "hello",
      selectionTextHash: "hash",
    });
    get().submitInstruction("improve");
    get().setError();
    expect(get().phase).toBe("idle");
  });
});

// ---------------------------------------------------------------------------
// 3. InlineAiInput component
// ---------------------------------------------------------------------------

describe("InlineAiInput", () => {
  it("renders with placeholder and autoFocus", () => {
    render(<InlineAiInput onSubmit={vi.fn()} onDismiss={vi.fn()} />);
    const input = screen.getByTestId("inline-ai-instruction-input");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Ask AI to edit...");
  });

  it("calls onSubmit with instruction on Enter when input is non-empty", () => {
    const onSubmit = vi.fn();
    render(<InlineAiInput onSubmit={onSubmit} onDismiss={vi.fn()} />);
    const input = screen.getByTestId("inline-ai-instruction-input");
    fireEvent.change(input, { target: { value: "Improve tone" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("Improve tone");
  });

  it("does not call onSubmit when input is empty on Enter", () => {
    const onSubmit = vi.fn();
    render(<InlineAiInput onSubmit={onSubmit} onDismiss={vi.fn()} />);
    const input = screen.getByTestId("inline-ai-instruction-input");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onDismiss on Escape", () => {
    const onDismiss = vi.fn();
    render(<InlineAiInput onSubmit={vi.fn()} onDismiss={onDismiss} />);
    const input = screen.getByTestId("inline-ai-instruction-input");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 4. InlineAiDiffPreview component
// ---------------------------------------------------------------------------

describe("InlineAiDiffPreview", () => {
  const defaultProps = {
    phase: "ready" as const,
    originalText: "hello world",
    suggestedText: "hello universe",
    onAccept: vi.fn(),
    onReject: vi.fn(),
    onRegenerate: vi.fn(),
  };

  it("renders diff with removed and added spans", () => {
    render(<InlineAiDiffPreview {...defaultProps} />);
    expect(screen.getByTestId("inline-ai-diff-removed")).toHaveTextContent(
      "hello world",
    );
    expect(screen.getByTestId("inline-ai-diff-added")).toHaveTextContent(
      "hello universe",
    );
  });

  it("renders Accept, Reject, Regenerate buttons", () => {
    render(<InlineAiDiffPreview {...defaultProps} />);
    expect(screen.getByTestId("inline-ai-accept-btn")).toHaveTextContent(
      "Accept",
    );
    expect(screen.getByTestId("inline-ai-reject-btn")).toHaveTextContent(
      "Reject",
    );
    expect(screen.getByTestId("inline-ai-regenerate-btn")).toHaveTextContent(
      "Regenerate",
    );
  });

  it("disables Accept and Regenerate during streaming", () => {
    render(<InlineAiDiffPreview {...defaultProps} phase="streaming" />);
    expect(screen.getByTestId("inline-ai-accept-btn")).toBeDisabled();
    expect(screen.getByTestId("inline-ai-regenerate-btn")).toBeDisabled();
  });

  it("shows loading indicator during streaming", () => {
    render(<InlineAiDiffPreview {...defaultProps} phase="streaming" />);
    expect(screen.getByTestId("inline-ai-loading")).toBeInTheDocument();
  });

  it("calls onAccept when Accept is clicked", () => {
    const onAccept = vi.fn();
    render(<InlineAiDiffPreview {...defaultProps} onAccept={onAccept} />);
    fireEvent.click(screen.getByTestId("inline-ai-accept-btn"));
    expect(onAccept).toHaveBeenCalled();
  });

  it("calls onReject when Reject is clicked", () => {
    const onReject = vi.fn();
    render(<InlineAiDiffPreview {...defaultProps} onReject={onReject} />);
    fireEvent.click(screen.getByTestId("inline-ai-reject-btn"));
    expect(onReject).toHaveBeenCalled();
  });

  it("calls onRegenerate when Regenerate is clicked", () => {
    const onRegenerate = vi.fn();
    render(
      <InlineAiDiffPreview {...defaultProps} onRegenerate={onRegenerate} />,
    );
    fireEvent.click(screen.getByTestId("inline-ai-regenerate-btn"));
    expect(onRegenerate).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 5. i18n keys exist in both locales
// ---------------------------------------------------------------------------

describe("inlineAi i18n keys", () => {
  // 审计：v1-13 #020 KEEP
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- 技术原因：test file uses require() to load JSON locale files for key existence validation
  const en = require("../../i18n/locales/en.json");
  // 审计：v1-13 #021 KEEP
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- 技术原因：test file uses require() to load JSON locale files for key existence validation
  const zhCN = require("../../i18n/locales/zh-CN.json");

  const requiredKeys = [
    "placeholder",
    "accept",
    "reject",
    "regenerate",
    "loading",
  ];

  for (const key of requiredKeys) {
    it(`has inlineAi.${key} in en`, () => {
      expect(en.inlineAi[key]).toBeDefined();
      expect(typeof en.inlineAi[key]).toBe("string");
    });

    it(`has inlineAi.${key} in zh-CN`, () => {
      expect(zhCN.inlineAi[key]).toBeDefined();
      expect(typeof zhCN.inlineAi[key]).toBe("string");
    });
  }
});
