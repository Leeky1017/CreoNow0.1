import { Tooltip } from "../../components/primitives/Tooltip";

export const WRITE_BUTTON_LABEL = "续写";

export function WriteButton(props: {
  visible: boolean;
  disabled: boolean;
  running?: boolean;
  onClick: () => void;
}): JSX.Element | null {
  if (!props.visible) {
    return null;
  }

  return (
    <div
      data-testid="write-button-group"
      className="pointer-events-none absolute bottom-3 right-3 z-[var(--z-dropdown)]"
    >
      <Tooltip content={props.running ? "生成中..." : "触发续写技能"}>
        <button
          type="button"
          data-testid="write-button-trigger"
          disabled={props.disabled}
          onClick={props.onClick}
          className={`
            pointer-events-auto inline-flex min-w-[88px] items-center justify-center rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-semibold transition-colors
            ${
              props.disabled
                ? "cursor-not-allowed border-[var(--color-border-default)] bg-[var(--color-bg-raised)] text-[var(--color-fg-muted)] opacity-70"
                : "cursor-pointer border-[var(--color-border-accent)] bg-[var(--color-bg-surface)] text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]"
            }
          `}
        >
          {props.running ? "续写中..." : WRITE_BUTTON_LABEL}
        </button>
      </Tooltip>
    </div>
  );
}
