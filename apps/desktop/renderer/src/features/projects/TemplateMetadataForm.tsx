import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives/Button";
import { Input } from "../../components/primitives/Input";
import { X } from "lucide-react";

interface ListItemProps {
  value: string;
  onRemove: () => void;
  disabled?: boolean;
}

export function TemplateListItem({
  value,
  onRemove,
  disabled,
}: ListItemProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)]">
      <span className="flex-1 text-sm text-[var(--color-fg-default)] truncate">
        {value}
      </span>
      <Button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="text-[var(--color-fg-muted)] hover:text-[var(--color-error)] transition-colors disabled:opacity-50"
        aria-label={t("projects.template.removeItem", { value })}
      >
        <X size={16} strokeWidth={1.5} />
      </Button>
    </div>
  );
}

interface AddItemInputProps {
  placeholder: string;
  onAdd: (value: string) => void;
  disabled?: boolean;
}

export function TemplateAddItemInput({
  placeholder,
  onAdd,
  disabled,
}: AddItemInputProps): JSX.Element {
  const { t } = useTranslation();
  const [value, setValue] = useState("");

  const handleAdd = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue("");
    }
  }, [value, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd],
  );

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        fullWidth
        className="flex-1"
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleAdd}
        disabled={disabled || !value.trim()}
      >
        {t("projects.template.add")}
      </Button>
    </div>
  );
}
