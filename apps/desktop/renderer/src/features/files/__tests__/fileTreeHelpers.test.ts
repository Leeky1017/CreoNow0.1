import { describe, it, expect } from "vitest";

import type { DocumentListItem, TreeNode } from "../fileTreeTypes";
import {
  iconForType,
  defaultTitleI18nKey,
  compareDocumentOrder,
  buildTreeSnapshot,
  isFolderCandidate,
  flattenTree,
  collectDescendantIds,
  buildReorderedDocumentIds,
} from "../fileTreeHelpers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// iconForType
// ---------------------------------------------------------------------------

describe("iconForType", () => {
  it("should return 📄 for chapter type", () => {
    expect(iconForType("chapter")).toEqual("📄");
  });

  it("should return 📝 for note type", () => {
    expect(iconForType("note")).toEqual("📝");
  });

  it("should return 📘 for setting type", () => {
    expect(iconForType("setting")).toEqual("📘");
  });

  it("should return 🕒 for timeline type", () => {
    expect(iconForType("timeline")).toEqual("🕒");
  });

  it("should return 👤 for character type", () => {
    expect(iconForType("character")).toEqual("👤");
  });

  it("should return 📄 for unknown type as fallback", () => {
    expect(iconForType("unknown" as never)).toEqual("📄");
  });
});

// ---------------------------------------------------------------------------
// defaultTitleI18nKey
// ---------------------------------------------------------------------------

describe("defaultTitleI18nKey", () => {
  it("should return chapter i18n key for chapter type", () => {
    expect(defaultTitleI18nKey("chapter")).toEqual(
      "files.tree.untitledChapter",
    );
  });

  it("should return note i18n key for note type", () => {
    expect(defaultTitleI18nKey("note")).toEqual("files.tree.untitledNote");
  });

  it("should return setting i18n key for setting type", () => {
    expect(defaultTitleI18nKey("setting")).toEqual(
      "files.tree.untitledSetting",
    );
  });

  it("should return timeline i18n key for timeline type", () => {
    expect(defaultTitleI18nKey("timeline")).toEqual(
      "files.tree.untitledTimeline",
    );
  });

  it("should return character i18n key for character type", () => {
    expect(defaultTitleI18nKey("character")).toEqual(
      "files.tree.untitledCharacter",
    );
  });

  it("should return generic untitled key for unknown type", () => {
    expect(defaultTitleI18nKey("unknown" as never)).toEqual(
      "files.tree.untitled",
    );
  });
});

// ---------------------------------------------------------------------------
// compareDocumentOrder
// ---------------------------------------------------------------------------

describe("compareDocumentOrder", () => {
  it("should sort by sortOrder when values differ", () => {
    const a = makeItem({ documentId: "a", sortOrder: 1 });
    const b = makeItem({ documentId: "b", sortOrder: 2 });
    expect(compareDocumentOrder(a, b)).toBeLessThan(0);
    expect(compareDocumentOrder(b, a)).toBeGreaterThan(0);
  });

  it("should sort by updatedAt descending when sortOrder values are equal", () => {
    const a = makeItem({ documentId: "a", sortOrder: 0, updatedAt: 2000 });
    const b = makeItem({ documentId: "b", sortOrder: 0, updatedAt: 1000 });
    // more recent (higher updatedAt) should come first → negative result
    expect(compareDocumentOrder(a, b)).toBeLessThan(0);
    expect(compareDocumentOrder(b, a)).toBeGreaterThan(0);
  });

  it("should fall back to documentId comparison when sortOrder and updatedAt are equal", () => {
    const a = makeItem({ documentId: "alpha", sortOrder: 0, updatedAt: 1000 });
    const b = makeItem({ documentId: "beta", sortOrder: 0, updatedAt: 1000 });
    expect(compareDocumentOrder(a, b)).toBeLessThan(0);
    expect(compareDocumentOrder(b, a)).toBeGreaterThan(0);
  });

  it("should return 0 for identical items", () => {
    const a = makeItem({ documentId: "x", sortOrder: 0, updatedAt: 1000 });
    expect(compareDocumentOrder(a, a)).toEqual(0);
  });
});

// ---------------------------------------------------------------------------
// buildTreeSnapshot
// ---------------------------------------------------------------------------

