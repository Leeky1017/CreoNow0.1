import type { Editor } from "@tiptap/react";

import { EDITOR_SHORTCUTS } from "../../config/shortcuts";
import { InlineFormatButton } from "./InlineFormatButton";
import { Bold, Italic, Underline, Strikethrough, Code } from "lucide-react";

export interface ToolbarFormatGroupProps {
  editor: Editor;
  disabled: boolean;
  testIdPrefix?: string;
  onItemClick?: () => void;
}

export function ToolbarFormatGroup({
  editor,
  disabled,
  testIdPrefix,
  onItemClick,
}: ToolbarFormatGroupProps): JSX.Element {
  const inlineDisabled =
    disabled || !editor.isEditable || editor.isActive("codeBlock");
  const tid = (base: string) =>
    testIdPrefix ? `${testIdPrefix}-${base}` : `toolbar-${base}`;

  const wrap = (action: () => void) => () => {
    action();
    onItemClick?.();
  };

  return (
    <>
      <InlineFormatButton
        testId={tid("bold")}
        label={EDITOR_SHORTCUTS.bold.label}
        shortcut={EDITOR_SHORTCUTS.bold.display()}
        isActive={editor.isActive("bold")}
        disabled={inlineDisabled}
        onClick={wrap(() => editor.chain().focus().toggleBold().run())}
      >
        <Bold size={16} strokeWidth={1.5} />
      </InlineFormatButton>
      <InlineFormatButton
        testId={tid("italic")}
        label={EDITOR_SHORTCUTS.italic.label}
        shortcut={EDITOR_SHORTCUTS.italic.display()}
        isActive={editor.isActive("italic")}
        disabled={inlineDisabled}
        onClick={wrap(() => editor.chain().focus().toggleItalic().run())}
      >
        <Italic size={16} strokeWidth={1.5} />
      </InlineFormatButton>
      <InlineFormatButton
        testId={tid("underline")}
        label={EDITOR_SHORTCUTS.underline.label}
        shortcut={EDITOR_SHORTCUTS.underline.display()}
        isActive={editor.isActive("underline")}
        disabled={inlineDisabled}
        onClick={wrap(() =>
          editor.chain().focus().toggleMark("underline").run(),
        )}
      >
        <Underline size={16} strokeWidth={1.5} />
      </InlineFormatButton>
      <InlineFormatButton
        testId={tid("strike")}
        label={EDITOR_SHORTCUTS.strikethrough.label}
        shortcut={EDITOR_SHORTCUTS.strikethrough.display()}
        isActive={editor.isActive("strike")}
        disabled={inlineDisabled}
        onClick={wrap(() => editor.chain().focus().toggleStrike().run())}
      >
        <Strikethrough size={16} strokeWidth={1.5} />
      </InlineFormatButton>
      <InlineFormatButton
        testId={tid("code")}
        // eslint-disable-next-line creonow/no-raw-error-code-in-ui -- false positive: EDITOR_SHORTCUTS.code refers to code-formatting shortcut, not error code
        label={EDITOR_SHORTCUTS.code.label}
        // eslint-disable-next-line creonow/no-raw-error-code-in-ui -- false positive: EDITOR_SHORTCUTS.code refers to code-formatting shortcut, not error code
        shortcut={EDITOR_SHORTCUTS.code.display()}
        isActive={editor.isActive("code")}
        disabled={inlineDisabled}
        onClick={wrap(() => editor.chain().focus().toggleCode().run())}
      >
        <Code size={16} strokeWidth={1.5} />
      </InlineFormatButton>
    </>
  );
}
