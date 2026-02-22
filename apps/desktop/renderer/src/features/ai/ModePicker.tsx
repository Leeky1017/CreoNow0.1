import { Button, Text } from "../../components/primitives";

/**

 * Available AI interaction modes

 */

export type AiMode = "agent" | "plan" | "ask";

const MODES: { id: AiMode; name: string; description: string }[] = [
  { id: "agent", name: "Agent", description: "Autonomous task execution" },

  { id: "plan", name: "Plan", description: "Create detailed plans first" },

  { id: "ask", name: "Ask", description: "Simple Q&A interaction" },
];

type ModePickerProps = {
  open: boolean;

  selectedMode: AiMode;

  onOpenChange: (open: boolean) => void;

  onSelectMode: (mode: AiMode) => void;
};

/**

 * ModePicker renders a dropdown to select the AI interaction mode.

 */

export function ModePicker(props: ModePickerProps): JSX.Element | null {
  if (!props.open) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}

      <div
        role="presentation"
        onClick={() => props.onOpenChange(false)}
        className="fixed inset-0 z-[var(--z-dropdown)]"
      />

      {/* Popup - positioned above the button */}

      <div
        role="dialog"
        aria-label="Select Mode"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-full left-0 right-0 mb-1 z-[var(--z-popover)] bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] overflow-hidden"
      >
        <div className="px-2.5 py-2 border-b border-[var(--color-border-default)]">
          <Text size="tiny" color="muted" className="uppercase tracking-wide">
            Mode
          </Text>
        </div>

        <div className="py-1">
          {MODES.map((mode) => {
            const selected = mode.id === props.selectedMode;

            return (
              <Button
                key={mode.id}
                variant="ghost"
                size="sm"
                fullWidth
                type="button"
                onClick={() => props.onSelectMode(mode.id)}
                className={`
                  !h-auto !px-2.5 !py-1.5 !justify-start !text-left !rounded-[var(--radius-sm)]
                  text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]
                  [&>span]:w-full [&>span]:items-center [&>span]:justify-between
                  ${selected ? "bg-[var(--color-bg-selected)]" : ""}
                `}
              >
                <div>
                  <Text size="small" className="text-[var(--color-fg-default)]">
                    {mode.name}
                  </Text>

                  <Text size="tiny" color="muted" className="block">
                    {mode.description}
                  </Text>
                </div>

                {selected && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-[var(--color-fg-accent)] shrink-0"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/**

 * Get display name for a mode

 */

export function getModeName(mode: AiMode): string {
  return MODES.find((m) => m.id === mode)?.name ?? mode;
}
