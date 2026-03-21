import { useTranslation } from "react-i18next";
import { Tooltip } from "../../components/primitives/Tooltip";
import { Button } from "../../components/primitives/Button";

export function WriteButton(props: {
  visible: boolean;
  disabled: boolean;
  running?: boolean;
  onClick: () => void;
}): JSX.Element | null {
  const { t } = useTranslation();

  if (!props.visible) {
    return null;
  }

  return (
    <div
      data-testid="write-button-group"
      className="pointer-events-none absolute bottom-3 right-3 z-[var(--z-dropdown)]"
    >
      <Tooltip
        content={
          props.running
            ? t("editor.writeButton.generating")
            : t("editor.writeButton.tooltip")
        }
      >
        <Button
          type="button"
          data-testid="write-button-trigger"
          disabled={props.disabled}
          onClick={props.onClick}
          className={[
            "pointer-events-auto inline-flex min-w-22 items-center justify-center rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-semibold transition-colors",
            props.disabled
              ? "cursor-not-allowed border-[var(--color-border-default)] bg-[var(--color-bg-raised)] text-[var(--color-fg-muted)] opacity-70"
              : "cursor-pointer border-[var(--color-border-accent)] bg-[var(--color-bg-surface)] text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]",
          ].join(" ")}
        >
          {props.running
            ? t("editor.writeButton.writing")
            : t("editor.writeButton.label")}
        </Button>
      </Tooltip>
    </div>
  );
}
