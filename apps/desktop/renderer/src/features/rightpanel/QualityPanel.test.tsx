import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

import { QualityPanel } from "./QualityPanel";

const invokeMock = vi.hoisted(() => vi.fn());
const useProjectStoreMock = vi.hoisted(() => vi.fn());
const ensureMock = vi.hoisted(() => vi.fn());
const clearErrorMock = vi.hoisted(() => vi.fn());

vi.mock("../../lib/ipcClient", () => ({
  invoke: invokeMock,
}));

vi.mock("../../stores/projectStore", () => ({
  useProjectStore: useProjectStoreMock,
}));

vi.mock("../../hooks/useJudgeEnsure", () => ({
  useJudgeEnsure: () => ({
    busy: false,
    downloading: false,
    error: null,
    ensure: ensureMock,
    clearError: clearErrorMock,
  }),
}));

function mockInvoke(overrides?: {
  judgeOk?: boolean;
  judgeState?: {
    status: string;
    error?: { code: string; message: string };
  };
  judgeError?: { code: string; message: string };
  constraintsOk?: boolean;
  constraintsData?: { items: string[] };
  constraintsError?: { code: string; message: string };
}): void {
  invokeMock.mockImplementation((channel: string) => {
    if (channel === "judge:model:getstate") {
      if (overrides?.judgeOk === false) {
        return Promise.resolve({
          ok: false,
          error: overrides.judgeError ?? {
            code: "INTERNAL",
            message: "fail",
          },
        });
      }
      return Promise.resolve({
        ok: true,
        data: {
          state: overrides?.judgeState ?? { status: "ready" },
        },
      });
    }
    if (channel === "constraints:policy:get") {
      if (overrides?.constraintsOk === false) {
        return Promise.resolve({
          ok: false,
          error: overrides.constraintsError ?? {
            code: "INTERNAL",
            message: "fail",
          },
        });
      }
      return Promise.resolve({
        ok: true,
        data: {
          constraints: overrides?.constraintsData ?? {
            items: ["Rule A", "Rule B"],
          },
        },
      });
    }
    return Promise.resolve({
      ok: false,
      error: { code: "NOT_FOUND", message: "Unknown channel" },
    });
  });
}

describe("QualityPanel", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    ensureMock.mockReset().mockResolvedValue(null);
    clearErrorMock.mockReset();

    useProjectStoreMock.mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({
          current: { projectId: "proj-1", rootPath: "/path" },
        }),
    );

    mockInvoke();
  });

  it("should show loading state while fetching judge model state", () => {
    invokeMock.mockReturnValue(new Promise(() => {}));

    render(<QualityPanel />);

    expect(
      screen.getByText("Loading quality check status..."),
    ).toBeInTheDocument();
    expect(screen.getByText("Loading constraints...")).toBeInTheDocument();
  });

  it("should display judge model info when fetch succeeds", async () => {
    render(<QualityPanel />);

    await waitFor(() => {
      expect(
        screen.getByTestId("quality-panel-judge-status"),
      ).toHaveTextContent("Ready");
    });
    expect(screen.getByTestId("quality-panel-judge-status")).toHaveAttribute(
      "data-status",
      "ready",
    );
  });

  it("should show error message when judge model fetch fails", async () => {
    mockInvoke({ judgeOk: false });

    render(<QualityPanel />);

    await waitFor(() => {
      expect(
        screen.getByTestId("quality-panel-judge-error"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByTestId("quality-panel-judge-error-code"),
    ).toHaveTextContent("Internal error. Please try again later.");
  });

  it("should fetch constraints when projectId is available", async () => {
    render(<QualityPanel />);

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("constraints:policy:get", {
        projectId: "proj-1",
      });
    });
    expect(
      screen.getByTestId("quality-panel-constraints-count"),
    ).toHaveTextContent("2 rules");
  });

  it("should handle missing projectId gracefully", async () => {
    useProjectStoreMock.mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) =>
        selector({ current: null }),
    );

    render(<QualityPanel />);

    expect(screen.getByTestId("quality-panel-no-project")).toBeInTheDocument();
    expect(screen.getByText("No project selected")).toBeInTheDocument();

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("judge:model:getstate", {});
    });
    expect(invokeMock).not.toHaveBeenCalledWith(
      "constraints:policy:get",
      expect.anything(),
    );
  });

  it("should call ensure when ensure button is clicked", async () => {
    mockInvoke({ judgeState: { status: "not_ready" } });
    ensureMock.mockResolvedValue({ ok: true, state: { status: "ready" } });

    render(<QualityPanel />);

    await waitFor(() => {
      expect(
        screen.getByTestId("quality-panel-judge-ensure"),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("quality-panel-judge-ensure"));

    expect(ensureMock).toHaveBeenCalledOnce();
  });
});
