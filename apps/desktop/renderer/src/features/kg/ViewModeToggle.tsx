import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives/Button";
import type { ViewMode } from "./kgTypes";

/**
 * ViewModeToggle - Toggle buttons for List/Graph/Timeline view.
 *
 * Why: Extracted to avoid TypeScript narrowing issues in parent component.
 */
export function ViewModeToggle(props: {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}): JSX.Element {
  const { t } = useTranslation();
  const entries: Array<{ mode: ViewMode; label: string }> = [
    { mode: "graph", label: t("kg.panel.viewGraph") },
    { mode: "timeline", label: t("kg.panel.viewTimeline") },
    { mode: "list", label: t("kg.panel.viewList") },
  ];
  return (
    <div className="flex items-center gap-1">
      {entries.map((entry) => (
        <Button
          key={entry.mode}
          variant="ghost"
          size="sm"
          data-testid={`kg-view-${entry.mode}`}
          onClick={() => props.onViewModeChange(entry.mode)}
          className={
            props.viewMode === entry.mode
              ? "bg-[var(--color-bg-selected)] text-[var(--color-fg-default)]"
              : "text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-hover)] transition-default"
          }
        >
          {entry.label}
        </Button>
      ))}
    </div>
  );
}
