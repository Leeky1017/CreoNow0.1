import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import type { DocumentListItem, TreeSnapshot } from "../fileTreeTypes";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCreateAndSetCurrent = vi
  .fn()
  .mockResolvedValue({ ok: true, data: { documentId: "new-doc" } });
const mockOpenDocument = vi.fn().mockResolvedValue({ ok: true });
const mockSetFocusedDocumentId = vi.fn();
const mockSetEditing = vi.fn();
const mockRename = vi.fn().mockResolvedValue({ ok: true });
const mockConfirm = vi.fn().mockResolvedValue(true);
const mockDeleteDocument = vi.fn().mockResolvedValue({ ok: true });
const mockOpenCurrentForProject = vi.fn().mockResolvedValue({ ok: true });
const mockSetCurrent = vi.fn().mockResolvedValue({ ok: true });
const mockUpdateStatus = vi.fn().mockResolvedValue({ ok: true });
const mockMoveToFolder = vi.fn().mockResolvedValue({ ok: true });
const mockReorder = vi.fn().mockResolvedValue({ ok: true });
const mockSetExpandedFolderIds = vi.fn();
const mockToggleFolderExpanded = vi.fn();
const mockSetDraggingDocumentId = vi.fn();
const mockSetDropTarget = vi.fn();
const mockClearError = vi.fn();

function makeItem(
  overrides: Partial<DocumentListItem> & { documentId: string },
): DocumentListItem {
  return {
    title: "Untitled",
    type: "chapter",
    status: "draft",
    sortOrder: 0,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeEmptyTree(): TreeSnapshot {
  return {
    roots: [],
    nodeById: new Map(),
    parentById: new Map(),
  };
}

function buildCoreMock(overrides: Record<string, unknown> = {}) {
  return {
    items: [] as DocumentListItem[],
    currentDocumentId: null as string | null,
    bootstrapStatus: "ready" as const,
    lastError: null,
    clearError: mockClearError,
    createAndSetCurrent: mockCreateAndSetCurrent,
    rename: mockRename,
    updateStatus: mockUpdateStatus,
    deleteDocument: mockDeleteDocument,
    setCurrent: mockSetCurrent,
    reorder: mockReorder,
    moveToFolder: mockMoveToFolder,
    openDocument: mockOpenDocument,
    confirm: mockConfirm,
    dialogProps: { open: false },
    openCurrentForProject: mockOpenCurrentForProject,
    editing: { mode: "idle" as const },
    setEditing: mockSetEditing,
    expandedFolderIds: new Set<string>(),
    setExpandedFolderIds: mockSetExpandedFolderIds,
    focusedDocumentId: null as string | null,
    setFocusedDocumentId: mockSetFocusedDocumentId,
    draggingDocumentId: null as string | null,
    setDraggingDocumentId: mockSetDraggingDocumentId,
    dropTarget: null,
    setDropTarget: mockSetDropTarget,
    inputRef: { current: null },
    tree: makeEmptyTree(),
    visibleNodes: [],
    toggleFolderExpanded: mockToggleFolderExpanded,
    projectId: "test-project",
    t: ((key: string) => key) as never,
    ...overrides,
  };
}

let coreMockReturn = buildCoreMock();

vi.mock("../useFileTreeCore", () => ({
  useFileTreeCore: () => coreMockReturn,
}));

vi.mock("../useFileTreeKeyboard", () => ({
  handleTreeKeyDown: vi.fn(),
}));

// Must import AFTER mocks are registered
const { useFileTreeState } = await import("../useFileTreeState");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useFileTreeState — shape & CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMockReturn = buildCoreMock();
  });

  // =========================================================================
  // Return shape
  // =========================================================================

  describe("return shape", () => {
    it("should expose all expected public fields and handlers", () => {
      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      const state = result.current;
      expect(state.items).toEqual([]);
      expect(state.currentDocumentId).toEqual(null);
      expect(state.bootstrapStatus).toEqual("ready");
      expect(typeof state.onCreate).toEqual("function");
      expect(typeof state.onCopy).toEqual("function");
      expect(typeof state.onSelect).toEqual("function");
      expect(typeof state.onCommitRename).toEqual("function");
      expect(typeof state.onDelete).toEqual("function");
      expect(typeof state.onToggleStatus).toEqual("function");
      expect(typeof state.onMoveDocumentToFolder).toEqual("function");
      expect(typeof state.onDropOnDocument).toEqual("function");
      expect(typeof state.onTreeKeyDown).toEqual("function");
      expect(typeof state.resolveMoveTargetFolder).toEqual("function");
    });
  });

  // =========================================================================
  // onCreate
  // =========================================================================

  describe("onCreate", () => {
    it("should call createAndSetCurrent, openDocument, and enter rename mode", async () => {
      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() => result.current.onCreate("chapter"));

      expect(mockCreateAndSetCurrent).toHaveBeenCalledWith({
        projectId: "test-project",
        type: "chapter",
      });
      expect(mockOpenDocument).toHaveBeenCalledWith({
        projectId: "test-project",
        documentId: "new-doc",
      });
      expect(mockSetFocusedDocumentId).toHaveBeenCalledWith("new-doc");
      expect(mockSetEditing).toHaveBeenCalledWith({
        mode: "rename",
        documentId: "new-doc",
        title: "files.tree.untitledChapter",
      });
    });

    it("should default to chapter type when no type is specified", async () => {
      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() => result.current.onCreate());

      expect(mockCreateAndSetCurrent).toHaveBeenCalledWith({
        projectId: "test-project",
        type: "chapter",
      });
    });

    it("should not open document or enter rename when creation fails", async () => {
      mockCreateAndSetCurrent.mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() => result.current.onCreate("note"));

      expect(mockOpenDocument).not.toHaveBeenCalled();
      expect(mockSetEditing).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // onDelete
  // =========================================================================

  describe("onDelete", () => {
    it("should show confirm dialog and delete when confirmed", async () => {
      mockConfirm.mockResolvedValueOnce(true);

      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() => result.current.onDelete("doc-1"));

      expect(mockConfirm).toHaveBeenCalledWith({
        title: "files.tree.deleteTitle",
        description: "files.tree.deleteDescription",
        primaryLabel: "files.tree.deleteConfirm",
        secondaryLabel: "files.tree.deleteCancel",
      });
      expect(mockDeleteDocument).toHaveBeenCalledWith({
        projectId: "test-project",
        documentId: "doc-1",
      });
      expect(mockOpenCurrentForProject).toHaveBeenCalledWith("test-project");
    });

    it("should not delete when user cancels confirmation", async () => {
      mockConfirm.mockResolvedValueOnce(false);

      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() => result.current.onDelete("doc-1"));

      expect(mockDeleteDocument).not.toHaveBeenCalled();
    });

    it("should not open current document when deletion fails", async () => {
      mockConfirm.mockResolvedValueOnce(true);
      mockDeleteDocument.mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() => result.current.onDelete("doc-1"));

      expect(mockDeleteDocument).toHaveBeenCalled();
      expect(mockOpenCurrentForProject).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // onCommitRename
  // =========================================================================

  describe("onCommitRename", () => {
    it("should call rename and reset editing to idle on success", async () => {
      coreMockReturn = buildCoreMock({
        editing: { mode: "rename", documentId: "doc-1", title: "New Title" },
      });

      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() => result.current.onCommitRename());

      expect(mockRename).toHaveBeenCalledWith({
        projectId: "test-project",
        documentId: "doc-1",
        title: "New Title",
      });
      expect(mockSetEditing).toHaveBeenCalledWith({ mode: "idle" });
    });

    it("should not call rename when editing mode is idle", async () => {
      coreMockReturn = buildCoreMock({ editing: { mode: "idle" } });

      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() => result.current.onCommitRename());

      expect(mockRename).not.toHaveBeenCalled();
    });

    it("should not reset editing when rename fails", async () => {
      coreMockReturn = buildCoreMock({
        editing: { mode: "rename", documentId: "doc-1", title: "Title" },
      });
      mockRename.mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() => result.current.onCommitRename());

      expect(mockSetEditing).not.toHaveBeenCalled();
    });
  });
});

