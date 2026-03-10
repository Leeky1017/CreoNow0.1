import fs from "node:fs/promises";

import {
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { ParagraphChild } from "docx";

type TipTapMark = {
  type?: unknown;
  attrs?: Record<string, unknown>;
};

type TipTapNode = {
  type?: unknown;
  text?: unknown;
  attrs?: Record<string, unknown>;
  marks?: TipTapMark[];
  content?: TipTapNode[];
};

export type ExportMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "underline" }
  | { type: "strike" }
  | { type: "code" }
  | { type: "link"; href: string };

export type ExportTextInline = {
  type: "text";
  text: string;
  marks: ExportMark[];
};

export type ExportHardBreakInline = {
  type: "hardBreak";
};

export type ExportImageNode = {
  type: "image";
  src: string;
  alt: string;
  title: string;
  width: number;
  height: number;
};

export type ExportInline =
  | ExportTextInline
  | ExportHardBreakInline
  | ExportImageNode;

export type ExportListItem = {
  blocks: ExportBlock[];
};

export type ExportBlock =
  | { type: "paragraph"; content: ExportInline[] }
  | { type: "heading"; level: number; content: ExportInline[] }
  | { type: "blockquote"; blocks: ExportBlock[] }
  | { type: "bulletList"; items: ExportListItem[] }
  | { type: "orderedList"; items: ExportListItem[] }
  | { type: "horizontalRule" }
  | { type: "codeBlock"; text: string; language: string | null }
  | ExportImageNode;

export type StructuredExportDocument = {
  blocks: ExportBlock[];
};

export type StructuredExportResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; unsupported: string[] };

export type PdfTextSegment = {
  text: string;
  marks: ExportMark[];
};

export type PdfRenderOp =
  | { type: "heading"; level: number; segments: PdfTextSegment[] }
  | { type: "paragraph"; segments: PdfTextSegment[]; indent: number }
  | {
      type: "list-item";
      ordered: boolean;
      index: number;
      depth: number;
      segments: PdfTextSegment[];
    }
  | { type: "horizontal-rule" }
  | { type: "image"; src: string; alt: string; width: number; height: number }
  | { type: "code-block"; text: string; language: string | null };

const DEFAULT_IMAGE_WIDTH = 320;
const DEFAULT_IMAGE_HEIGHT = 180;

function structuredError(message: string, unsupported: string[]): StructuredExportResult<never> {
  return { ok: false, message, unsupported };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTipTapNode(value: unknown): value is TipTapNode {
  return isRecord(value) && typeof value.type === "string";
}

function ensureArray(value: unknown): TipTapNode[] {
  return Array.isArray(value) ? value.filter(isTipTapNode) : [];
}

function nodePath(parts: Array<string | number>): string {
  return parts.map((part) => String(part)).join(".");
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.replaceAll("\r\n", "\n") : "";
}

function uniqueUnsupported(items: string[]): string[] {
  return [...new Set(items)];
}

function parseMarks(args: {
  marks: TipTapMark[] | undefined;
  path: Array<string | number>;
}): StructuredExportResult<ExportMark[]> {
  const parsed: ExportMark[] = [];
  const unsupported: string[] = [];

  for (let i = 0; i < (args.marks?.length ?? 0); i += 1) {
    const mark = args.marks?.[i];
    if (!isRecord(mark) || typeof mark.type !== "string") {
      unsupported.push(`${nodePath([...args.path, "marks", i])}:invalid-mark`);
      continue;
    }

    switch (mark.type) {
      case "bold":
      case "italic":
      case "underline":
      case "strike":
      case "code":
        parsed.push({ type: mark.type });
        break;
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href.trim() : "";
        if (href.length === 0) {
          unsupported.push(`${nodePath([...args.path, "marks", i])}:link[href]`);
          break;
        }
        parsed.push({ type: "link", href });
        break;
      }
      default:
        unsupported.push(`${nodePath([...args.path, "marks", i])}:${mark.type}`);
        break;
    }
  }

  if (unsupported.length > 0) {
    return structuredError(
      `Export format does not yet support: ${uniqueUnsupported(unsupported).join(", ")}`,
      uniqueUnsupported(unsupported),
    );
  }

  return { ok: true, data: parsed };
}

