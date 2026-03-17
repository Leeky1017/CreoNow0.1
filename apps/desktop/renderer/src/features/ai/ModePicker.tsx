import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Text } from "../../components/primitives";

/**

 * Available AI interaction modes

 */

export type AiMode = "agent" | "plan" | "ask";

function getModes(
  t: (key: string) => string,
): { id: AiMode; name: string; description: string }[] {
  return [
    {
      id: "agent",
      name: t("ai.modePicker.modeAgent"),
      description: t("ai.modePicker.modeAgentDesc"),
    },

    {
      id: "plan",
      name: t("ai.modePicker.modePlan"),
      description: t("ai.modePicker.modePlanDesc"),
    },

    {
      id: "ask",
      name: t("ai.modePicker.modeAsk"),
      description: t("ai.modePicker.modeAskDesc"),
    },
  ];
}

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
  const { t } = useTranslation();

  if (!props.open) {
    return null;
  }

  const modes = getModes(t);

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
        aria-label={t("ai.modePicker.selectMode")}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-full left-0 right-0 mb-1 z-[var(--z-popover)] bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] overflow-hidden"
      >
        <div className="px-2.5 py-2 border-b border-[var(--color-separator)]">
          <Text size="tiny" color="muted" className="uppercase tracking-wide">
            {t("ai.modePicker.sectionTitle")}
          </Text>
        </div>

        <div className="py-1">
          {modes.map((mode) => {
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
                  <Check
                    size={16}
                    strokeWidth={1.5}
                    className="text-[var(--color-fg-accent)] shrink-0"
                  />
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

export function getModeName(mode: AiMode, t: (key: string) => string): string {
  return getModes(t).find((m) => m.id === mode)?.name ?? mode;
}
