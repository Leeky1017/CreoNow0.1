import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { DiffChange, DiffChangeState } from "./types";

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
  </svg>
);
const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
  </svg>
);

export function computeWordDiff(
  before: string,
  after: string,
): {
  beforeParts: Array<{ text: string; type: "unchanged" | "removed" }>;
  afterParts: Array<{ text: string; type: "unchanged" | "added" }>;
} {
  const beforeTokens = before.match(/\S+|\s+/g) ?? [];
  const afterTokens = after.match(/\S+|\s+/g) ?? [];
  const beforeParts: Array<{ text: string; type: "unchanged" | "removed" }> =
    [];
  const afterParts: Array<{ text: string; type: "unchanged" | "added" }> = [];
  const lcsLengths = Array.from({ length: beforeTokens.length + 1 }, () =>
    Array<number>(afterTokens.length + 1).fill(0),
  );

  for (let i = beforeTokens.length - 1; i >= 0; i -= 1) {
    for (let j = afterTokens.length - 1; j >= 0; j -= 1) {
      if (beforeTokens[i] === afterTokens[j]) {
        lcsLengths[i][j] = lcsLengths[i + 1][j + 1] + 1;
      } else {
        lcsLengths[i][j] = Math.max(lcsLengths[i + 1][j], lcsLengths[i][j + 1]);
      }
    }
  }

  let beforeIndex = 0;
  let afterIndex = 0;
  while (beforeIndex < beforeTokens.length && afterIndex < afterTokens.length) {
    if (beforeTokens[beforeIndex] === afterTokens[afterIndex]) {
      beforeParts.push({ text: beforeTokens[beforeIndex], type: "unchanged" });
      afterParts.push({ text: afterTokens[afterIndex], type: "unchanged" });
      beforeIndex += 1;
      afterIndex += 1;
      continue;
    }

    if (
      lcsLengths[beforeIndex + 1][afterIndex] >=
      lcsLengths[beforeIndex][afterIndex + 1]
    ) {
      beforeParts.push({ text: beforeTokens[beforeIndex], type: "removed" });
      beforeIndex += 1;
    } else {
      afterParts.push({ text: afterTokens[afterIndex], type: "added" });
      afterIndex += 1;
    }
  }

  while (beforeIndex < beforeTokens.length) {
    beforeParts.push({ text: beforeTokens[beforeIndex], type: "removed" });
    beforeIndex += 1;
  }

  while (afterIndex < afterTokens.length) {
    afterParts.push({ text: afterTokens[afterIndex], type: "added" });
    afterIndex += 1;
  }

  return { beforeParts, afterParts };
}

const diffContainerStyles = ["flex-1", "flex", "overflow-hidden"].join(" ");
const diffPanelStyles = ["flex-1", "overflow-y-auto", "p-6"].join(" ");
const beforePanelStyles = [
  diffPanelStyles,
  "border-r border-[var(--color-separator)] bg-[var(--color-bg-base)]",
].join(" ");
const afterPanelStyles = [diffPanelStyles, "bg-[var(--color-bg-surface)]"].join(
  " ",
);
const labelStyles = [
  "uppercase text-label font-bold tracking-wider",
  "mb-4",
].join(" ");
const beforeLabelStyles = [labelStyles, "text-(--color-error) opacity-70"].join(
  " ",
);
const afterLabelStyles = [
  labelStyles,
  "text-(--color-success) opacity-70",
].join(" ");
const textStyles = ["text-sm", "leading-relaxed", "font-mono"].join(" ");
const beforeTextStyles = [textStyles, "text-(--color-fg-muted)"].join(" ");
const afterTextStyles = [textStyles, "text-(--color-fg-default)"].join(" ");
const removedStyles = [
  "bg-[var(--color-error-subtle)] text-(--color-error) line-through px-0.5",
  "rounded-sm",
].join(" ");
const addedStyles = [
  "bg-[var(--color-success-subtle)] text-(--color-success) px-0.5 rounded-sm",
].join(" ");
const stateIndicatorStyles = [
  "absolute top-2 right-2 flex",
  "items-center gap-1 text-label font-medium",
  "px-2 py-0.5 rounded-full",
].join(" ");
const pendingIndicatorStyles = [
  stateIndicatorStyles,
  "bg-[var(--color-info-subtle)] text-(--color-info)",
].join(" ");
const acceptedIndicatorStyles = [
  stateIndicatorStyles,
  "bg-[var(--color-success-subtle)] text-(--color-success)",
].join(" ");
const rejectedIndicatorStyles = [
  stateIndicatorStyles,
  "bg-[var(--color-error-subtle)] text-(--color-error)",
].join(" ");

interface AiDiffContentProps {
  currentChange: DiffChange;
  currentState: DiffChangeState;
}

export function AiDiffContent({
  currentChange,
  currentState,
}: AiDiffContentProps): JSX.Element {
  const { t } = useTranslation();

  // Compute word diff for current change
  const { beforeParts, afterParts } = useMemo(
    () => computeWordDiff(currentChange.before, currentChange.after),
    [currentChange.before, currentChange.after],
  );

  // Render state indicator
  const renderStateIndicator = () => {
    if (currentState === "accepted") {
      return (
        <div className={acceptedIndicatorStyles}>
          <CheckIcon />
          <span>{t("ai.diff.accepted")}</span>
        </div>
      );
    }
    if (currentState === "rejected") {
      return (
        <div className={rejectedIndicatorStyles}>
          <XIcon />
          <span>{t("ai.diff.rejected")}</span>
        </div>
      );
    }
    return (
      <div className={pendingIndicatorStyles}>
        <span>{t("ai.diff.pending")}</span>
      </div>
    );
  };
  return (
    <div className={diffContainerStyles}>
      {/* Before panel */}
      <div className={`${beforePanelStyles} relative`}>
        <div className={beforeLabelStyles}>{t("ai.diff.before")}</div>
        <p className={beforeTextStyles}>
          {beforeParts.map((part, idx) => (
            <span
              key={idx}
              className={part.type === "removed" ? removedStyles : undefined}
            >
              {part.text}
            </span>
          ))}
        </p>
      </div>

      {/* After panel */}
      <div className={`${afterPanelStyles} relative`}>
        {renderStateIndicator()}
        <div className={afterLabelStyles}>{t("ai.diff.after")}</div>
        <p className={afterTextStyles}>
          {afterParts.map((part, idx) => (
            <span
              key={idx}
              className={part.type === "added" ? addedStyles : undefined}
            >
              {part.text}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

export function DiffText({
  text,
  type,
}: {
  text: string;
  type: "added" | "removed";
}): JSX.Element {
  const styles = type === "added" ? addedStyles : removedStyles;
  return <span className={styles}>{text}</span>;
}