function parseImageNode(args: {
  node: TipTapNode;
  path: Array<string | number>;
}): StructuredExportResult<ExportImageNode> {
  const src = typeof args.node.attrs?.src === "string" ? args.node.attrs.src.trim() : "";
  if (src.length === 0) {
    return structuredError(
      `Export format does not yet support: ${nodePath(args.path)}:image[src]`,
      [`${nodePath(args.path)}:image[src]`],
    );
  }

  const width =
    typeof args.node.attrs?.width === "number" && Number.isFinite(args.node.attrs.width)
      ? Math.max(1, Math.round(args.node.attrs.width))
      : DEFAULT_IMAGE_WIDTH;
  const height =
    typeof args.node.attrs?.height === "number" && Number.isFinite(args.node.attrs.height)
      ? Math.max(1, Math.round(args.node.attrs.height))
      : DEFAULT_IMAGE_HEIGHT;

  return {
    ok: true,
    data: {
      type: "image",
      src,
      alt: typeof args.node.attrs?.alt === "string" ? args.node.attrs.alt : "",
      title: typeof args.node.attrs?.title === "string" ? args.node.attrs.title : "",
      width,
      height,
    },
  };
}

function parseInlines(args: {
  nodes: TipTapNode[];
  path: Array<string | number>;
}): StructuredExportResult<ExportInline[]> {
  const inlines: ExportInline[] = [];
  const unsupported: string[] = [];

  for (let i = 0; i < args.nodes.length; i += 1) {
    const node = args.nodes[i];
    const path = [...args.path, i];

    switch (node.type) {
      case "text": {
        const marks = parseMarks({ marks: node.marks, path });
        if (!marks.ok) {
          unsupported.push(...marks.unsupported);
          break;
        }
        inlines.push({
          type: "text",
          text: normalizeText(node.text),
          marks: marks.data,
        });
        break;
      }
      case "hardBreak":
      case "hard_break":
        inlines.push({ type: "hardBreak" });
        break;
      case "image": {
        const image = parseImageNode({ node, path });
        if (!image.ok) {
          unsupported.push(...image.unsupported);
          break;
        }
        inlines.push(image.data);
        break;
      }
      default:
        unsupported.push(`${nodePath(path)}:${String(node.type)}`);
        break;
    }
  }

  if (unsupported.length > 0) {
    return structuredError(
      `Export format does not yet support: ${uniqueUnsupported(unsupported).join(", ")}`,
      uniqueUnsupported(unsupported),
    );
  }

  return { ok: true, data: inlines };
}

function readCodeBlockText(node: TipTapNode): string {
  const pieces: string[] = [];
  for (const child of ensureArray(node.content)) {
    if (child.type === "text") {
      pieces.push(normalizeText(child.text));
    }
  }
  return pieces.join("");
}

function parseListItems(args: {
  nodes: TipTapNode[];
  path: Array<string | number>;
}): StructuredExportResult<ExportListItem[]> {
  const items: ExportListItem[] = [];
  const unsupported: string[] = [];

  for (let i = 0; i < args.nodes.length; i += 1) {
    const node = args.nodes[i];
    if (node.type !== "listItem" && node.type !== "list_item") {
      unsupported.push(`${nodePath([...args.path, i])}:${String(node.type)}`);
      continue;
    }

    const blocks = parseBlocks({
      nodes: ensureArray(node.content),
      path: [...args.path, i, "content"],
    });
    if (!blocks.ok) {
      unsupported.push(...blocks.unsupported);
      continue;
    }
    items.push({ blocks: blocks.data });
  }

  if (unsupported.length > 0) {
    return structuredError(
      `Export format does not yet support: ${uniqueUnsupported(unsupported).join(", ")}`,
      uniqueUnsupported(unsupported),
    );
  }

  return { ok: true, data: items };
}

