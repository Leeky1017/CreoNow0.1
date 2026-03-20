import type { EditorView } from "@tiptap/pm/view";
import type { TFunction } from "i18next";

import {
  LARGE_PASTE_THRESHOLD_CHARS,
  EDITOR_DOCUMENT_CHARACTER_LIMIT,
  chunkLargePasteText,
  shouldConfirmOverflowPaste,
} from "./editorPaneHelpers";

export function handleEditorPaste(
  t: TFunction,
  view: EditorView,
  event: ClipboardEvent,
): boolean {
  const clipboardText = event.clipboardData?.getData("text/plain") ?? "";
  if (clipboardText.length < LARGE_PASTE_THRESHOLD_CHARS) {
    return false;
  }

  event.preventDefault();

  const currentLength = view.state.doc.textContent.length;
  const chunks = chunkLargePasteText(clipboardText);
  if (chunks.length === 0) {
    return true;
  }

  const overflow = shouldConfirmOverflowPaste({
    currentLength,
    pasteLength: clipboardText.length,
  });
  const shouldContinueOverflow =
    !overflow || window.confirm(t("editor.pane.pasteLimitExceeded"));

  const allowedLength = shouldContinueOverflow
    ? clipboardText.length
    : Math.max(EDITOR_DOCUMENT_CHARACTER_LIMIT - currentLength, 0);
  if (allowedLength <= 0) {
    return true;
  }

  let remaining = allowedLength;
  for (const chunk of chunks) {
    if (remaining <= 0) {
      break;
    }
    const nextChunk = chunk.slice(0, remaining);
    const tr = view.state.tr.insertText(
      nextChunk,
      view.state.selection.from,
      view.state.selection.to,
    );
    view.dispatch(tr);
    remaining -= nextChunk.length;
  }
  return true;
}