describe("buildTreeSnapshot", () => {
  it("should return empty roots for empty input", () => {
    const snapshot = buildTreeSnapshot([]);
    expect(snapshot.roots).toEqual([]);
    expect(snapshot.nodeById.size).toEqual(0);
    expect(snapshot.parentById.size).toEqual(0);
  });

  it("should place root-level items (no parentId) as roots", () => {
    const items = [
      makeItem({ documentId: "a", sortOrder: 0 }),
      makeItem({ documentId: "b", sortOrder: 1 }),
    ];
    const snapshot = buildTreeSnapshot(items);

    expect(snapshot.roots.length).toEqual(2);
    expect(snapshot.roots.map((r) => r.documentId)).toEqual(["a", "b"]);
    expect(snapshot.parentById.get("a")).toEqual(null);
    expect(snapshot.parentById.get("b")).toEqual(null);
  });

  it("should nest children under their parent", () => {
    const items = [
      makeItem({ documentId: "folder", sortOrder: 0, title: "卷一" }),
      makeItem({ documentId: "child", sortOrder: 1, parentId: "folder" }),
    ];
    const snapshot = buildTreeSnapshot(items);

    expect(snapshot.roots.length).toEqual(1);
    expect(snapshot.roots[0].documentId).toEqual("folder");
    expect(snapshot.roots[0].children.length).toEqual(1);
    expect(snapshot.roots[0].children[0].documentId).toEqual("child");
    expect(snapshot.parentById.get("child")).toEqual("folder");
  });

  it("should handle deeply nested folder structures", () => {
    const items = [
      makeItem({ documentId: "root", sortOrder: 0 }),
      makeItem({ documentId: "mid", sortOrder: 1, parentId: "root" }),
      makeItem({ documentId: "leaf", sortOrder: 2, parentId: "mid" }),
    ];
    const snapshot = buildTreeSnapshot(items);

    expect(snapshot.roots.length).toEqual(1);
    const root = snapshot.roots[0];
    expect(root.children.length).toEqual(1);
    expect(root.children[0].children.length).toEqual(1);
    expect(root.children[0].children[0].documentId).toEqual("leaf");
  });

  it("should treat item with nonexistent parentId as root", () => {
    const items = [
      makeItem({ documentId: "orphan", sortOrder: 0, parentId: "missing" }),
    ];
    const snapshot = buildTreeSnapshot(items);

    expect(snapshot.roots.length).toEqual(1);
    expect(snapshot.roots[0].documentId).toEqual("orphan");
    expect(snapshot.parentById.get("orphan")).toEqual(null);
  });

  it("should treat self-referencing parentId as root", () => {
    const items = [
      makeItem({ documentId: "self", sortOrder: 0, parentId: "self" }),
    ];
    const snapshot = buildTreeSnapshot(items);

    expect(snapshot.roots.length).toEqual(1);
    expect(snapshot.roots[0].documentId).toEqual("self");
  });

  it("should sort children within each parent by compareDocumentOrder", () => {
    const items = [
      makeItem({ documentId: "parent", sortOrder: 0 }),
      makeItem({
        documentId: "child-b",
        sortOrder: 2,
        parentId: "parent",
      }),
      makeItem({
        documentId: "child-a",
        sortOrder: 1,
        parentId: "parent",
      }),
    ];
    const snapshot = buildTreeSnapshot(items);
    const childIds = snapshot.roots[0].children.map((c) => c.documentId);
    expect(childIds).toEqual(["child-a", "child-b"]);
  });

  it("should populate nodeById for all items", () => {
    const items = [
      makeItem({ documentId: "a", sortOrder: 0 }),
      makeItem({ documentId: "b", sortOrder: 1 }),
    ];
    const snapshot = buildTreeSnapshot(items);

    expect(snapshot.nodeById.has("a")).toEqual(true);
    expect(snapshot.nodeById.has("b")).toEqual(true);
    expect(snapshot.nodeById.get("a")?.documentId).toEqual("a");
  });
});

// ---------------------------------------------------------------------------
// isFolderCandidate
// ---------------------------------------------------------------------------

describe("isFolderCandidate", () => {
  it("should return true when node has children", () => {
    const node: Pick<TreeNode, "title" | "children"> = {
      title: "Chapter 1",
      children: [{ ...makeItem({ documentId: "c" }), children: [] }],
    };
    expect(isFolderCandidate(node)).toEqual(true);
  });

  it("should return true when title contains 卷", () => {
    const node: Pick<TreeNode, "title" | "children"> = {
      title: "第一卷",
      children: [],
    };
    expect(isFolderCandidate(node)).toEqual(true);
  });

  it("should return true when title contains folder (case insensitive)", () => {
    const node: Pick<TreeNode, "title" | "children"> = {
      title: "My Folder",
      children: [],
    };
    expect(isFolderCandidate(node)).toEqual(true);
  });

  it("should return false for leaf node without folder-like title", () => {
    const node: Pick<TreeNode, "title" | "children"> = {
      title: "Chapter 1",
      children: [],
    };
    expect(isFolderCandidate(node)).toEqual(false);
  });
});

// ---------------------------------------------------------------------------
// flattenTree
// ---------------------------------------------------------------------------