function parseBlocks(args: {
  nodes: TipTapNode[];
  path: Array<string | number>;
}): StructuredExportResult<ExportBlock[]> {
  const blocks: ExportBlock[] = [];
  const unsupported: string[] = [];

  for (let i = 0; i < args.nodes.length; i += 1) {
    const node = args.nodes[i];
    const path = [...args.path, i];

    switch (node.type) {
      case "paragraph": {
        const content = parseInlines({
          nodes: ensureArray(node.content),
          path: [...path, "content"],
        });
        if (!content.ok) {
          unsupported.push(...content.unsupported);
          break;
        }
        blocks.push({ type: "paragraph", content: content.data });
        break;
      }
      case "heading": {
        const content = parseInlines({
          nodes: ensureArray(node.content),
          path: [...path, "content"],
        });
        if (!content.ok) {
          unsupported.push(...content.unsupported);
          break;
        }
        const level =
          typeof node.attrs?.level === "number" && node.attrs.level >= 1 && node.attrs.level <= 6
            ? node.attrs.level
            : 1;
        blocks.push({ type: "heading", level, content: content.data });
        break;
      }
      case "blockquote": {
        const quoted = parseBlocks({
          nodes: ensureArray(node.content),
          path: [...path, "content"],
        });
        if (!quoted.ok) {
          unsupported.push(...quoted.unsupported);
          break;
        }
        blocks.push({ type: "blockquote", blocks: quoted.data });
        break;
      }
      case "bulletList": {
        const items = parseListItems({
          nodes: ensureArray(node.content),
          path: [...path, "content"],
        });
        if (!items.ok) {
          unsupported.push(...items.unsupported);
          break;
        }
        blocks.push({ type: "bulletList", items: items.data });
        break;
      }
      case "orderedList": {
        const items = parseListItems({
          nodes: ensureArray(node.content),
          path: [...path, "content"],
        });
        if (!items.ok) {
          unsupported.push(...items.unsupported);
          break;
        }
        blocks.push({ type: "orderedList", items: items.data });
        break;
      }
      case "horizontalRule":
      case "horizontal_rule":
        blocks.push({ type: "horizontalRule" });
        break;
      case "codeBlock":
      case "code_block":
        blocks.push({
          type: "codeBlock",
          text: readCodeBlockText(node),
          language: typeof node.attrs?.language === "string" ? node.attrs.language : null,
        });
        break;
      case "image": {
        const image = parseImageNode({ node, path });
        if (!image.ok) {
          unsupported.push(...image.unsupported);
          break;
        }
        blocks.push(image.data);
        break;
      }
      default:
        unsupported.push(`${nodePath(path)}:${String(node.type)}`);
        break;
    }
  }

  if (unsupported.length > 0) {
    return structuredError(
      `Export format does not yet support: ${uniqueUnsupported(unsupported).join(", ")}`,
      uniqueUnsupported(unsupported),
    );
  }

  return { ok: true, data: blocks };
}

export function parseStructuredExportDocument(args: {
  contentJson: string;
}): StructuredExportResult<StructuredExportDocument> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(args.contentJson);
  } catch {
    return structuredError("Invalid TipTap JSON document", ["contentJson:invalid-json"]);
  }

  if (!isTipTapNode(parsed) || parsed.type !== "doc") {
    return structuredError("Invalid TipTap JSON document", ["contentJson:doc-root"]);
  }

  const blocks = parseBlocks({
    nodes: ensureArray(parsed.content),
    path: ["doc", "content"],
  });
  if (!blocks.ok) {
    return blocks;
  }

  return { ok: true, data: { blocks: blocks.data } };
}

