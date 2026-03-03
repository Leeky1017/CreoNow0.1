import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "../../../components/layout/AppShell";
import { LayoutTestWrapper } from "../../../components/layout/test-utils";

describe("S3-ZEN-MODE-S3", () => {
  it("keyboard toggle keeps layout store in sync", async () => {
    render(
      <LayoutTestWrapper>
        <AppShell />
      </LayoutTestWrapper>,
    );

    fireEvent.keyDown(document, { key: "F11" });

    await waitFor(() => {
      expect(screen.getByTestId("zen-mode")).toBeInTheDocument();
    });
    expect(screen.getByTestId("layout-sidebar")).toHaveClass("hidden");
    expect(screen.getByTestId("layout-panel")).toHaveClass("hidden");

    fireEvent.keyDown(document, { key: "F11", repeat: true });

    await waitFor(() => {
      expect(screen.getByTestId("zen-mode")).toBeInTheDocument();
    });
    expect(screen.getByTestId("layout-sidebar")).toHaveClass("hidden");
    expect(screen.getByTestId("layout-panel")).toHaveClass("hidden");
  });
});
