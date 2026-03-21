import React from "react";
import { useTranslation } from "react-i18next";
import { Input } from "../../components/primitives/Input";

type InlineAiInputProps = {
  onSubmit: (instruction: string) => void;
  onDismiss: () => void;
};

export function InlineAiInput(props: InlineAiInputProps): JSX.Element {
  const { onSubmit, onDismiss } = props;
  const { t } = useTranslation();
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      const el = inputRef.current?.closest("[data-testid='inline-ai-input']");
      if (el && !el.contains(e.target as Node)) {
        onDismiss();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onDismiss]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Escape") {
      e.preventDefault();
      onDismiss();
      return;
    }
    if (e.key === "Enter" && value.trim().length > 0) {
      e.preventDefault();
      onSubmit(value.trim());
    }
  }

  return (
    <div
      data-testid="inline-ai-input"
      className="absolute z-[var(--z-popover)] min-w-80 max-w-lg rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] shadow-[var(--shadow-lg)] animate-[inline-ai-appear_200ms_var(--ease-out)]"
      style={{
        bottom: "calc(100% + var(--space-2))",
        left: "50%",
        transform: "translateX(-50%)",
      }}
    >
      <div className="flex items-center gap-2 px-[var(--space-3)] py-[var(--space-2)]">
        <Input
          ref={inputRef}
          type="text"
          data-testid="inline-ai-instruction-input"
          className="flex-1 border-none bg-transparent font-[var(--font-family-ui)] text-[length:var(--text-body-size)] text-[var(--color-fg-default)] placeholder:text-[var(--color-fg-placeholder)] outline-none"
          placeholder={t("inlineAi.placeholder")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <span className="text-[length:var(--text-caption-size)] text-[var(--color-fg-muted)] select-none">
          {t("inlineAi.submitHint")}
        </span>
      </div>
    </div>
  );
}
