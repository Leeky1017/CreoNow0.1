import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InfoBar } from "./InfoBar";

describe("InfoBar", () => {
  it("renders message with correct variant style", () => {
    render(
      <InfoBar variant="warning" message="Disk space low" data-testid="infobar" />,
    );
    expect(screen.getByText("Disk space low")).toBeInTheDocument();
    const bar = screen.getByTestId("infobar");
    expect(bar.className).toMatch(/warning/i);
  });

  it("renders action slot when provided", () => {
    const onClick = vi.fn();
    render(
      <InfoBar
        variant="info"
        message="Update available"
        action={<button onClick={onClick}>Update</button>}
        data-testid="infobar"
      />,
    );
    const btn = screen.getByText("Update");
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders dismiss button when dismissible", () => {
    const onDismiss = vi.fn();
    render(
      <InfoBar
        variant="error"
        message="Something went wrong"
        dismissible
        onDismiss={onDismiss}
        data-testid="infobar"
      />,
    );
    const dismissBtn = screen.getByRole("button", { name: /dismiss|close/i });
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("renders all variant types", () => {
    const variants = ["info", "warning", "error", "success"] as const;
    for (const variant of variants) {
      const { unmount } = render(
        <InfoBar
          variant={variant}
          message={`${variant} message`}
          data-testid={`infobar-${variant}`}
        />,
      );
      const bar = screen.getByTestId(`infobar-${variant}`);
      expect(bar.className).toMatch(new RegExp(variant, "i"));
      unmount();
    }
  });
});
