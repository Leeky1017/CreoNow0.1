import React from "react";
import { useTranslation } from "react-i18next";
import { Input } from "../../components/primitives";

type InlineAiInputProps = {
  onSubmit: (instruction: string) => void;
  onCancel: () => void;
};

/**
 * 浮动输入框，用于接收用户的 Inline AI 指令。
 *
 * Why: Cmd/Ctrl+K 触发后需要一个就地输入框收集用户意图，
 * 类似 VS Code 的 Inline Chat。
 */
export function InlineAiInput(props: InlineAiInputProps): JSX.Element {
  const { onSubmit, onCancel } = props;
  const { t } = useTranslation();
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          onSubmit(trimmed);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [value, onSubmit, onCancel],
  );

  return (
    <div
      role="dialog"
      aria-label={t("editor.inlineAi.a11y.dialogLabel")}
      className="inline-ai-input-container"
      style={{
        background: "var(--color-bg-raised)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        zIndex: "var(--z-popover)",
        padding: "8px 12px",
        minWidth: "320px",
      }}
    >
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("editor.inlineAi.placeholder")}
        aria-label={t("editor.inlineAi.a11y.inputLabel")}
        className="inline-ai-input"
        fullWidth
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          color: "var(--color-text-default)",
          fontSize: "var(--font-size-sm)",
        }}
      />
    </div>
  );
}
