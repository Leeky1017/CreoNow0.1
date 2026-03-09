import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives";

type InlineAiDiffPreviewProps = {
  state: "streaming" | "ready";
  originalText: string;
  modifiedText: string;
  onAccept: () => void;
  onReject: () => void;
  onRegenerate: () => void;
};

type WordDiffSegment = {
  type: "equal" | "added" | "removed";
  text: string;
};

/**
 * 简易逐词 diff 算法。
 *
 * Why: 不引入外部依赖，用最小 LCS 思路即可满足
 * Inline AI 的逐词差异标记需求。
 */
function computeWordDiff(oldText: string, newText: string): WordDiffSegment[] {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);
  const segments: WordDiffSegment[] = [];

  let oi = 0;
  let ni = 0;

  while (oi < oldWords.length && ni < newWords.length) {
    if (oldWords[oi] === newWords[ni]) {
      segments.push({ type: "equal", text: oldWords[oi] });
      oi++;
      ni++;
    } else {
      // Greedy: look ahead to find a sync point
      let oAhead = -1;
      let nAhead = -1;
      const searchLimit = Math.min(10, Math.max(oldWords.length - oi, newWords.length - ni));
      for (let d = 1; d <= searchLimit; d++) {
        if (oAhead < 0 && oi + d < oldWords.length && oldWords[oi + d] === newWords[ni]) {
          oAhead = d;
        }
        if (nAhead < 0 && ni + d < newWords.length && newWords[ni + d] === oldWords[oi]) {
          nAhead = d;
        }
        if (oAhead >= 0 || nAhead >= 0) break;
      }

      if (oAhead >= 0 && (nAhead < 0 || oAhead <= nAhead)) {
        for (let i = 0; i < oAhead; i++) {
          segments.push({ type: "removed", text: oldWords[oi++] });
        }
      } else if (nAhead >= 0) {
        for (let i = 0; i < nAhead; i++) {
          segments.push({ type: "added", text: newWords[ni++] });
        }
      } else {
        segments.push({ type: "removed", text: oldWords[oi++] });
        segments.push({ type: "added", text: newWords[ni++] });
      }
    }
  }

  while (oi < oldWords.length) {
    segments.push({ type: "removed", text: oldWords[oi++] });
  }
  while (ni < newWords.length) {
    segments.push({ type: "added", text: newWords[ni++] });
  }

  return segments;
}

/**
 * Inline AI Diff 预览组件。
 *
 * Why: 用户需要在 Accept/Reject 前看到 AI 修改的逐词对比，
 * 删除用红色背景 + 删除线，新增用绿色背景。
 */
export function InlineAiDiffPreview(props: InlineAiDiffPreviewProps): JSX.Element {
  const { state, originalText, modifiedText, onAccept, onReject, onRegenerate } = props;
  const { t } = useTranslation();

  const isStreaming = state === "streaming";
  const segments = React.useMemo(
    () => computeWordDiff(originalText, modifiedText),
    [originalText, modifiedText],
  );

  return (
    <div
      role="region"
      aria-label={t("editor.inlineAi.a11y.previewLabel")}
      aria-busy={isStreaming}
      className="inline-ai-diff-preview"
      style={{
        background: "var(--color-bg-raised)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        padding: "12px",
        minWidth: "320px",
      }}
    >
      {isStreaming && (
        <div className="inline-ai-generating" data-testid="inline-ai-generating">
          {t("editor.inlineAi.generating")}
        </div>
      )}

      <div className="inline-ai-diff-content" data-testid="inline-ai-diff-content">
        {segments.map((seg, i) => {
          if (seg.type === "removed") {
            return (
              <span
                key={i}
                style={{
                  background: "var(--color-diff-removed-bg)",
                  color: "var(--color-diff-removed-text, var(--color-error))",
                  textDecoration: "line-through",
                }}
              >
                {seg.text}
              </span>
            );
          }
          if (seg.type === "added") {
            return (
              <span
                key={i}
                style={{
                  background: "var(--color-diff-added-bg)",
                  color: "var(--color-diff-added-text, var(--color-success))",
                }}
              >
                {seg.text}
              </span>
            );
          }
          return <span key={i}>{seg.text}</span>;
        })}
      </div>

      <div
        className="inline-ai-actions"
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "8px",
          justifyContent: "flex-end",
        }}
      >
        <Button
          onClick={onReject}
          aria-label={t("editor.inlineAi.a11y.rejectButton")}
          data-testid="inline-ai-reject"
          variant="ghost"
          size="sm"
        >
          {t("editor.inlineAi.reject")}
        </Button>
        <Button
          onClick={onRegenerate}
          disabled={isStreaming}
          aria-label={t("editor.inlineAi.a11y.regenerateButton")}
          data-testid="inline-ai-regenerate"
          variant="secondary"
          size="sm"
        >
          {t("editor.inlineAi.regenerate")}
        </Button>
        <Button
          onClick={onAccept}
          disabled={isStreaming}
          aria-label={t("editor.inlineAi.a11y.acceptButton")}
          data-testid="inline-ai-accept"
          variant="primary"
          size="sm"
        >
          {t("editor.inlineAi.accept")}
        </Button>
      </div>
    </div>
  );
}
