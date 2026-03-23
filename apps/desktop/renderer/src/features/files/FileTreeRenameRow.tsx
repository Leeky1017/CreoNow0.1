import React from "react";
import { useTranslation } from "react-i18next";

import { Button, Input } from "../../components/primitives";
import type { EditingState, TreeNode, VisibleTreeNode } from "./fileTreeTypes";

export const FileTreeRenameRow = React.forwardRef<
  HTMLInputElement,
  {
    item: TreeNode;
    entry: VisibleTreeNode;
    editing: { mode: "rename"; documentId: string; title: string };
    dropBefore: boolean;
    setEditing: (state: EditingState) => void;
    onCommitRename: () => Promise<void>;
  }
>(function FileTreeRenameRow(props, ref) {
  const { t } = useTranslation();
  const { item, entry, editing, dropBefore, setEditing } = props;
  return (
    <div
      id={`tree-node-${item.documentId}`}
      key={item.documentId}
      className="relative"
      style={{ paddingLeft: `${entry.depth * 16}px` }}
      role="treeitem"
      aria-level={entry.depth + 1}
      aria-selected={true}
    >
      {dropBefore ? (
        <div
          data-testid={`file-drop-indicator-${item.documentId}`}
          className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--color-accent)]"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--color-info)]" />
        </div>
      ) : null}
      <div
        data-testid={`file-row-${item.documentId}`}
        className="flex items-center gap-2 px-3 h-8 rounded-[var(--radius-sm)] border border-[var(--color-border-focus)] bg-[var(--color-bg-selected)] overflow-hidden"
      >
        <Input
          ref={ref}
          data-testid={`file-rename-input-${item.documentId}`}
          aria-label={t("files.tree.rename")}
          value={editing.title}
          onChange={(e) =>
            setEditing({
              mode: "rename",
              documentId: item.documentId,
              title: e.target.value,
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setEditing({ mode: "idle" });
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              void props.onCommitRename();
            }
          }}
          onBlur={() => void props.onCommitRename()}
          className="h-6 text-xs flex-1 min-w-0 max-w-full focus:border-[var(--color-info)]"
        />
        <div className="flex gap-1 shrink-0">
          <Button
            data-testid={`file-rename-confirm-${item.documentId}`}
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              void props.onCommitRename();
            }}
          >
            {t("files.tree.ok")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditing({ mode: "idle" });
            }}
          >
            {t("files.tree.closeSymbol")}
          </Button>
        </div>
      </div>
    </div>
  );
});
