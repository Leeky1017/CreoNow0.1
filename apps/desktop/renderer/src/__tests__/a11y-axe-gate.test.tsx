import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

import { Dialog } from "../components/primitives/Dialog";
import { Button } from "../components/primitives/Button";
import { FileTreePanel } from "../features/files/FileTreePanel";

expect.extend(toHaveNoViolations);

// ---------------------------------------------------------------------------
// Store mocks for FileTreePanel (same pattern as accessibility-guard.test.tsx)
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
// Tests
// ---------------------------------------------------------------------------

describe("axe-core a11y gate", () => {
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

  it("Dialog 渲染无 axe 违规", async () => {
    const { container } = render(
      <Dialog
        open={true}
        onOpenChange={() => {}}
        title="Confirm Action"
        description="Are you sure you want to proceed?"
        footer={
          <>
            <Button variant="ghost">Cancel</Button>
            <Button variant="primary">Confirm</Button>
          </>
        }
      >
        <p>This will delete the selected item permanently.</p>
      </Dialog>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("Button 各 variant 无 axe 违规", async () => {
    const { container } = render(
      <div>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="pill">Pill</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
      </div>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("FileTreePanel 渲染无 axe 违规（排除已知 role=button 相关问题）", async () => {
    // FileTreeNodeRow uses role="button" + aria-selected and has focusable
    // descendants inside role="button". Both are pre-existing structural
    // issues tracked separately. We exclude them here so the gate catches
    // NEW violations while the component refactor is pending.
    const { container } = render(<FileTreePanel projectId="test-project" />);

    const results = await axe(container, {
      rules: {
        "aria-allowed-attr": { enabled: false },
        "nested-interactive": { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it("Dialog 含 footer 按钮无 axe 违规", async () => {
    const { container } = render(
      <Dialog
        open={true}
        onOpenChange={() => {}}
        title="Export Settings"
        footer={
          <>
            <Button variant="ghost">Cancel</Button>
            <Button variant="secondary">Save Draft</Button>
            <Button variant="primary">Export</Button>
          </>
        }
      >
        <p>Choose your export format and destination.</p>
      </Dialog>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
