import React from "react";
import { useTranslation } from "react-i18next";

import { Button, Text } from "../../components/primitives";
import { useHotkey } from "../../lib/hotkeys/useHotkey";

type InlineAiDiffPreviewProps = {
  phase: "streaming" | "ready";
  originalText: string;
  suggestedText: string;
  onAccept: () => void;
  onReject: () => void;
  onRegenerate: () => void;
};

export function InlineAiDiffPreview(
  props: InlineAiDiffPreviewProps,
): JSX.Element {
  const {
    phase,
    originalText,
    suggestedText,
    onAccept,
    onReject,
    onRegenerate,
  } = props;
  const { t } = useTranslation();
  const isStreaming = phase === "streaming";

  useHotkey(
    "inline-ai-diff:escape",
    { key: "Escape" },
    React.useCallback(() => {
      onReject();
    }, [onReject]),
    "editor",
    15,
  );

  useHotkey(
    "inline-ai-diff:accept",
    { key: "Enter" },
    React.useCallback(() => {
      if (isStreaming) return;
      onAccept();
    }, [isStreaming, onAccept]),
    "editor",
    15,
    !isStreaming,
  );

  return (
    <div
      data-testid="inline-ai-diff-preview"
      className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-[var(--space-4)] py-[var(--space-3)]"
    >
      {isStreaming && (
        <div
          data-testid="inline-ai-loading"
          className="flex items-center gap-2 pb-2"
        >
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-info)] border-t-transparent" />
          <Text size="small" color="muted">
            {t("inlineAi.loading")}
          </Text>
        </div>
      )}

      <div
        data-testid="inline-ai-diff-content"
        className="font-[var(--font-family-body)] text-[length:var(--text-editor-size)] leading-[var(--text-editor-line-height)]"
      >
        {originalText !== suggestedText && (
          <span
            data-testid="inline-ai-diff-removed"
            className="bg-[var(--color-diff-removed-bg)] text-[var(--color-diff-removed-text)] line-through decoration-[var(--color-diff-removed-decoration)]"
          >
            {originalText}
          </span>
        )}
        {suggestedText.length > 0 && (
          <span
            data-testid="inline-ai-diff-added"
            className="bg-[var(--color-diff-added-bg)] text-[var(--color-diff-added-text)]"
          >
            {suggestedText}
          </span>
        )}
      </div>

      <div
        data-testid="inline-ai-actions"
        className="mt-2 flex items-center gap-[var(--space-2)] border-t border-[var(--color-separator)] pt-2"
      >
        <Button
          data-testid="inline-ai-accept-btn"
          variant="primary"
          size="sm"
          disabled={isStreaming}
          onClick={onAccept}
          className="rounded-[var(--radius-sm)] bg-[var(--color-btn-success-bg)] text-[var(--color-fg-inverse)]"
        >
          {t("inlineAi.accept")}
        </Button>
        <Button
          data-testid="inline-ai-reject-btn"
          variant="secondary"
          size="sm"
          onClick={onReject}
          className="rounded-[var(--radius-sm)]"
        >
          {t("inlineAi.reject")}
        </Button>
        <Button
          data-testid="inline-ai-regenerate-btn"
          variant="secondary"
          size="sm"
          disabled={isStreaming}
          onClick={onRegenerate}
          className="rounded-[var(--radius-sm)]"
        >
          {t("inlineAi.regenerate")}
        </Button>
      </div>
    </div>
  );
}
