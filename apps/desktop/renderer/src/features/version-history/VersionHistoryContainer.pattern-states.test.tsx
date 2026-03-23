/**
 * VersionHistoryContainer — pattern state rendering tests
 *
 * Verifies that VersionHistoryContainer delegates to patterns/EmptyState,
 * patterns/LoadingState, and patterns/ErrorState instead of hand-rolling UI.
 *
 * Spec: v1-01 §S1 — all features must use unified pattern components.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VersionHistoryContainer } from "./VersionHistoryContainer";
import {
  VersionStoreProvider,
  createVersionStore,
} from "../../stores/versionStore";

const invokeMock = vi.hoisted(() => vi.fn());
const editorState = vi.hoisted(() => ({
  documentId: null as string | null,
  bootstrapForProject: vi.fn(),
}));

vi.mock("../../lib/ipcClient", () => ({
  invoke: invokeMock,
}));

vi.mock("../../stores/editorStore", () => ({
  useEditorStore: vi.fn((selector: (state: typeof editorState) => unknown) =>
    selector(editorState),
  ),
}));

vi.mock("./useVersionCompare", () => ({
  useVersionCompare: () => ({
    startCompare: vi.fn(),
  }),
}));

function renderWithStore(jsx: React.ReactElement): ReturnType<typeof render> {
  const store = createVersionStore({ invoke: invokeMock as never });
  return render(
    <VersionStoreProvider store={store}>{jsx}</VersionStoreProvider>,
  );
}

describe("VersionHistoryContainer pattern state rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    editorState.documentId = null;
  });

  it("renders EmptyState when no document is open", () => {
    editorState.documentId = null;
    renderWithStore(<VersionHistoryContainer projectId="proj-1" />);

    // EmptyState renders a heading level element with the title
    expect(
      screen.getByText("Open a document to view history"),
    ).toBeInTheDocument();
  });

  it("renders LoadingState while fetching versions", () => {
    editorState.documentId = "doc-1";
    // Never resolve the invoke so status stays "loading"
    invokeMock.mockReturnValue(new Promise(() => {}));

    renderWithStore(<VersionHistoryContainer projectId="proj-1" />);

    // Skeleton fallback renders during loading
    expect(screen.getByTestId("version-history-skeleton")).toBeInTheDocument();
  });

  it("renders ErrorState when version fetch fails", async () => {
    editorState.documentId = "doc-1";

    // document read succeeds, version list fails
    invokeMock.mockImplementation(async (channel: string) => {
      if (channel === "file:document:read") {
        return {
          ok: true,
          data: {
            documentId: "doc-1",
            projectId: "proj-1",
            contentHash: "hash-1",
          },
        };
      }
      if (channel === "version:snapshot:list") {
        return {
          ok: false,
          error: { code: "INTERNAL_ERROR", message: "db failure" },
        };
      }
      return { ok: true, data: {} };
    });

    renderWithStore(<VersionHistoryContainer projectId="proj-1" />);

    // Wait for ErrorState to render after async fetch completes
    const errorMessage = await screen.findByText(
      "Failed to load version history",
    );
    expect(errorMessage).toBeInTheDocument();
  });

  it("renders EmptyState when version list is empty", async () => {
    editorState.documentId = "doc-1";

    invokeMock.mockImplementation(async (channel: string) => {
      if (channel === "file:document:read") {
        return {
          ok: true,
          data: {
            documentId: "doc-1",
            projectId: "proj-1",
            contentHash: "hash-1",
          },
        };
      }
      if (channel === "version:snapshot:list") {
        return { ok: true, data: { items: [] } };
      }
      return { ok: true, data: {} };
    });

    renderWithStore(<VersionHistoryContainer projectId="proj-1" />);

    const emptyTitle = await screen.findByText(
      "No versions yet. Save your document to create versions.",
    );
    expect(emptyTitle).toBeInTheDocument();
  });
});
