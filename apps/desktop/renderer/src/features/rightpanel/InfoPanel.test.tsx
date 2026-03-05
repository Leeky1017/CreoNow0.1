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
});
