import React from "react";
import { useTranslation } from "react-i18next";
import type { Editor } from "@tiptap/react";

import { useOverflowDetection } from "./useOverflowDetection";
import { ToolbarFormatGroup } from "./ToolbarFormatGroup";
import { ToolbarBlockGroup, ToolbarButton } from "./ToolbarBlockGroup";
import { MoreHorizontal } from "lucide-react";

function ToolbarSeparator(): JSX.Element {
  return <div className="mx-1 h-4 w-px bg-[var(--color-border-default)]" />;
}

export interface EditorToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
  className?: string;
}

export function EditorToolbar({
  editor,
  disabled = false,
  className,
}: EditorToolbarProps): JSX.Element | null {
  const { t } = useTranslation();
  const { containerRef, isOverflowing } = useOverflowDetection();
  const [overflowMenuOpen, setOverflowMenuOpen] = React.useState(false);

  if (!editor) {
    return null;
  }

  return (
    <div
      data-testid="editor-toolbar"
      className={`relative flex items-center gap-0.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-1.5 ${className ?? ""}`}
    >
      <div
        ref={containerRef}
        data-testid="editor-toolbar-buttons"
        className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden"
      >
        <ToolbarFormatGroup editor={editor} disabled={disabled} />
        <ToolbarSeparator />
        <ToolbarBlockGroup editor={editor} disabled={disabled} />
      </div>

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
              <ToolbarFormatGroup
                editor={editor}
                disabled={disabled}
                testIdPrefix="overflow"
                onItemClick={() => setOverflowMenuOpen(false)}
              />
              <ToolbarSeparator />
              <ToolbarBlockGroup
                editor={editor}
                disabled={disabled}
                testIdPrefix="overflow"
                onItemClick={() => setOverflowMenuOpen(false)}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
