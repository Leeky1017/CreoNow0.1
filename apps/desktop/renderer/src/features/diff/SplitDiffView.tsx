import React from "react";
import type { DiffLine } from "./DiffView";

type SplitDiffViewProps = {
  lines: DiffLine[];
  currentChangeIndex?: number;
  changePositions?: number[];
  lineUnderlineStyle?: "none" | "solid" | "dashed";
};

/**
 * Prepare lines for split view: separate into before/after columns.
 */
function prepareSplitLines(lines: DiffLine[]): {
  beforeLines: Array<{
    lineNumber: number | null;
    content: string;
    type: "removed" | "context" | "empty";
  }>;
  afterLines: Array<{
    lineNumber: number | null;
    content: string;
    type: "added" | "context" | "empty";
  }>;
} {
  const beforeLines: Array<{
    lineNumber: number | null;
    content: string;
    type: "removed" | "context" | "empty";
  }> = [];
  const afterLines: Array<{
    lineNumber: number | null;
    content: string;
    type: "added" | "context" | "empty";
  }> = [];

  // Filter out header lines
  const contentLines = lines.filter((l) => l.type !== "header");

  // Group consecutive removed/added lines
  let i = 0;
  while (i < contentLines.length) {
    const line = contentLines[i];

    if (line.type === "context") {
      beforeLines.push({
        lineNumber: line.oldLineNumber,
        content: line.content,
        type: "context",
      });
      afterLines.push({
        lineNumber: line.newLineNumber,
        content: line.content,
        type: "context",
      });
      i++;
    } else if (line.type === "removed") {
      // Collect consecutive removed lines
      const removedBatch: DiffLine[] = [];
      while (i < contentLines.length && contentLines[i].type === "removed") {
        removedBatch.push(contentLines[i]);
        i++;
      }
      // Collect consecutive added lines
      const addedBatch: DiffLine[] = [];
      while (i < contentLines.length && contentLines[i].type === "added") {
        addedBatch.push(contentLines[i]);
        i++;
      }

      // Pair them up
      const maxLen = Math.max(removedBatch.length, addedBatch.length);
      for (let j = 0; j < maxLen; j++) {
        if (j < removedBatch.length) {
          beforeLines.push({
            lineNumber: removedBatch[j].oldLineNumber,
            content: removedBatch[j].content,
            type: "removed",
          });
        } else {
          beforeLines.push({ lineNumber: null, content: "", type: "empty" });
        }
        if (j < addedBatch.length) {
          afterLines.push({
            lineNumber: addedBatch[j].newLineNumber,
            content: addedBatch[j].content,
            type: "added",
          });
        } else {
          afterLines.push({ lineNumber: null, content: "", type: "empty" });
        }
      }
    } else if (line.type === "added") {
      // Added without preceding removed
      beforeLines.push({ lineNumber: null, content: "", type: "empty" });
      afterLines.push({
        lineNumber: line.newLineNumber,
        content: line.content,
        type: "added",
      });
      i++;
    } else {
      i++;
    }
  }

  return { beforeLines, afterLines };
}

/**
 * SplitDiffView renders a side-by-side diff comparison.
 *
 * Features:
 * - Left pane: Before (original) version
 * - Right pane: After (modified) version
 * - Synchronized scrolling
 * - Line numbers
 * - Colored backgrounds for changes
 */
