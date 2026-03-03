import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toast, ToastProvider, ToastViewport } from "./Toast";

function ToastWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <ToastViewport />
    </ToastProvider>
  );
}

describe("Toast aria-live (WB-FE-ARIA-S3)", () => {
  it("error variant Toast 应包含 aria-live='assertive'", () => {
    render(
      <ToastWrapper>
        <Toast title="Error occurred" variant="error" open />
      </ToastWrapper>,
    );

    const toastEl = screen.getByText("Error occurred").closest("[data-state]");
    expect(toastEl).toHaveAttribute("aria-live", "assertive");
  });

  it("default variant Toast 应包含 aria-live='polite'", () => {
    render(
      <ToastWrapper>
        <Toast title="Info message" variant="default" open />
      </ToastWrapper>,
    );

    const toastEl = screen.getByText("Info message").closest("[data-state]");
    expect(toastEl).toHaveAttribute("aria-live", "polite");
  });

  it("success variant Toast 应包含 aria-live='polite'", () => {
    render(
      <ToastWrapper>
        <Toast title="Success msg" variant="success" open />
      </ToastWrapper>,
    );

    const toastEl = screen.getByText("Success msg").closest("[data-state]");
    expect(toastEl).toHaveAttribute("aria-live", "polite");
  });

  it("warning variant Toast 应包含 aria-live='polite'", () => {
    render(
      <ToastWrapper>
        <Toast title="Warning msg" variant="warning" open />
      </ToastWrapper>,
    );

    const toastEl = screen.getByText("Warning msg").closest("[data-state]");
    expect(toastEl).toHaveAttribute("aria-live", "polite");
  });
});
