export const TINY_PNG_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mP8/5+hHgAHggJ/Pg8cbwAAAABJRU5ErkJggg==";

export const STRUCTURED_EXPORT_TITLE = "Structured Export Sample";

export const STRUCTURED_EXPORT_CONTENT_JSON = JSON.stringify({
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Scene Heading" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Opening " },
        { type: "text", text: "bold words", marks: [{ type: "bold" }] },
        { type: "text", text: " and " },
        { type: "text", text: "italic words", marks: [{ type: "italic" }] },
        { type: "text", text: " plus " },
        { type: "text", text: "underlined words", marks: [{ type: "underline" }] },
        { type: "text", text: " with " },
        { type: "text", text: "inline code", marks: [{ type: "code" }] },
        { type: "text", text: " and " },
        {
          type: "text",
          text: "read the archive",
          marks: [{ type: "link", attrs: { href: "https://example.com/archive" } }],
        },
        { type: "hardBreak" },
        { type: "text", text: "after the break." },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "First bullet" }] }],
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Second bullet" }] }],
        },
      ],
    },
    {
      type: "orderedList",
      content: [
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "First ordered" }] }],
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Second ordered" }] }],
        },
      ],
    },
    {
      type: "blockquote",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Quoted memory" }] }],
    },
    { type: "horizontalRule" },
    {
      type: "image",
      attrs: {
        src: TINY_PNG_DATA_URI,
        alt: "Tiny diagram",
        title: "Tiny diagram",
        width: 24,
        height: 24,
      },
    },
  ],
});

export const UNSUPPORTED_EXPORT_CONTENT_JSON = JSON.stringify({
  type: "doc",
  content: [
    {
      type: "table",
      content: [],
    },
  ],
});

export const PLAIN_TEXT_TRAP = "PLAIN TEXT FALLBACK SHOULD NOT APPEAR";