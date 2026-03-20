import type { DocumentListItem, DocumentType } from "../../stores/fileStore";

export type EditingState =
  | { mode: "idle" }
  | { mode: "rename"; documentId: string; title: string };

export type DropMode = "before" | "into";

export type DropTargetState = {
  documentId: string;
  mode: DropMode;
};

export type TreeNode = DocumentListItem & {
  children: TreeNode[];
};

export type TreeSnapshot = {
  roots: TreeNode[];
  nodeById: Map<string, TreeNode>;
  parentById: Map<string, string | null>;
};

export type VisibleTreeNode = {
  node: TreeNode;
  depth: number;
  parentId: string | null;
};

export interface FileTreePanelProps {
  projectId: string;
  onOpenVersionHistory?: (documentId: string) => void;
  /**
   * 首次渲染时自动进入某个文档的 Rename 模式。
   *
   * Why: 仅用于 Storybook/QA 快速复现并验证 Rename 溢出问题，避免依赖复杂交互路径。
   */
  initialRenameDocumentId?: string;
}

export type { DocumentListItem, DocumentType };
