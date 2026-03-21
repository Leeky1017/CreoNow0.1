import React from "react";
import { useTranslation } from "react-i18next";
import type { Editor } from "@tiptap/react";

import { useOverflowDetection } from "./useOverflowDetection";
import {
  ToolbarButton,
  getToolbarItems,
  renderToolbarItem,
} from "./ToolbarFormatGroup";

import { MoreHorizontal } from "lucide-react";

export interface EditorToolbarProps {
  /** TipTap editor instance */
  editor: Editor | null;
  /** Disable all toolbar actions (used in read-only preview mode) */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * EditorToolbar provides formatting controls for the TipTap editor.
 *
 * Why: Writers need quick access to formatting options without memorizing shortcuts.
 * Shortcuts are provided in tooltips for power users.
 *
 * When the toolbar overflows its container, a "More" menu appears with all
 * toolbar items — data-driven, not hardcoded — so every action remains accessible.
 */
export function EditorToolbar({
  editor,
  disabled = false,
  className,
}: EditorToolbarProps): JSX.Element | null {
  const { t } = useTranslation();
  const { containerRef, isOverflowing } = useOverflowDetection();
  const [overflowMenuOpen, setOverflowMenuOpen] = React.useState(false);
  const TOOLBAR_ITEMS = getToolbarItems(t);

  if (!editor) {
    return null;
  }

  const inlineDisabled = !editor.isEditable || editor.isActive("codeBlock");

  return (
    <div
      data-testid="editor-toolbar"
      className={[
        "relative flex items-center gap-0.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-1.5",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        ref={containerRef}
        data-testid="editor-toolbar-buttons"
        className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden"
      >
        {TOOLBAR_ITEMS.map((item, i) =>
          renderToolbarItem(item, editor, disabled, inlineDisabled, i),
        )}
      </div>

      {/* Overflow "More" menu — data-driven: renders all toolbar items so
          every action remains accessible when the toolbar width is constrained */}
      {isOverflowing ? (
        <div className="relative ml-auto flex-shrink-0">
          <ToolbarButton
            testId="toolbar-overflow-trigger"
            label={t("editor.toolbar.more")}
            onClick={() => setOverflowMenuOpen((prev) => !prev)}
            isActive={overflowMenuOpen}
          >
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </ToolbarButton>
          {overflowMenuOpen ? (
            <div
              data-testid="toolbar-overflow-menu"
              className="absolute right-0 top-full z-[var(--z-overlay)] mt-1 flex flex-col gap-0.5 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-1.5 shadow-[var(--shadow-md)]"
            >
              {TOOLBAR_ITEMS.map((item, i) =>
                renderToolbarItem(
                  item,
                  editor,
                  disabled,
                  inlineDisabled,
                  i,
                  () => setOverflowMenuOpen(false),
                  "overflow",
                ),
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