describe("useFileTreeState — select, status & move", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMockReturn = buildCoreMock();
  });

  // =========================================================================
  // onSelect
  // =========================================================================

  describe("onSelect", () => {
    it("should set focused document, set current, and open document", async () => {
      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() => result.current.onSelect("doc-1"));

      expect(mockSetFocusedDocumentId).toHaveBeenCalledWith("doc-1");
      expect(mockSetCurrent).toHaveBeenCalledWith({
        projectId: "test-project",
        documentId: "doc-1",
      });
      expect(mockOpenDocument).toHaveBeenCalledWith({
        projectId: "test-project",
        documentId: "doc-1",
      });
    });
  });

  // =========================================================================
  // onToggleStatus
  // =========================================================================

  describe("onToggleStatus", () => {
    it("should call updateStatus with next status value", async () => {
      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() =>
        result.current.onToggleStatus({
          documentId: "doc-1",
          next: "final",
        }),
      );

      expect(mockUpdateStatus).toHaveBeenCalledWith({
        projectId: "test-project",
        documentId: "doc-1",
        status: "final",
      });
    });

    it("should reopen document when toggled doc is current", async () => {
      coreMockReturn = buildCoreMock({ currentDocumentId: "doc-1" });

      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() =>
        result.current.onToggleStatus({
          documentId: "doc-1",
          next: "draft",
        }),
      );

      expect(mockOpenDocument).toHaveBeenCalledWith({
        projectId: "test-project",
        documentId: "doc-1",
      });
    });

    it("should not reopen document when toggled doc is not current", async () => {
      coreMockReturn = buildCoreMock({ currentDocumentId: "other-doc" });

      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() =>
        result.current.onToggleStatus({
          documentId: "doc-1",
          next: "final",
        }),
      );

      expect(mockOpenDocument).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // onMoveDocumentToFolder
  // =========================================================================

  describe("onMoveDocumentToFolder", () => {
    it("should call moveToFolder and expand target folder", async () => {
      const nodeA = {
        ...makeItem({ documentId: "doc-a" }),
        children: [],
      };
      const nodeFolder = {
        ...makeItem({ documentId: "folder" }),
        children: [],
      };
      const nodeMap = new Map([
        ["doc-a", nodeA],
        ["folder", nodeFolder],
      ]);
      coreMockReturn = buildCoreMock({
        tree: {
          roots: [nodeA, nodeFolder],
          nodeById: nodeMap,
          parentById: new Map(),
        },
      });

      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() =>
        result.current.onMoveDocumentToFolder({
          documentId: "doc-a",
          parentId: "folder",
        }),
      );

      expect(mockMoveToFolder).toHaveBeenCalledWith({
        projectId: "test-project",
        documentId: "doc-a",
        parentId: "folder",
      });
      expect(mockSetExpandedFolderIds).toHaveBeenCalled();
    });

    it("should not move document to itself", async () => {
      const node = {
        ...makeItem({ documentId: "doc-a" }),
        children: [],
      };
      const nodeMap = new Map([["doc-a", node]]);
      coreMockReturn = buildCoreMock({
        tree: { roots: [node], nodeById: nodeMap, parentById: new Map() },
      });

      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() =>
        result.current.onMoveDocumentToFolder({
          documentId: "doc-a",
          parentId: "doc-a",
        }),
      );

      expect(mockMoveToFolder).not.toHaveBeenCalled();
    });

    it("should not move document into its own descendant", async () => {
      const child = {
        ...makeItem({ documentId: "child" }),
        children: [],
      };
      const parent = {
        ...makeItem({ documentId: "parent" }),
        children: [child],
      };
      const nodeMap = new Map([
        ["parent", parent],
        ["child", child],
      ]);
      coreMockReturn = buildCoreMock({
        tree: { roots: [parent], nodeById: nodeMap, parentById: new Map() },
      });

      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() =>
        result.current.onMoveDocumentToFolder({
          documentId: "parent",
          parentId: "child",
        }),
      );

      expect(mockMoveToFolder).not.toHaveBeenCalled();
    });
  });
});