describe("flattenTree", () => {
  it("should return empty array for empty roots", () => {
    expect(flattenTree([], new Set(), new Map())).toEqual([]);
  });

  it("should flatten root-only tree with depth 0", () => {
    const items = [
      makeItem({ documentId: "a", sortOrder: 0 }),
      makeItem({ documentId: "b", sortOrder: 1 }),
    ];
    const snap = buildTreeSnapshot(items);
    const visible = flattenTree(snap.roots, new Set(), snap.parentById);

    expect(visible.length).toEqual(2);
    expect(visible[0].depth).toEqual(0);
    expect(visible[1].depth).toEqual(0);
  });

  it("should show children when parent is expanded", () => {
    const items = [
      makeItem({ documentId: "parent", sortOrder: 0 }),
      makeItem({ documentId: "child", sortOrder: 1, parentId: "parent" }),
    ];
    const snap = buildTreeSnapshot(items);
    const expanded = new Set(["parent"]);
    const visible = flattenTree(snap.roots, expanded, snap.parentById);

    expect(visible.length).toEqual(2);
    expect(visible[0].node.documentId).toEqual("parent");
    expect(visible[0].depth).toEqual(0);
    expect(visible[1].node.documentId).toEqual("child");
    expect(visible[1].depth).toEqual(1);
  });

  it("should hide children when parent is collapsed", () => {
    const items = [
      makeItem({ documentId: "parent", sortOrder: 0 }),
      makeItem({ documentId: "child", sortOrder: 1, parentId: "parent" }),
    ];
    const snap = buildTreeSnapshot(items);
    const visible = flattenTree(snap.roots, new Set(), snap.parentById);

    expect(visible.length).toEqual(1);
    expect(visible[0].node.documentId).toEqual("parent");
  });

  it("should include parentId in visible nodes", () => {
    const items = [
      makeItem({ documentId: "parent", sortOrder: 0 }),
      makeItem({ documentId: "child", sortOrder: 1, parentId: "parent" }),
    ];
    const snap = buildTreeSnapshot(items);
    const expanded = new Set(["parent"]);
    const visible = flattenTree(snap.roots, expanded, snap.parentById);

    expect(visible[0].parentId).toEqual(null);
    expect(visible[1].parentId).toEqual("parent");
  });
});

// ---------------------------------------------------------------------------
// collectDescendantIds
// ---------------------------------------------------------------------------

describe("collectDescendantIds", () => {
  it("should return empty set for leaf node", () => {
    const leaf: TreeNode = {
      ...makeItem({ documentId: "leaf" }),
      children: [],
    };
    expect(collectDescendantIds(leaf).size).toEqual(0);
  });

  it("should collect all descendant ids recursively", () => {
    const grandchild: TreeNode = {
      ...makeItem({ documentId: "gc" }),
      children: [],
    };
    const child: TreeNode = {
      ...makeItem({ documentId: "c" }),
      children: [grandchild],
    };
    const root: TreeNode = {
      ...makeItem({ documentId: "r" }),
      children: [child],
    };

    const ids = collectDescendantIds(root);
    expect(ids.has("c")).toEqual(true);
    expect(ids.has("gc")).toEqual(true);
    expect(ids.has("r")).toEqual(false);
  });
});

// ---------------------------------------------------------------------------
// buildReorderedDocumentIds
// ---------------------------------------------------------------------------

describe("buildReorderedDocumentIds", () => {
  it("should reorder siblings by moving source before target", () => {
    const items = [
      makeItem({ documentId: "a", sortOrder: 0 }),
      makeItem({ documentId: "b", sortOrder: 1 }),
      makeItem({ documentId: "c", sortOrder: 2 }),
    ];

    const result = buildReorderedDocumentIds({
      items,
      sourceDocumentId: "c",
      targetDocumentId: "a",
      targetParentId: null,
    });

    expect(result).toEqual(["c", "a", "b"]);
  });

  it("should return null when source is not among siblings", () => {
    const items = [
      makeItem({ documentId: "a", sortOrder: 0 }),
      makeItem({ documentId: "b", sortOrder: 1, parentId: "a" }),
    ];

    const result = buildReorderedDocumentIds({
      items,
      sourceDocumentId: "b",
      targetDocumentId: "a",
      targetParentId: null,
    });

    expect(result).toEqual(null);
  });

  it("should return null when target is not among siblings", () => {
    const items = [
      makeItem({ documentId: "a", sortOrder: 0 }),
      makeItem({ documentId: "b", sortOrder: 1, parentId: "a" }),
    ];

    const result = buildReorderedDocumentIds({
      items,
      sourceDocumentId: "a",
      targetDocumentId: "b",
      targetParentId: null,
    });

    expect(result).toEqual(null);
  });

  it("should preserve non-sibling ids in global order", () => {
    const items = [
      makeItem({ documentId: "root-a", sortOrder: 0 }),
      makeItem({ documentId: "child", sortOrder: 1, parentId: "root-a" }),
      makeItem({ documentId: "root-b", sortOrder: 2 }),
    ];

    const result = buildReorderedDocumentIds({
      items,
      sourceDocumentId: "root-b",
      targetDocumentId: "root-a",
      targetParentId: null,
    });

    // root-b moves before root-a; child stays in its relative position
    expect(result).not.toEqual(null);
    expect(result!.indexOf("child")).toBeGreaterThan(-1);
  });
});
