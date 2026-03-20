import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { InfoPanel } from "./InfoPanel";

const invokeMock = vi.hoisted(() => vi.fn());
const useFileStoreMock = vi.hoisted(() => vi.fn());

vi.mock("../../lib/ipcClient", () => ({
  invoke: invokeMock,
}));

vi.mock("../../stores/fileStore", () => ({
  useFileStore: (selector: (state: Record<string, unknown>) => unknown) =>
    useFileStoreMock(selector),
}));

describe("InfoPanel", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    useFileStoreMock.mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({
          currentDocumentId: "doc-1",
          items: [
            {
              documentId: "doc-1",
              type: "chapter",
              title: "Doc A",
              status: "draft",
              sortOrder: 0,
              updatedAt: 1,
            },
          ],
        }),
    );
    invokeMock.mockResolvedValue({
      ok: true,
      data: {
        summary: {
          wordsWritten: 12,
          writingSeconds: 20,
          skillsUsed: 1,
          documentsCreated: 0,
        },
      },
    });
  });

  it("shows entry for opening version history from Info panel", async () => {
    render(<InfoPanel />);

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("stats:day:gettoday", {});
    });

    expect(
      screen.getByRole("button", { name: "View Version History" }),
    ).toBeInTheDocument();
  });

  it("should show no-document message when no document is selected", async () => {
    useFileStoreMock.mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({ currentDocumentId: null, items: [] }),
    );

    render(<InfoPanel />);

    expect(screen.getByTestId("info-panel-no-document")).toBeInTheDocument();
    expect(screen.getByText("No document selected")).toBeInTheDocument();
  });

  it("should display document title and update time when document exists", async () => {
    render(<InfoPanel />);

    await waitFor(() => {
      expect(screen.getByTestId("info-panel-doc-title")).toHaveTextContent(
        "Doc A",
      );
    });
    expect(screen.getByTestId("info-panel-doc-updated")).toBeInTheDocument();
  });

  it("should show writing stats after successful IPC fetch", async () => {
    render(<InfoPanel />);

    await waitFor(() => {
      expect(screen.getByTestId("info-panel-words-written")).toHaveTextContent(
        "12",
      );
    });
    expect(screen.getByTestId("info-panel-writing-time")).toHaveTextContent(
      "20s",
    );
    expect(screen.getByTestId("info-panel-skills-used")).toHaveTextContent("1");
    expect(screen.getByTestId("info-panel-docs-created")).toHaveTextContent(
      "0",
    );
  });

  it("should display error message when stats fetch fails", async () => {
    invokeMock.mockResolvedValue({
      ok: false,
      error: { code: "INTERNAL", message: "Server error" },
    });

    render(<InfoPanel />);

    await waitFor(() => {
      expect(screen.getByTestId("info-panel-stats-error")).toBeInTheDocument();
    });
  });

  it("should show loading indicator while fetching stats", () => {
    invokeMock.mockReturnValue(new Promise(() => {}));

    render(<InfoPanel />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
