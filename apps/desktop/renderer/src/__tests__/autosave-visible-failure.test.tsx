import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";

import { SaveIndicator } from "../components/layout/SaveIndicator";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "autosave.status.saving": "保存中…",
        "autosave.status.saved": "已保存",
        "autosave.status.error": "保存失败",
        "autosave.a11y.retryLabel": "重试保存",
      };
      return map[key] ?? key;
    },
  }),
}));

vi.mock("../i18n", () => ({}));

describe("SaveIndicator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── AC-1: idle 状态不显示文本 ───

  it("idle 状态不显示文本", () => {
    render(<SaveIndicator autosaveStatus="idle" onRetry={vi.fn()} />);
    const el = screen.getByTestId("editor-autosave-status");
    expect(el.textContent).toBe("");
  });

  // ─── AC-1: saving 状态显示"保存中…" ───

  it("saving 状态显示保存中文本", () => {
    render(<SaveIndicator autosaveStatus="saving" onRetry={vi.fn()} />);
    expect(screen.getByText("保存中…")).toBeInTheDocument();
  });

  // ─── AC-1: saved 状态显示"已保存"并在 2s 后回退到 idle ───

  it("saved 状态显示已保存，2s 后回退到 idle", () => {
    render(<SaveIndicator autosaveStatus="saved" onRetry={vi.fn()} />);
    expect(screen.getByText("已保存")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const el = screen.getByTestId("editor-autosave-status");
    expect(el.textContent).toBe("");
  });

  // ─── AC-1: error 状态显示"保存失败"，带错误样式 ───

  it("error 状态显示保存失败文本，含 error 背景色", () => {
    render(<SaveIndicator autosaveStatus="error" onRetry={vi.fn()} />);
    const el = screen.getByText("保存失败");
    expect(el).toBeInTheDocument();
    expect(el.className).toContain("color-error");
    expect(el.className).toContain("color-error-subtle");
  });

  // ─── AC-3: error 状态点击触发 onRetry ───

  it("error 状态点击触发 onRetry", () => {
    const onRetry = vi.fn();
    render(<SaveIndicator autosaveStatus="error" onRetry={onRetry} />);

    fireEvent.click(screen.getByText("保存失败"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  // ─── AC-3: 非 error 状态点击不触发 onRetry ───

  it("saving 状态点击不触发 onRetry", () => {
    const onRetry = vi.fn();
    render(<SaveIndicator autosaveStatus="saving" onRetry={onRetry} />);

    fireEvent.click(screen.getByText("保存中…"));
    expect(onRetry).not.toHaveBeenCalled();
  });

  // ─── AC-8: A11y — error 状态有 role="button" + aria-label ───

  it("error 状态有 role=button 和 aria-label", () => {
    render(<SaveIndicator autosaveStatus="error" onRetry={vi.fn()} />);
    const el = screen.getByTestId("editor-autosave-status");
    expect(el.getAttribute("role")).toBe("button");
    expect(el.getAttribute("aria-label")).toBe("重试保存");
  });

  // ─── AC-8: A11y — 非 error 状态有 role="status" ───

  it("idle 状态有 role=status", () => {
    render(<SaveIndicator autosaveStatus="idle" onRetry={vi.fn()} />);
    const el = screen.getByTestId("editor-autosave-status");
    expect(el.getAttribute("role")).toBe("status");
  });

  it("saving 状态有 role=status", () => {
    render(<SaveIndicator autosaveStatus="saving" onRetry={vi.fn()} />);
    const el = screen.getByTestId("editor-autosave-status");
    expect(el.getAttribute("role")).toBe("status");
  });
});
