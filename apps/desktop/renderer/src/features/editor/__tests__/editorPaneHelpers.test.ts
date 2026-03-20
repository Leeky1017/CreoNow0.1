import { describe, expect, it } from "vitest";

import {
  isAiRunning,
  parseEditorContentJsonSafely,
  chunkLargePasteText,
  shouldWarnDocumentCapacity,
  shouldConfirmOverflowPaste,
  sanitizePastedHtml,
  EDITOR_DOCUMENT_CHARACTER_LIMIT,
  LARGE_PASTE_CHUNK_SIZE,
  EMPTY_EDITOR_DOC,
} from "../editorPaneHelpers";

/* ------------------------------------------------------------------ */
/* isAiRunning                                                         */
/* ------------------------------------------------------------------ */

describe("isAiRunning", () => {
  it('should return true when status is "running"', () => {
    expect(isAiRunning("running")).toEqual(true);
  });

  it('should return true when status is "streaming"', () => {
    expect(isAiRunning("streaming")).toEqual(true);
  });

  it('should return false when status is "idle"', () => {
    expect(isAiRunning("idle")).toEqual(false);
  });

  it("should return false for an empty string", () => {
    expect(isAiRunning("")).toEqual(false);
  });

  it("should return false for an unrelated status value", () => {
    expect(isAiRunning("error")).toEqual(false);
  });
});

/* ------------------------------------------------------------------ */
/* parseEditorContentJsonSafely                                        */
/* ------------------------------------------------------------------ */

describe("parseEditorContentJsonSafely", () => {
  it("should return parsed JSON when input is valid editor content", () => {
    const content = { type: "doc", content: [{ type: "paragraph" }] };
    const result = parseEditorContentJsonSafely(JSON.stringify(content));
    expect(result).toEqual(content);
  });

  it("should return EMPTY_EDITOR_DOC when input is malformed JSON", () => {
    const result = parseEditorContentJsonSafely("{broken json!!");
    expect(result).toEqual(EMPTY_EDITOR_DOC);
  });

  it("should return EMPTY_EDITOR_DOC when input is an empty string", () => {
    const result = parseEditorContentJsonSafely("");
    expect(result).toEqual(EMPTY_EDITOR_DOC);
  });

  it("should parse a complex nested document structure", () => {
    const complex = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Title" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Body text" }],
        },
      ],
    };
    expect(parseEditorContentJsonSafely(JSON.stringify(complex))).toEqual(
      complex,
    );
  });
});

/* ------------------------------------------------------------------ */
/* chunkLargePasteText                                                 */
/* ------------------------------------------------------------------ */

describe("chunkLargePasteText", () => {
  it("should return an empty array when text is empty", () => {
    expect(chunkLargePasteText("")).toEqual([]);
  });

  it("should return the full text in one chunk when shorter than chunkSize", () => {
    const text = "hello world";
    const result = chunkLargePasteText(text, 100);
    expect(result).toEqual(["hello world"]);
  });

  it("should split text into multiple chunks when longer than chunkSize", () => {
    const text = "abcdefghij";
    const result = chunkLargePasteText(text, 3);
    expect(result).toEqual(["abc", "def", "ghi", "j"]);
  });

  it("should handle text exactly equal to chunkSize", () => {
    const text = "abc";
    const result = chunkLargePasteText(text, 3);
    expect(result).toEqual(["abc"]);
  });

  it("should return the whole text as one chunk when chunkSize is zero or negative", () => {
    const text = "test";
    expect(chunkLargePasteText(text, 0)).toEqual(["test"]);
    expect(chunkLargePasteText(text, -1)).toEqual(["test"]);
  });

  it("should use LARGE_PASTE_CHUNK_SIZE as default chunkSize", () => {
    const text = "a".repeat(LARGE_PASTE_CHUNK_SIZE + 10);
    const result = chunkLargePasteText(text);
    expect(result.length).toEqual(2);
    expect(result[0].length).toEqual(LARGE_PASTE_CHUNK_SIZE);
    expect(result[1].length).toEqual(10);
  });
});

/* ------------------------------------------------------------------ */
/* shouldWarnDocumentCapacity                                          */
/* ------------------------------------------------------------------ */

