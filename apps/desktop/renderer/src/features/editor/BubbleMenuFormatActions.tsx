import React from "react";
import type { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";

import { InlineFormatButton } from "./InlineFormatButton";
import { Button } from "../../components/primitives/Button";
import { Input } from "../../components/primitives/Input";
import { EDITOR_SHORTCUTS } from "../../config/shortcuts";

import {
  Bold,
  Check,
  Code,
  Italic,
  Link,
  Strikethrough,
  Underline,
  X,
} from "lucide-react";

const formatIcons = {
  bold: <Bold size={16} strokeWidth={1.5} />,
  italic: <Italic size={16} strokeWidth={1.5} />,
  underline: <Underline size={16} strokeWidth={1.5} />,
  strike: <Strikethrough size={16} strokeWidth={1.5} />,
  code: <Code size={16} strokeWidth={1.5} />,
  link: <Link size={16} strokeWidth={1.5} />,
};

export function BubbleMenuFormatActions(props: {
  editor: Editor;
  inlineDisabled: boolean;
}): JSX.Element {
  const { editor, inlineDisabled } = props;
  const { t } = useTranslation();
  const [linkInputOpen, setLinkInputOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState("");
  const linkInputRef = React.useRef<HTMLInputElement>(null);

  const openLinkInput = () => {
    const existingHref = editor.getAttributes("link").href as
      | string
      | undefined;
    setLinkUrl(existingHref ?? "");
    setLinkInputOpen(true);
    requestAnimationFrame(() => linkInputRef.current?.focus());
  };

  const applyLink = () => {
    const trimmed = linkUrl.trim();
    if (trimmed.length === 0) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: trimmed }).run();
    }
    setLinkInputOpen(false);
    setLinkUrl("");
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    setLinkInputOpen(false);
    setLinkUrl("");
  };

  const handleLinkKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyLink();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setLinkInputOpen(false);
      setLinkUrl("");
      editor.commands.focus();
    }
  };

  return (
    <>
      <InlineFormatButton
        testId="bubble-bold"
        label={EDITOR_SHORTCUTS.bold.label}
        shortcut={EDITOR_SHORTCUTS.bold.display()}
        isActive={editor.isActive("bold")}
        disabled={inlineDisabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        {formatIcons.bold}
      </InlineFormatButton>
      <InlineFormatButton
        testId="bubble-italic"
        label={EDITOR_SHORTCUTS.italic.label}
        shortcut={EDITOR_SHORTCUTS.italic.display()}
        isActive={editor.isActive("italic")}
        disabled={inlineDisabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        {formatIcons.italic}
      </InlineFormatButton>
      <InlineFormatButton
        testId="bubble-underline"
        label={EDITOR_SHORTCUTS.underline.label}
        shortcut={EDITOR_SHORTCUTS.underline.display()}
        isActive={editor.isActive("underline")}
        disabled={inlineDisabled}
        onClick={() => editor.chain().focus().toggleMark("underline").run()}
      >
        {formatIcons.underline}
      </InlineFormatButton>
      <InlineFormatButton
        testId="bubble-strike"
        label={EDITOR_SHORTCUTS.strikethrough.label}
        shortcut={EDITOR_SHORTCUTS.strikethrough.display()}
        isActive={editor.isActive("strike")}
        disabled={inlineDisabled}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        {formatIcons.strike}
      </InlineFormatButton>
      <InlineFormatButton
        testId="bubble-code"
        // eslint-disable-next-line creonow/no-raw-error-code-in-ui -- false positive: EDITOR_SHORTCUTS.code refers to code-formatting shortcut, not error code
        label={EDITOR_SHORTCUTS.code.label}
        // eslint-disable-next-line creonow/no-raw-error-code-in-ui -- false positive: EDITOR_SHORTCUTS.code refers to code-formatting shortcut, not error code
        shortcut={EDITOR_SHORTCUTS.code.display()}
        isActive={editor.isActive("code")}
        disabled={inlineDisabled}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        {/* eslint-disable-next-line creonow/no-raw-error-code-in-ui -- false positive: formatIcons.code is the code-formatting icon */}
        {formatIcons.code}
      </InlineFormatButton>
      <InlineFormatButton
        testId="bubble-link"
        label={t("editor.bubbleMenu.link")}
        isActive={editor.isActive("link")}
        disabled={inlineDisabled}
        onClick={openLinkInput}
      >
        {formatIcons.link}
      </InlineFormatButton>
      {linkInputOpen && (
        <div
          className="flex items-center gap-1 px-1"
          data-testid="link-input-container"
        >
          <Input
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={handleLinkKeyDown}
            placeholder={t("editor.link.placeholder")}
            aria-label={t("editor.link.placeholder")}
            className="h-6 w-40 px-2 text-[11px] rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)] text-[var(--color-fg-default)] border border-[var(--color-border-default)] focus-visible:border-[var(--color-border-focus)] focus-visible:outline-none"
          />
          <Button
            data-testid="link-apply"
            onClick={applyLink}
            aria-label={t("editor.link.apply")}
            variant="ghost"
            size="sm"
            className="h-6 min-w-0 px-1 text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
          >
            <Check size={16} strokeWidth={1.5} />
          </Button>
          {editor.isActive("link") && (
            <Button
              data-testid="link-remove"
              onClick={removeLink}
              aria-label={t("editor.link.remove")}
              variant="ghost"
              size="sm"
              className="h-6 min-w-0 px-1 text-[var(--color-fg-muted)] hover:text-[var(--color-fg-danger)]"
            >
              <X size={16} strokeWidth={1.5} />
            </Button>
          )}
        </div>
      )}
    </>
  );
}
