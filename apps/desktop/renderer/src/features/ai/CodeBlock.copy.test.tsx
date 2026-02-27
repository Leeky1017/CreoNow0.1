import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CodeBlock } from "./AiPanel";

afterEach(() => {
  vi.restoreAllMocks();
});

function setClipboardWriteText(
  writeText: (text: string) => Promise<void>,
): void {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

describe("CodeBlock copy", () => {
  it("复制成功后显示 Copied!", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboardWriteText(writeText);

    render(<CodeBlock code="const a = 1;" />);

    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(writeText).toHaveBeenCalledWith("const a = 1;");
    expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();
  });

  it("复制失败时保持 Copy 文案并记录错误", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClipboardWriteText(writeText);

    render(<CodeBlock code="const b = 2;" />);

    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith("const b = 2;");
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledWith("CodeBlock copy failed", {
      error: "denied",
    });
  });
});
