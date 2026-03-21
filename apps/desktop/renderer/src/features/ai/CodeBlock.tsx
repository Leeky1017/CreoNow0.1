import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives/Button";

/**
 * CodeBlock - Renders a code block with Copy and Apply buttons
 * Exported for use in AI response rendering
 */
export function CodeBlock(props: {
  language?: string;
  code: string;
  onCopy?: () => void;
  onApply?: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  function handleCopy(): void {
    void navigator.clipboard.writeText(props.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    props.onCopy?.();
  }

  return (
    <div className="my-3 border border-[var(--color-border-default)] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-bg-base)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-bg-raised)] border-b border-[var(--color-separator)]">
        <span className="text-[11px] text-[var(--color-fg-muted)] uppercase tracking-wide">
          {props.language || "code"}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            onClick={handleCopy}
            className="focus-ring px-2 py-0.5 text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
          >
            {copied ? t("ai.panel.copied") : t("ai.panel.copy")}
          </Button>
          {props.onApply && (
            <Button
              type="button"
              onClick={props.onApply}
              className="focus-ring px-2 py-0.5 text-[11px] text-[var(--color-fg-accent)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
            >
              {t("ai.panel.applyCode")}
            </Button>
          )}
        </div>
      </div>
      {/* Code content */}
      <pre className="m-0 p-3 overflow-x-auto text-[12px] leading-[1.6] text-[var(--color-fg-default)] font-[var(--font-family-mono)]">
        {/* 审计：v1-13 #014 KEEP */}
        {/* eslint-disable-next-line creonow/no-raw-error-code-in-ui -- 技术原因：false positive; props.code is programming source code content, not an error code */}
        <code>{props.code}</code>
      </pre>
    </div>
  );
}