function escapeMarkdownText(text: string): string {
  return text.replace(/([\\`*_{}[\]()#+\-.!|>])/g, "\\$1");
}

function applyMarkdownMarks(text: string, marks: ExportMark[]): string {
  const code = marks.find((mark) => mark.type === "code");
  if (code) {
    const linkedCode = `\`${text.replaceAll("`", "\\`")}\``;
    const link = marks.find((mark): mark is Extract<ExportMark, { type: "link" }> => mark.type === "link");
    return link ? `[${linkedCode}](${link.href})` : linkedCode;
  }

  let result = escapeMarkdownText(text);

  if (marks.some((mark) => mark.type === "bold")) {
    result = `**${result}**`;
  }
  if (marks.some((mark) => mark.type === "italic")) {
    result = `*${result}*`;
  }
  if (marks.some((mark) => mark.type === "underline")) {
    result = `<u>${result}</u>`;
  }
  if (marks.some((mark) => mark.type === "strike")) {
    result = `~~${result}~~`;
  }

  const link = marks.find((mark): mark is Extract<ExportMark, { type: "link" }> => mark.type === "link");
  if (link) {
    result = `[${result}](${link.href})`;
  }

  return result;
}

function renderInlineMarkdown(inlines: ExportInline[]): string {
  return inlines
    .map((inline) => {
      if (inline.type === "text") {
        return applyMarkdownMarks(inline.text, inline.marks);
      }
      if (inline.type === "hardBreak") {
        return "  \n";
      }
      const title = inline.title.length > 0 ? ` "${inline.title.replaceAll("\"", "\\\"")}"` : "";
      return `![${inline.alt}](${inline.src}${title})`;
    })
    .join("");
}

function renderBlockMarkdown(block: ExportBlock, depth = 0): string {
  switch (block.type) {
    case "paragraph":
      return renderInlineMarkdown(block.content);
    case "heading":
      return `${"#".repeat(Math.max(1, Math.min(6, block.level)))} ${renderInlineMarkdown(block.content)}`;
    case "blockquote":
      return renderStructuredMarkdown({ blocks: block.blocks })
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    case "bulletList":
    case "orderedList":
      return block.items
        .map((item, index) => {
          const marker = block.type === "orderedList" ? `${index + 1}. ` : "- ";
          const rendered = renderStructuredMarkdown({ blocks: item.blocks }).split("\n");
          return rendered
            .map((line, lineIndex) => {
              if (lineIndex === 0) {
                return `${"  ".repeat(depth)}${marker}${line}`;
              }
              return `${"  ".repeat(depth)}${" ".repeat(marker.length)}${line}`;
            })
            .join("\n");
        })
        .join("\n");
    case "horizontalRule":
      return "---";
    case "codeBlock":
      return `\`\`\`${block.language ?? ""}\n${block.text}\n\`\`\``;
    case "image": {
      const title = block.title.length > 0 ? ` "${block.title.replaceAll("\"", "\\\"")}"` : "";
      return `![${block.alt}](${block.src}${title})`;
    }
  }
}

export function renderStructuredMarkdown(document: StructuredExportDocument): string {
  return document.blocks.map((block) => renderBlockMarkdown(block)).join("\n\n");
}

export function renderStructuredMarkdownExport(args: {
  title: string;
  document: StructuredExportDocument;
}): string {
  const body = renderStructuredMarkdown(args.document).trim();
  return body.length > 0 ? `# ${args.title}\n\n${body}\n` : `# ${args.title}\n`;
}

function inlineToSegments(inlines: ExportInline[]): PdfTextSegment[] {
  const segments: PdfTextSegment[] = [];
  for (const inline of inlines) {
    if (inline.type === "text") {
      if (inline.text.length > 0) {
        segments.push({ text: inline.text, marks: inline.marks });
      }
      continue;
    }
    if (inline.type === "hardBreak") {
      segments.push({ text: "\n", marks: [] });
      continue;
    }
    segments.push({ text: `[Image: ${inline.alt || inline.title || inline.src}]`, marks: [] });
  }
  return segments;
}

function pushPdfOps(args: {
  blocks: ExportBlock[];
  out: PdfRenderOp[];
  indent: number;
  listDepth: number;
  ordered?: boolean;
}): void {
  for (const block of args.blocks) {
    switch (block.type) {
      case "heading":
        args.out.push({ type: "heading", level: block.level, segments: inlineToSegments(block.content) });
        break;
      case "paragraph":
        args.out.push({ type: "paragraph", segments: inlineToSegments(block.content), indent: args.indent });
        break;
      case "blockquote":
        pushPdfOps({
          blocks: block.blocks,
          out: args.out,
          indent: args.indent + 24,
          listDepth: args.listDepth,
        });
        break;
      case "bulletList":
      case "orderedList":
        block.items.forEach((item, index) => {
          const first = item.blocks[0];
          if (first?.type === "paragraph") {
            args.out.push({
              type: "list-item",
              ordered: block.type === "orderedList",
              index: index + 1,
              depth: args.listDepth,
              segments: inlineToSegments(first.content),
            });
            pushPdfOps({
              blocks: item.blocks.slice(1),
              out: args.out,
              indent: args.indent + 24,
              listDepth: args.listDepth + 1,
            });
            return;
          }

          args.out.push({
            type: "list-item",
            ordered: block.type === "orderedList",
            index: index + 1,
            depth: args.listDepth,
            segments: [{ text: "", marks: [] }],
          });
          pushPdfOps({
            blocks: item.blocks,
            out: args.out,
            indent: args.indent + 24,
            listDepth: args.listDepth + 1,
          });
        });
        break;
      case "horizontalRule":
        args.out.push({ type: "horizontal-rule" });
        break;
      case "codeBlock":
        args.out.push({ type: "code-block", text: block.text, language: block.language });
        break;
      case "image":
        args.out.push({
          type: "image",
          src: block.src,
          alt: block.alt,
          width: block.width,
          height: block.height,
        });
        break;
    }
  }
}

export function buildPdfRenderPlan(args: {
  title: string;
  document: StructuredExportDocument;
}): PdfRenderOp[] {
  const plan: PdfRenderOp[] = [
    {
      type: "heading",
      level: 1,
      segments: [{ text: args.title, marks: [] }],
    },
  ];
  pushPdfOps({ blocks: args.document.blocks, out: plan, indent: 0, listDepth: 0 });
  return plan;
}

function resolvePdfFont(marks: ExportMark[]): string {
  if (marks.some((mark) => mark.type === "code")) {
    return marks.some((mark) => mark.type === "bold") ? "Courier-Bold" : "Courier";
  }

  const bold = marks.some((mark) => mark.type === "bold");
  const italic = marks.some((mark) => mark.type === "italic");

  if (bold && italic) {
    return "Helvetica-BoldOblique";
  }
  if (bold) {
    return "Helvetica-Bold";
  }
  if (italic) {
    return "Helvetica-Oblique";
  }
  return "Helvetica";
}

async function readImageBinary(src: string): Promise<Buffer> {
  if (src.startsWith("data:")) {
    const match = src.match(/^data:([^;,]+)?(;base64)?,(.*)$/u);
    if (!match) {
      throw new Error(`Unsupported image source: ${src}`);
    }
    const [, , base64Flag, data] = match;
    return Buffer.from(data, base64Flag ? "base64" : "utf8");
  }

  if (src.startsWith("http://") || src.startsWith("https://")) {
    throw new Error(`Unsupported image source: ${src}`);
  }

  return fs.readFile(src);
}

function detectDocxImageType(src: string): "jpg" | "png" | "gif" | "bmp" {
  const normalized = src.toLowerCase();

  if (normalized.startsWith("data:image/jpeg") || normalized.startsWith("data:image/jpg") || normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
    return "jpg";
  }
  if (normalized.startsWith("data:image/gif") || normalized.endsWith(".gif")) {
    return "gif";
  }
  if (normalized.startsWith("data:image/bmp") || normalized.endsWith(".bmp")) {
    return "bmp";
  }

  return "png";
}

function renderPdfSegments(args: {
  pdfDoc: PDFKit.PDFDocument;
  segments: PdfTextSegment[];
  fontSize: number;
  indent: number;
  fillColor?: string;
}): void {
  const { pdfDoc, segments, fontSize, indent } = args;
  const width = pdfDoc.page.width - pdfDoc.page.margins.left - pdfDoc.page.margins.right - indent;

  segments.forEach((segment, index) => {
    const font = resolvePdfFont(segment.marks);
    const underline = segment.marks.some((mark) => mark.type === "underline");
    const isLink = segment.marks.some((mark) => mark.type === "link");

    pdfDoc.font(font).fontSize(fontSize).fillColor(isLink ? "#1D4ED8" : args.fillColor ?? "black");
    pdfDoc.text(segment.text, {
      continued: index < segments.length - 1,
      underline,
      lineGap: 4,
      width,
      indent: index === 0 ? indent : 0,
    });
  });
  pdfDoc.fillColor("black");
  pdfDoc.moveDown(1);
}

export async function renderPdfPlan(args: {
  pdfDoc: PDFKit.PDFDocument;
  plan: PdfRenderOp[];
}): Promise<void> {
  for (const op of args.plan) {
    switch (op.type) {
      case "heading":
        renderPdfSegments({
          pdfDoc: args.pdfDoc,
          segments: op.segments,
          fontSize: op.level === 1 ? 24 : op.level === 2 ? 18 : 14,
          indent: 0,
        });
        break;
      case "paragraph":
        renderPdfSegments({
          pdfDoc: args.pdfDoc,
          segments: op.segments,
          fontSize: 12,
          indent: op.indent,
        });
        break;
      case "list-item": {
        const marker = op.ordered ? `${op.index}. ` : "• ";
        renderPdfSegments({
          pdfDoc: args.pdfDoc,
          segments: [{ text: marker, marks: [] }, ...op.segments],
          fontSize: 12,
          indent: op.depth * 24,
        });
        break;
      }
      case "horizontal-rule": {
        const left = args.pdfDoc.page.margins.left;
        const right = args.pdfDoc.page.width - args.pdfDoc.page.margins.right;
        args.pdfDoc
          .moveTo(left, args.pdfDoc.y)
          .lineTo(right, args.pdfDoc.y)
          .stroke("#D1D5DB");
        args.pdfDoc.moveDown(1);
        break;
      }
      case "image": {
        const imageData = await readImageBinary(op.src);
        args.pdfDoc.image(imageData, {
          fit: [Math.min(op.width, 420), Math.min(op.height, 240)],
        });
        args.pdfDoc.moveDown(1);
        break;
      }
      case "code-block":
        args.pdfDoc.font("Courier").fontSize(11).text(op.text, {
          indent: 12,
          lineGap: 3,
        });
        args.pdfDoc.moveDown(1);
        break;
    }
  }
}

function mapHeadingLevel(level: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  switch (level) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    case 4:
      return HeadingLevel.HEADING_4;
    case 5:
      return HeadingLevel.HEADING_5;
    default:
      return HeadingLevel.HEADING_6;
  }
}

function buildDocxRuns(inlines: ExportInline[]): ParagraphChild[] {
  const children: ParagraphChild[] = [];

  for (const inline of inlines) {
    if (inline.type === "text") {
      const link = inline.marks.find(
        (mark): mark is Extract<ExportMark, { type: "link" }> => mark.type === "link",
      );

      const run = new TextRun({
        text: inline.text,
        bold: inline.marks.some((mark) => mark.type === "bold"),
        italics: inline.marks.some((mark) => mark.type === "italic"),
        strike: inline.marks.some((mark) => mark.type === "strike"),
        underline: inline.marks.some((mark) => mark.type === "underline") ? {} : undefined,
        font: inline.marks.some((mark) => mark.type === "code") ? "Courier New" : undefined,
      });

      if (link) {
        children.push(new ExternalHyperlink({ link: link.href, children: [run] }));
      } else {
        children.push(run);
      }
      continue;
    }

    if (inline.type === "hardBreak") {
      children.push(new TextRun({ text: "", break: 1 }));
      continue;
    }

    children.push(new TextRun({ text: inline.alt || inline.title || "[image]" }));
  }

  return children;
}

async function buildDocxImageRun(image: ExportImageNode): Promise<ImageRun> {
  const data = await readImageBinary(image.src);
  return new ImageRun({
    type: detectDocxImageType(image.src),
    data,
    transformation: {
      width: image.width,
      height: image.height,
    },
  });
}

async function pushDocxParagraphs(args: {
  blocks: ExportBlock[];
  out: Paragraph[];
  listDepth: number;
}): Promise<void> {
  for (const block of args.blocks) {
    switch (block.type) {
      case "heading":
        args.out.push(
          new Paragraph({
            heading: mapHeadingLevel(block.level),
            children: buildDocxRuns(block.content),
          }),
        );
        break;
      case "paragraph":
        args.out.push(new Paragraph({ children: buildDocxRuns(block.content) }));
        break;
      case "blockquote":
        await pushDocxParagraphs({
          blocks: block.blocks,
          out: args.out,
          listDepth: args.listDepth,
        });
        break;
      case "bulletList":
      case "orderedList":
        for (const item of block.items) {
          const first = item.blocks[0];
          if (first?.type === "paragraph") {
            args.out.push(
              new Paragraph({
                children: buildDocxRuns(first.content),
                numbering: {
                  reference:
                    block.type === "orderedList"
                      ? "creonow-ordered"
                      : "creonow-bullet",
                  level: args.listDepth,
                },
              }),
            );
            await pushDocxParagraphs({
              blocks: item.blocks.slice(1),
              out: args.out,
              listDepth: args.listDepth + 1,
            });
          } else {
            await pushDocxParagraphs({
              blocks: item.blocks,
              out: args.out,
              listDepth: args.listDepth + 1,
            });
          }
        }
        break;
      case "horizontalRule":
        args.out.push(new Paragraph({ thematicBreak: true }));
        break;
      case "codeBlock":
        args.out.push(
          new Paragraph({
            children: [
              new TextRun({
                text: block.text,
                font: "Courier New",
              }),
            ],
          }),
        );
        break;
      case "image":
        args.out.push(
          new Paragraph({
            children: [await buildDocxImageRun(block)],
          }),
        );
        break;
    }
  }
}

export async function buildDocxBuffer(args: {
  title: string;
  document: StructuredExportDocument;
}): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun(args.title)],
    }),
  ];
  await pushDocxParagraphs({ blocks: args.document.blocks, out: children, listDepth: 0 });

  const docx = new Document({
    numbering: {
      config: [
        {
          reference: "creonow-ordered",
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1." }],
        },
        {
          reference: "creonow-bullet",
          levels: [{ level: 0, format: LevelFormat.BULLET, text: "•" }],
        },
      ],
    },
    sections: [{ children }],
  });

  return Packer.toBuffer(docx);
}