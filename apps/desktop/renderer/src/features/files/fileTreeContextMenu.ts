import type { useTranslation } from "react-i18next";
import type { ContextMenuItem } from "../../components/primitives";
import type { EditingState, TreeNode } from "./fileTreeTypes";

export interface ContextMenuDeps {
  t: ReturnType<typeof useTranslation>["t"];
  setEditing: (state: EditingState) => void;
  onCopy: (item: TreeNode) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
  onToggleStatus: (args: {
    documentId: string;
    next: "draft" | "final";
  }) => Promise<void>;
  onMoveDocumentToFolder: (args: {
    documentId: string;
    parentId: string;
  }) => Promise<void>;
  onOpenVersionHistory?: (documentId: string) => void;
}

export function buildNodeContextMenuItems(
  item: TreeNode,
  moveTargetFolderId: string | null,
  deps: ContextMenuDeps,
): ContextMenuItem[] {
  const moveToFolderDisabled = !moveTargetFolderId;
  return [
    {
      key: "rename",
      label: deps.t("files.tree.rename"),
      shortcut: "F2",
      onSelect: () => {
        deps.setEditing({
          mode: "rename",
          documentId: item.documentId,
          title: item.title,
        });
      },
    },
    {
      key: "copy",
      label: deps.t("files.tree.copy"),
      onSelect: () => void deps.onCopy(item),
    },
    {
      key: "move",
      label: deps.t("files.tree.moveToFolder"),
      disabled: moveToFolderDisabled,
      onSelect: () => {
        if (!moveTargetFolderId) {
          return;
        }
        void deps.onMoveDocumentToFolder({
          documentId: item.documentId,
          parentId: moveTargetFolderId,
        });
      },
    },
    {
      key: "delete",
      label: deps.t("files.tree.delete"),
      shortcut: "Del",
      onSelect: () => void deps.onDelete(item.documentId),
      destructive: true,
    },
    {
      key: "version-history",
      label: deps.t("files.tree.versionHistory"),
      onSelect: () => {
        deps.onOpenVersionHistory?.(item.documentId);
      },
    },
    {
      key: "status",
      label:
        item.status === "final"
          ? deps.t("files.tree.markAsDraft")
          : deps.t("files.tree.markAsFinal"),
      onSelect: () =>
        void deps.onToggleStatus({
          documentId: item.documentId,
          next: item.status === "final" ? "draft" : "final",
        }),
    },
  ];
}