describe("useFileTreeState — resolve & copy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMockReturn = buildCoreMock();
  });

  // =========================================================================
  // resolveMoveTargetFolder
  // =========================================================================

  describe("resolveMoveTargetFolder", () => {
    it("should return null when no folder candidates exist", () => {
      const node = {
        ...makeItem({ documentId: "doc" }),
        children: [],
      };
      coreMockReturn = buildCoreMock({
        tree: {
          roots: [node],
          nodeById: new Map([["doc", node]]),
          parentById: new Map(),
        },
      });

      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      expect(result.current.resolveMoveTargetFolder("doc")).toEqual(null);
    });

    it("should return first folder candidate excluding self and descendants", () => {
      const leaf = {
        ...makeItem({ documentId: "leaf", title: "Chapter" }),
        children: [],
      };
      const folder = {
        ...makeItem({ documentId: "folder", title: "卷一" }),
        children: [],
      };
      coreMockReturn = buildCoreMock({
        tree: {
          roots: [leaf, folder],
          nodeById: new Map([
            ["leaf", leaf],
            ["folder", folder],
          ]),
          parentById: new Map(),
        },
      });

      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      expect(result.current.resolveMoveTargetFolder("leaf")).toEqual("folder");
    });
  });

  // =========================================================================
  // onCopy
  // =========================================================================

  describe("onCopy", () => {
    it("should create a copy with suffixed title and focus it", async () => {
      const item = makeItem({ documentId: "doc-1", title: "My Chapter" });

      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() => result.current.onCopy(item));

      expect(mockCreateAndSetCurrent).toHaveBeenCalledWith({
        projectId: "test-project",
        type: "chapter",
        title: "files.tree.copySuffix",
      });
      expect(mockOpenDocument).toHaveBeenCalledWith({
        projectId: "test-project",
        documentId: "new-doc",
      });
      expect(mockSetFocusedDocumentId).toHaveBeenCalledWith("new-doc");
    });

    it("should not open document when copy creation fails", async () => {
      mockCreateAndSetCurrent.mockResolvedValueOnce({ ok: false });

      const item = makeItem({ documentId: "doc-1" });
      const { result } = renderHook(() =>
        useFileTreeState("test-project", ((k: string) => k) as never),
      );

      await act(() => result.current.onCopy(item));

      expect(mockOpenDocument).not.toHaveBeenCalled();
    });
  });
});
