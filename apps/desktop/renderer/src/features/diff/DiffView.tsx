import React from "react";
import { Text } from "../../components/primitives";
import { ScrollArea } from "../../components/primitives";

/**
 * Line type in a unified diff.
 */
export type DiffLineType = "added" | "removed" | "context" | "header";

/**
 * Parsed diff line with line numbers.
 */
export type DiffLine = {
  type: DiffLineType;
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
  hunkIndex: number | null;
};

/**
 * Diff statistics.
 */
export type DiffStats = {
  addedLines: number;
  removedLines: number;
  changedHunks: number;
};

export type LineUnderlineStyle = "none" | "solid" | "dashed";

/**
 * Parse a unified diff text into typed lines with line numbers.
 *
 * Why: We need to classify each line and track line numbers for proper display.
 */
export function parseDiffLines(diffText: string): {
  lines: DiffLine[];
  stats: DiffStats;
} {
  if (!diffText) {
    return {
      lines: [],
      stats: { addedLines: 0, removedLines: 0, changedHunks: 0 },
    };
  }

  const rawLines = diffText.split("\n");
  const lines: DiffLine[] = [];
  let oldLineNumber = 0;
  let newLineNumber = 0;
  let addedLines = 0;
  let removedLines = 0;
  let changedHunks = 0;
  let hunkIndex = -1;

  for (const line of rawLines) {
    if (line.startsWith("@@")) {
      // Parse hunk header: @@ -start,count +start,count @@
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLineNumber = parseInt(match[1], 10);
        newLineNumber = parseInt(match[2], 10);
      }
      hunkIndex += 1;
      changedHunks++;
      lines.push({
        type: "header",
        content: line,
        oldLineNumber: null,
        newLineNumber: null,
        hunkIndex,
      });
    } else if (line.startsWith("+++") || line.startsWith("---")) {
      lines.push({
        type: "header",
        content: line,
        oldLineNumber: null,
        newLineNumber: null,
        hunkIndex: null,
      });
    } else if (line.startsWith("+")) {
      lines.push({
        type: "added",
        content: line.slice(1),
        oldLineNumber: null,
        newLineNumber: newLineNumber,
        hunkIndex: hunkIndex >= 0 ? hunkIndex : null,
      });
      newLineNumber++;
      addedLines++;
    } else if (line.startsWith("-")) {
      lines.push({
        type: "removed",
        content: line.slice(1),
        oldLineNumber: oldLineNumber,
        newLineNumber: null,
        hunkIndex: hunkIndex >= 0 ? hunkIndex : null,
      });
      oldLineNumber++;
      removedLines++;
    } else {
      // Context line (starts with space or is empty)
      const content = line.startsWith(" ") ? line.slice(1) : line;
      lines.push({
        type: "context",
        content: content,
        oldLineNumber: oldLineNumber,
        newLineNumber: newLineNumber,
        hunkIndex: hunkIndex >= 0 ? hunkIndex : null,
      });
      oldLineNumber++;
      newLineNumber++;
    }
  }

  return {
    lines,
    stats: { addedLines, removedLines, changedHunks },
  };
}

/**
 * Get change positions for navigation.
 */
export function getChangePositions(lines: DiffLine[]): number[] {
  const hunkHeaders = lines
    .map((line, index) => ({ line, index }))
    .filter(
      (item) =>
        item.line.type === "header" && item.line.content.startsWith("@@"),
    )
    .map((item) => item.index);
  if (hunkHeaders.length > 0) {
    return hunkHeaders;
  }

  const positions: number[] = [];
  let inChange = false;
  lines.forEach((line, index) => {
    if (line.type === "added" || line.type === "removed") {
      if (!inChange) {
        positions.push(index);
        inChange = true;
      }
      return;
    }
    inChange = false;
  });
  return positions;
}

function getUnderlineClass(style: LineUnderlineStyle | undefined): string {
  if (style === "dashed") {
    return "underline decoration-dashed underline-offset-[3px]";
  }
  if (style === "solid") {
    return "underline decoration-solid underline-offset-[3px]";
  }
  return "";
}

function getDiffLineRowClass(flags: {
  isAdded: boolean;
  isRemoved: boolean;
  isContext: boolean;
  isCurrentChange: boolean;
}): string {
  const classes = ["flex group transition-colors"];
  if (flags.isRemoved) {
    classes.push("bg-[rgba(239,68,68,0.1)]");
  }
  if (flags.isAdded) {
    classes.push("bg-[rgba(34,197,94,0.1)]");
  }
  if (flags.isContext) {
    classes.push("hover:bg-[var(--color-bg-hover)]");
  }
  if (flags.isCurrentChange) {
    classes.push("ring-1 ring-inset ring-[var(--color-accent)]");
  }
  return classes.join(" ");
}

function getDiffLineGutterClass(flags: {
  isAdded: boolean;
  isRemoved: boolean;
  isContext: boolean;
}): string {
  const classes = [
    "w-20 shrink-0 flex select-none text-[11px] border-r border-[var(--color-separator)]",
  ];
  if (flags.isRemoved) {
    classes.push("bg-[rgba(239,68,68,0.05)]");
  }
  if (flags.isAdded) {
    classes.push("bg-[rgba(34,197,94,0.05)]");
  }
  if (flags.isContext) {
    classes.push("bg-[var(--color-bg-base)]");
  }
  return classes.join(" ");
}

