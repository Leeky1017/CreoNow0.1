import React from "react";
import { useTranslation } from "react-i18next";

import { Button, Text } from "../../components/primitives";
import {
  createInlineDiffDecorations,
  createPendingInlineDiffDecisions,
  resolveInlineDiffText,
  type InlineDiffDecision,
} from "./extensions/inlineDiff";

type InlineDiffControlsProps = {
  originalText: string;
  suggestedText: string;
  onApplyAcceptedText: (nextText: string) => void;
};

/**
 * Render inline diff hunks with per-hunk accept/reject controls.
 *
 * Why: AI changes must stay non-destructive until user explicitly accepts.
 */
export function InlineDiffControls(
  props: InlineDiffControlsProps,
): JSX.Element {
  const { originalText, suggestedText, onApplyAcceptedText } = props;
  const { t } = useTranslation();

  const decorations = React.useMemo(
    () =>
      createInlineDiffDecorations({
        originalText,
        suggestedText,
      }),
    [originalText, suggestedText],
  );

  const [decisions, setDecisions] = React.useState<InlineDiffDecision[]>(() =>
    createPendingInlineDiffDecisions(decorations.length),
  );
  const [currentText, setCurrentText] = React.useState(originalText);

  React.useEffect(() => {
    setDecisions(createPendingInlineDiffDecisions(decorations.length));
    setCurrentText(originalText);
  }, [decorations.length, originalText]);

  const resolveAcceptedText = React.useCallback(
    (nextDecisions: InlineDiffDecision[]): string =>
      resolveInlineDiffText({
        originalText,
        suggestedText,
        decisions: nextDecisions,
      }),
    [originalText, suggestedText],
  );

  const onAcceptHunk = React.useCallback(
    (hunkIndex: number): void => {
      setDecisions((prev) => {
        if (prev[hunkIndex] !== "pending") {
          return prev;
        }
        const next = [...prev];
        next[hunkIndex] = "accepted";
        const nextText = resolveAcceptedText(next);
        setCurrentText(nextText);
        onApplyAcceptedText(nextText);
        return next;
      });
    },
    [onApplyAcceptedText, resolveAcceptedText],
  );

  const onRejectHunk = React.useCallback((hunkIndex: number): void => {
    setDecisions((prev) => {
      if (prev[hunkIndex] !== "pending") {
        return prev;
      }
      const next = [...prev];
      next[hunkIndex] = "rejected";
      return next;
    });
  }, []);

  return (
    <section
      data-testid="inline-diff-decoration-layer"
      className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] p-3"
    >
      {decorations.length === 0 ? (
        <Text size="small" color="muted">
          {t("editor.inlineDiff.noChanges")}
        </Text>
      ) : null}

      {decorations.map((item) => {
        const decision = decisions[item.hunkIndex] ?? "pending";
        return (
          <article
            key={item.hunkIndex}
            data-testid={`inline-diff-hunk-${item.hunkIndex}`}
            className="space-y-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-2"
          >
            {item.removedLines.map((line, idx) => (
              <div
                key={`remove-${item.hunkIndex}-${idx}`}
                data-testid={`inline-diff-remove-${item.hunkIndex}-${idx}`}
                className="rounded-[var(--radius-xs)] bg-[var(--color-error-subtle)] px-2 py-1 text-[var(--color-error)] line-through"
              >
                {line}
              </div>
            ))}

            {item.addedLines.map((line, idx) => (
              <div
                key={`add-${item.hunkIndex}-${idx}`}
                data-testid={`inline-diff-add-${item.hunkIndex}-${idx}`}
                className="rounded-[var(--radius-xs)] bg-[var(--color-success-subtle)] px-2 py-1 text-[var(--color-success)]"
              >
                {line}
              </div>
            ))}

            {decision === "pending" ? (
              <div
                data-testid={`inline-diff-controls-${item.hunkIndex}`}
                className="flex items-center gap-2 pt-1"
              >
                <Button
                  data-testid={`inline-diff-accept-${item.hunkIndex}`}
                  variant="secondary"
                  size="sm"
                  onClick={() => onAcceptHunk(item.hunkIndex)}
                >
                  {t("editor.inlineDiff.accept")}
                </Button>
                <Button
                  data-testid={`inline-diff-reject-${item.hunkIndex}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => onRejectHunk(item.hunkIndex)}
                >
                  {t("editor.inlineDiff.reject")}
                </Button>
              </div>
            ) : null}
          </article>
        );
      })}

      <pre data-testid="inline-diff-current-text" className="hidden">
        {currentText}
      </pre>
    </section>
  );
}