export function SplitDiffView(props: SplitDiffViewProps): JSX.Element {
  const beforeRef = React.useRef<HTMLDivElement>(null);
  const afterRef = React.useRef<HTMLDivElement>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const { beforeLines, afterLines } = React.useMemo(
    () => prepareSplitLines(props.lines),
    [props.lines],
  );
  const underlineClass =
    props.lineUnderlineStyle === "dashed"
      ? "underline decoration-dashed underline-offset-[3px]"
      : props.lineUnderlineStyle === "solid"
        ? "underline decoration-solid underline-offset-[3px]"
        : "";

  // Synchronized scrolling
  const handleScroll = (source: "before" | "after") => {
    if (isSyncing) return;
    setIsSyncing(true);

    const sourceRef = source === "before" ? beforeRef : afterRef;
    const targetRef = source === "before" ? afterRef : beforeRef;

    if (sourceRef.current && targetRef.current) {
      targetRef.current.scrollTop = sourceRef.current.scrollTop;
    }

    requestAnimationFrame(() => setIsSyncing(false));
  };

  if (props.lines.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-fg-muted)] text-sm">
        No changes to display
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden font-[var(--font-family-mono)] text-[13px] leading-6">
      {/* Before pane */}
      <div className="w-1/2 flex flex-col border-r border-[var(--color-separator)]">
        {/* Pane header */}
        <div className="h-8 flex items-center px-4 bg-[var(--color-bg-hover)] border-b border-[var(--color-separator)] text-[10px] text-[var(--color-fg-muted)] font-medium tracking-wide uppercase">
          Before
        </div>
        {/* Content */}
        <div
          ref={beforeRef}
          onScroll={() => handleScroll("before")}
          className="flex-1 overflow-y-auto flex bg-[var(--color-bg-base)]"
        >
          {/* Line numbers */}
          <div className="w-12 shrink-0 bg-[var(--color-bg-surface)] border-r border-[var(--color-separator)] flex flex-col text-right py-2 select-none text-[var(--color-fg-subtle)] text-[11px]">
            {beforeLines.map((line, idx) => (
              <div key={idx} className="px-3 leading-6">
                {line.lineNumber ?? ""}
              </div>
            ))}
          </div>
          {/* Content */}
          <div className="flex-1 py-2">
            {beforeLines.map((line, idx) => (
              <div
                key={idx}
                className={`
                  px-4 leading-6 whitespace-pre-wrap
                  ${line.type === "removed" ? "bg-[var(--color-diff-removed-bg)] text-[var(--color-diff-removed-text)] line-through decoration-[var(--color-diff-removed-decoration)]" : ""}
                  ${line.type === "removed" && underlineClass ? underlineClass : ""}
                  ${line.type === "context" ? "text-[var(--color-fg-muted)]" : ""}
                  ${line.type === "empty" ? "text-transparent" : ""}
                `}
              >
                {line.content || "\u00A0"}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* After pane */}
      <div className="w-1/2 flex flex-col bg-[var(--color-bg-base)]">
        {/* Pane header */}
        <div className="h-8 flex items-center px-4 bg-[var(--color-bg-hover)] border-b border-[var(--color-separator)] text-[10px] text-[var(--color-fg-muted)] font-medium tracking-wide uppercase">
          After
        </div>
        {/* Content */}
        <div
          ref={afterRef}
          onScroll={() => handleScroll("after")}
          className="flex-1 overflow-y-auto flex"
        >
          {/* Line numbers */}
          <div className="w-12 shrink-0 bg-[var(--color-bg-surface)] border-r border-[var(--color-separator)] flex flex-col text-right py-2 select-none text-[var(--color-fg-subtle)] text-[11px]">
            {afterLines.map((line, idx) => (
              <div key={idx} className="px-3 leading-6">
                {line.lineNumber ?? ""}
              </div>
            ))}
          </div>
          {/* Content */}
          <div className="flex-1 py-2">
            {afterLines.map((line, idx) => (
              <div
                key={idx}
                className={`
                  px-4 leading-6 whitespace-pre-wrap
                  ${line.type === "added" ? "bg-[var(--color-diff-added-bg)] text-[var(--color-diff-added-text)]" : ""}
                  ${line.type === "added" && underlineClass ? underlineClass : ""}
                  ${line.type === "context" ? "text-[var(--color-fg-muted)]" : ""}
                  ${line.type === "empty" ? "text-transparent" : ""}
                `}
              >
                {line.content || "\u00A0"}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