function getDiffLineContentClass(flags: {
  isAdded: boolean;
  isRemoved: boolean;
  isContext: boolean;
  underlineClass: string;
}): string {
  const classes = ["flex-1 px-4 py-1 whitespace-pre-wrap break-words"];
  if (flags.isRemoved) {
    classes.push(
      "text-[rgba(239,68,68,0.7)] line-through decoration-[rgba(239,68,68,0.4)]",
    );
  }
  if (flags.isAdded) {
    classes.push("text-[rgba(34,197,94,0.9)]");
  }
  if ((flags.isRemoved || flags.isAdded) && flags.underlineClass) {
    classes.push(flags.underlineClass);
  }
  if (flags.isContext) {
    classes.push("text-[var(--color-fg-muted)]");
  }
  return classes.join(" ");
}

/**
 * UnifiedDiffView renders a unified diff with dual-column line numbers.
 *
 * Features:
 * - Dual-column line numbers (old | new)
 * - +/- indicators
 * - Colored backgrounds for added/removed lines
 * - Hover highlighting
 */
export function UnifiedDiffView(props: {
  lines: DiffLine[];
  currentChangeIndex?: number;
  changePositions?: number[];
  testId?: string;
  lineUnderlineStyle?: LineUnderlineStyle;
}): JSX.Element {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const testId = props.testId ?? "ai-diff";

  // Scroll to current change when it changes
  React.useEffect(() => {
    if (
      props.currentChangeIndex !== undefined &&
      props.changePositions &&
      props.changePositions.length > 0 &&
      scrollRef.current
    ) {
      const lineIndex = props.changePositions[props.currentChangeIndex];
      const lineElement = scrollRef.current.querySelector(
        `[data-line-index="${lineIndex}"]`,
      );
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [props.currentChangeIndex, props.changePositions]);

  if (props.lines.length === 0) {
    return (
      <div
        data-testid={testId}
        className="border border-[var(--color-separator)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)] p-2.5"
      >
        <Text size="small" color="muted" className="text-center py-4">
          No changes to display
        </Text>
      </div>
    );
  }

  return (
    <ScrollArea
      data-testid={testId}
      viewportTestId={`${testId}-scroll-viewport`}
      viewportRef={scrollRef}
      className="flex-1 font-[var(--font-family-mono)] text-[13px] leading-6"
      viewportClassName="h-full w-full overflow-y-auto"
    >
      {props.lines.map((line, index) => {
        if (line.type === "header") {
          return (
            <div
              key={index}
              data-line-index={index}
              className="flex bg-[var(--color-bg-raised)] border-y border-[var(--color-separator)]"
            >
              <div className="w-20 shrink-0 bg-[var(--color-bg-base)] border-r border-[var(--color-separator)]" />
              <div className="flex-1 px-4 py-1 text-[var(--color-fg-subtle)] font-medium text-[11px]">
                {line.content}
              </div>
            </div>
          );
        }

        const isRemoved = line.type === "removed";
        const isAdded = line.type === "added";
        const isContext = line.type === "context";
        const underlineClass = getUnderlineClass(props.lineUnderlineStyle);
        const isCurrentChange =
          props.currentChangeIndex !== undefined &&
          line.hunkIndex !== null &&
          line.hunkIndex === props.currentChangeIndex;

        return (
          <div
            key={index}
            data-line-index={index}
            className={getDiffLineRowClass({
              isAdded,
              isRemoved,
              isContext,
              isCurrentChange,
            })}
          >
            <div className={getDiffLineGutterClass({ isAdded, isRemoved, isContext })}>
              <div className="w-4 flex items-center justify-center">
                {isRemoved && (
                  <span className="text-[var(--color-error)] opacity-50">
                    -
                  </span>
                )}
                {isAdded && (
                  <span className="text-[var(--color-success)] opacity-50">
                    +
                  </span>
                )}
              </div>
              <div
                className={`w-8 text-right pr-2 py-1 ${isRemoved ? "text-[var(--color-error)] opacity-50" : "text-[var(--color-fg-subtle)]"}`}
              >
                {line.oldLineNumber ?? ""}
              </div>
              <div
                className={`w-8 text-right pr-2 py-1 ${isAdded ? "text-[var(--color-success)] opacity-50" : "text-[var(--color-fg-subtle)]"}`}
              >
                {line.newLineNumber ?? ""}
              </div>
            </div>

            <div
              className={getDiffLineContentClass({
                isAdded,
                isRemoved,
                isContext,
                underlineClass,
              })}
            >
              {line.content || "\u00A0"}
            </div>
          </div>
        );
      })}
    </ScrollArea>
  );
}

/**
 * Legacy DiffView for backward compatibility.
 * Now wraps UnifiedDiffView with parsed data.
 */
export function DiffView(props: {
  diffText: string;
  testId?: string;
}): JSX.Element {
  const { lines } = parseDiffLines(props.diffText);

  return (
    <div className="border border-[var(--color-separator)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)] overflow-hidden max-h-[300px]">
      <UnifiedDiffView lines={lines} testId={props.testId} />
    </div>
  );
}