describe("shouldWarnDocumentCapacity", () => {
  it("should return false when current length is below the limit", () => {
    expect(shouldWarnDocumentCapacity(100)).toEqual(false);
  });

  it("should return true when current length equals the limit", () => {
    expect(shouldWarnDocumentCapacity(EDITOR_DOCUMENT_CHARACTER_LIMIT)).toEqual(
      true,
    );
  });

  it("should return true when current length exceeds the limit", () => {
    expect(
      shouldWarnDocumentCapacity(EDITOR_DOCUMENT_CHARACTER_LIMIT + 1),
    ).toEqual(true);
  });

  it("should respect a custom limit parameter", () => {
    expect(shouldWarnDocumentCapacity(50, 50)).toEqual(true);
    expect(shouldWarnDocumentCapacity(49, 50)).toEqual(false);
  });

  it("should return true when length is zero and limit is zero", () => {
    expect(shouldWarnDocumentCapacity(0, 0)).toEqual(true);
  });
});

/* ------------------------------------------------------------------ */
/* shouldConfirmOverflowPaste                                          */
/* ------------------------------------------------------------------ */

describe("shouldConfirmOverflowPaste", () => {
  it("should return false when total is within the limit", () => {
    expect(
      shouldConfirmOverflowPaste({ currentLength: 100, pasteLength: 100 }),
    ).toEqual(false);
  });

  it("should return true when total exceeds the default limit", () => {
    expect(
      shouldConfirmOverflowPaste({
        currentLength: EDITOR_DOCUMENT_CHARACTER_LIMIT,
        pasteLength: 1,
      }),
    ).toEqual(true);
  });

  it("should return false when total exactly equals the limit", () => {
    expect(
      shouldConfirmOverflowPaste({
        currentLength: EDITOR_DOCUMENT_CHARACTER_LIMIT - 10,
        pasteLength: 10,
      }),
    ).toEqual(false);
  });

  it("should respect a custom limit parameter", () => {
    expect(
      shouldConfirmOverflowPaste({
        currentLength: 50,
        pasteLength: 51,
        limit: 100,
      }),
    ).toEqual(true);
    expect(
      shouldConfirmOverflowPaste({
        currentLength: 50,
        pasteLength: 50,
        limit: 100,
      }),
    ).toEqual(false);
  });

  it("should return true when pasting into an empty document exceeds limit", () => {
    expect(
      shouldConfirmOverflowPaste({
        currentLength: 0,
        pasteLength: 101,
        limit: 100,
      }),
    ).toEqual(true);
  });
});

/* ------------------------------------------------------------------ */
/* sanitizePastedHtml                                                  */
/* ------------------------------------------------------------------ */

describe("sanitizePastedHtml", () => {
  it("should preserve allowed tags like <p>, <strong>, <em>", () => {
    const html = "<p><strong>bold</strong> and <em>italic</em></p>";
    const result = sanitizePastedHtml(html);
    expect(result).toEqual("<p><strong>bold</strong> and <em>italic</em></p>");
  });

  it("should remove script tags entirely", () => {
    const html = '<p>safe</p><script>alert("xss")</script>';
    const result = sanitizePastedHtml(html);
    expect(result).toEqual("<p>safe</p>");
  });

  it("should remove style tags entirely", () => {
    const html = "<style>.red{color:red}</style><p>text</p>";
    const result = sanitizePastedHtml(html);
    expect(result).toEqual("<p>text</p>");
  });

  it("should unwrap span tags preserving their text content", () => {
    const html = '<p><span style="color:red">red text</span></p>';
    const result = sanitizePastedHtml(html);
    expect(result).toEqual("<p>red text</p>");
  });

  it("should convert div tags to p tags", () => {
    const html = "<div>paragraph content</div>";
    const result = sanitizePastedHtml(html);
    expect(result).toEqual("<p>paragraph content</p>");
  });

  it("should strip all attributes from allowed tags", () => {
    const html = '<p class="fancy" id="p1">text</p>';
    const result = sanitizePastedHtml(html);
    expect(result).toEqual("<p>text</p>");
  });

  it("should wrap bare text nodes in p tags", () => {
    const html = "bare text";
    const result = sanitizePastedHtml(html);
    expect(result).toEqual("<p>bare text</p>");
  });

  it("should handle empty input", () => {
    const result = sanitizePastedHtml("");
    expect(result).toEqual("");
  });

  it("should remove iframe tags", () => {
    const html = '<iframe src="https://evil.com"></iframe><p>keep</p>';
    const result = sanitizePastedHtml(html);
    expect(result).toEqual("<p>keep</p>");
  });

  it("should preserve list structures", () => {
    const html = "<ul><li>item 1</li><li>item 2</li></ul>";
    const result = sanitizePastedHtml(html);
    expect(result).toEqual("<ul><li>item 1</li><li>item 2</li></ul>");
  });
});
