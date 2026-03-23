// axe-core a11y gate: feature panels (with store mocks)
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

import { FileTreePanel } from "../features/files/FileTreePanel";

expect.extend(toHaveNoViolations);

// ---------------------------------------------------------------------------
// Store mocks for FileTreePanel
// ---------------------------------------------------------------------------

type FileItem = {
  documentId: string;
  title: string;
  updatedAt: number;
  type: "chapter" | "note" | "setting" | "timeline" | "character";
  status: "draft" | "final";
  sortOrder: number;
  parentId?: string;
};

let fileItems: FileItem[] = [];
let currentDocumentId: string | null = null;

vi.mock("../stores/fileStore", () => ({
  useFileStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      items: fileItems,
      currentDocumentId,
      bootstrapStatus: "ready",
      lastError: null,
      createAndSetCurrent: vi
        .fn()
        .mockResolvedValue({ ok: true, data: { documentId: "new-doc" } }),
      rename: vi.fn().mockResolvedValue({ ok: true }),
      updateStatus: vi.fn().mockResolvedValue({
        ok: true,
        data: { updated: true, status: "draft" },
      }),
      delete: vi.fn().mockResolvedValue({ ok: true }),
      setCurrent: vi.fn().mockResolvedValue({ ok: true }),
      clearError: vi.fn(),
    }),
  ),
}));

vi.mock("../stores/editorStore", () => ({
  useEditorStore: vi.fn(
    (selector: (state: Record<string, unknown>) => unknown) =>
      selector({
        openDocument: vi.fn().mockResolvedValue({ ok: true }),
        openCurrentDocumentForProject: vi.fn().mockResolvedValue({ ok: true }),
      }),
  ),
}));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function expectNoViolations(container: HTMLElement) {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("axe-core a11y gate — features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentDocumentId = "doc-1";
    fileItems = [
      {
        documentId: "doc-1",
        title: "Chapter 1",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 0,
      },
      {
        documentId: "doc-2",
        title: "Chapter 2",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 1,
      },
    ];
  });

  it("FileTreePanel has no axe violations", async () => {
    const { container } = render(<FileTreePanel projectId="test-project" />);
    await expectNoViolations(container);
  });
});
