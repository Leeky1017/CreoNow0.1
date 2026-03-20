import type { Editor } from "@tiptap/react";
import type { IpcResponseData } from "@shared/types/ipc-generated";

export const EDITOR_DOCUMENT_CHARACTER_LIMIT = 1_000_000;
export const LARGE_PASTE_THRESHOLD_CHARS = 2 * 1024 * 1024;
export const LARGE_PASTE_CHUNK_SIZE = 64 * 1024;
export const WRITE_CONTEXT_WINDOW = 240;
export const ENTITY_COMPLETION_LOOKBACK_CHARS = 96;
export const ENTITY_COMPLETION_TRIGGER = "@";
export const EMPTY_EDITOR_DOC: ReturnType<Editor["getJSON"]> = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export type EntityListItem =
  IpcResponseData<"knowledge:entity:list">["items"][number];

export const ALLOWED_PASTE_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "code",
  "pre",
  "h1",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "hr",
]);

export const UNWRAP_TAGS = new Set([
  "span",
  "font",
  "section",
  "article",
  "main",
  "header",
  "footer",
]);

export const DROP_TAGS = new Set([
  "script",
  "style",
  "object",
  "embed",
  "iframe",
  "svg",
  "math",
]);

export function isAiRunning(status: string): boolean {
  return status === "running" || status === "streaming";
}

export function normalizeEntityMatchValue(value: string): string {
  return value.trim().toLowerCase();
}

export function collectEntityCandidates(
  query: string,
  items: EntityListItem[],
): Array<{
  id: string;
  name: string;
  type: EntityListItem["type"];
}> {
  const normalizedQuery = normalizeEntityMatchValue(query);
  if (normalizedQuery.length === 0) {
    return [];
  }

  return items
    .filter((item) => {
      const normalizedName = normalizeEntityMatchValue(item.name);
      if (normalizedName.includes(normalizedQuery)) {
        return true;
      }
      return item.aliases.some((alias) =>
        normalizeEntityMatchValue(alias).includes(normalizedQuery),
      );
    })
    .map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
    }));
}

export function detectEntityCompletionInput(editor: Editor): {
  query: string;
  triggerFrom: number;
  triggerTo: number;
  anchorTop: number;
  anchorLeft: number;
} | null {
  const { state, view } = editor;
  const selection = state.selection;

  if (!selection.empty) {
    return null;
  }

  const triggerTo = selection.from;
  const textFrom = Math.max(1, triggerTo - ENTITY_COMPLETION_LOOKBACK_CHARS);
  const textBeforeCursor = state.doc.textBetween(
    textFrom,
    triggerTo,
    "\n",
    "\n",
  );
  const match = textBeforeCursor.match(/(?:^|\s)@([^\s@]+)$/);

  if (!match) {
    return null;
  }

  const query = match[1];
  if (query.trim().length === 0) {
    return null;
  }

  const triggerFrom = triggerTo - `${ENTITY_COMPLETION_TRIGGER}${query}`.length;
  if (triggerFrom < 1) {
    return null;
  }

  let coords: { bottom: number; left: number };
  try {
    const resolved = view.coordsAtPos(triggerTo);
    coords = { bottom: resolved.bottom, left: resolved.left };
  } catch {
    // JSDOM does not fully implement geometry APIs used by ProseMirror.
    coords = { bottom: 0, left: 0 };
  }
  return {
    query,
    triggerFrom,
    triggerTo,
    anchorTop: coords.bottom + 6,
    anchorLeft: coords.left,
  };
}

export function buildWriteInput(editor: Editor): string {
  const cursor = editor.state.selection.to;
  const from = Math.max(1, cursor - WRITE_CONTEXT_WINDOW);
  const nearCursor = editor.state.doc
    .textBetween(from, cursor, "\n", "\n")
    .trim();
  if (nearCursor.length > 0) {
    return `Continue writing from cursor context:\n${nearCursor}`;
  }

  const fallback = editor.state.doc.textContent.trim();
  if (fallback.length > 0) {
    return `Continue writing from cursor context:\n${fallback.slice(-WRITE_CONTEXT_WINDOW)}`;
  }
  return "Continue writing from cursor context:";
}

export function parseEditorContentJsonSafely(
  contentJson: string,
): ReturnType<Editor["getJSON"]> {
  try {
    return JSON.parse(contentJson) as ReturnType<Editor["getJSON"]>;
  } catch {
    return EMPTY_EDITOR_DOC;
  }
}

export function chunkLargePasteText(
  text: string,
  chunkSize = LARGE_PASTE_CHUNK_SIZE,
): string[] {
  if (chunkSize <= 0) {
    return [text];
  }
  if (text.length === 0) {
    return [];
  }
  const chunks: string[] = [];
  for (let cursor = 0; cursor < text.length; cursor += chunkSize) {
    chunks.push(text.slice(cursor, cursor + chunkSize));
  }
  return chunks;
}

export function shouldWarnDocumentCapacity(
  currentLength: number,
  limit = EDITOR_DOCUMENT_CHARACTER_LIMIT,
): boolean {
  return currentLength >= limit;
}

export function shouldConfirmOverflowPaste(args: {
  currentLength: number;
  pasteLength: number;
  limit?: number;
}): boolean {
  const limit = args.limit ?? EDITOR_DOCUMENT_CHARACTER_LIMIT;
  return args.currentLength + args.pasteLength > limit;
}

export function sanitizePastedHtml(inputHtml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(inputHtml, "text/html");
  const { body } = doc;

  const sanitizeElement = (element: HTMLElement): void => {
    const children = Array.from(element.childNodes);
    for (const child of children) {
      if (child.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }

      const childElement = child as HTMLElement;
      const tag = childElement.tagName.toLowerCase();

      if (DROP_TAGS.has(tag)) {
        childElement.remove();
        continue;
      }

      if (tag === "div") {
        const paragraph = doc.createElement("p");
        while (childElement.firstChild) {
          paragraph.appendChild(childElement.firstChild);
        }
        childElement.replaceWith(paragraph);
        sanitizeElement(paragraph);
        continue;
      }

      if (UNWRAP_TAGS.has(tag) || !ALLOWED_PASTE_TAGS.has(tag)) {
        while (childElement.firstChild) {
          element.insertBefore(childElement.firstChild, childElement);
        }
        childElement.remove();
        continue;
      }

      for (const attr of Array.from(childElement.attributes)) {
        childElement.removeAttribute(attr.name);
      }

      sanitizeElement(childElement);
    }
  };

  sanitizeElement(body);

  for (const child of Array.from(body.childNodes)) {
    if (child.nodeType !== Node.TEXT_NODE) {
      continue;
    }
    const value = child.textContent ?? "";
    if (value.trim().length === 0) {
      child.remove();
      continue;
    }
    const paragraph = doc.createElement("p");
    paragraph.textContent = value;
    child.replaceWith(paragraph);
  }

  return body.innerHTML;
}
