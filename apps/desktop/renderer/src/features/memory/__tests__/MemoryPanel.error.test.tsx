import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { MemoryPanel } from "../MemoryPanel";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("../../../lib/ipcClient", () => ({
  invoke: invokeMock,
}));

vi.mock("../../../stores/projectStore", () => ({
  useProjectStore: vi.fn((selector) =>
    selector({ current: { projectId: "proj-1" } }),
  ),
}));

vi.mock("../../../stores/fileStore", () => ({
  useFileStore: vi.fn((selector) => selector({ currentDocumentId: null })),
}));

const SETTINGS_DATA = {
  injectionEnabled: true,
  preferenceLearningEnabled: true,
  privacyModeEnabled: false,
  preferenceLearningThreshold: 3,
};

describe("MemoryPanel error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invokeMock.mockImplementation(async (channel: string) => {
      if (channel === "memory:semantic:list") {
        throw new Error("invoke exploded");
      }
      if (channel === "memory:settings:get") {
        return { ok: true, data: SETTINGS_DATA };
      }
      return { ok: true, data: {} };
    });
  });

  it("sets error status when loadPanelData throws", async () => {
    render(<MemoryPanel />);

    await waitFor(() => {
      expect(screen.getByText("error")).toBeInTheDocument();
    });
  });

  it("renders visible error state after invoke failure", async () => {
    render(<MemoryPanel />);

    await waitFor(() => {
      expect(screen.getByTestId("memory-error")).toHaveTextContent(
        "内部错误",
      );
    });
  });
});
