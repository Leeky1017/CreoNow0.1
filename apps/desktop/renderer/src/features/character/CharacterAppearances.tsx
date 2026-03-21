import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives";
import { ArrowRight, FileText } from "lucide-react";
import { labelStyles, sectionHeaderStyles } from "./character-detail-shared";
import type { ChapterAppearance } from "./types";
import { Label } from "../../components/primitives/Label";

function ChapterLink({
  appearance,
  onNavigate,
}: {
  appearance: ChapterAppearance;
  onNavigate?: () => void;
}) {
  return (
    <Button
      variant="ghost"
      onClick={onNavigate}
      className={[
        "!justify-between !px-2.5 !py-2.5 !h-auto w-full",
        "!rounded !border !border-transparent",
        "hover:!border-[var(--color-border-default)] hover:!bg-[var(--color-bg-raised)]",
        "group",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span className="text-[var(--color-fg-placeholder)] group-hover:text-[var(--color-info)] transition-colors">
          <FileText size={16} strokeWidth={1.5} />
        </span>
        <span className="text-xs text-[var(--color-fg-muted)] group-hover:text-[var(--color-fg-default)] transition-colors">
          {appearance.title}
        </span>
      </div>
      <span className="text-[var(--color-border-default)] group-hover:text-[var(--color-fg-placeholder)] opacity-0 group-hover:opacity-100 transition-[color,opacity]">
        <ArrowRight size={16} strokeWidth={1.5} />
      </span>
    </Button>
  );
}

export interface CharacterAppearancesProps {
  appearances: ChapterAppearance[];
  onNavigateToChapter?: (chapterId: string) => void;
  navigationWarning?: string | null;
}

export function CharacterAppearances(
  props: CharacterAppearancesProps,
): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="space-y-3 pb-2">
      <div className={sectionHeaderStyles}>
        <Label className={labelStyles}>
          {t("character.detail.appearances")}
        </Label>
        <span className="text-[10px] text-[var(--color-fg-placeholder)]">
          {props.appearances.length} {t("character.detail.chapters")}
        </span>
      </div>
      {props.navigationWarning ? (
        <div
          role="alert"
          data-testid="character-navigation-warning"
          className="rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-base)] px-3 py-2 text-xs text-[var(--color-warning-default)]"
        >
          {props.navigationWarning}
        </div>
      ) : null}
      {props.appearances.length > 0 ? (
        <div className="flex flex-col gap-1">
          {props.appearances.map((appearance) => (
            <ChapterLink
              key={appearance.id}
              appearance={appearance}
              onNavigate={() => props.onNavigateToChapter?.(appearance.id)}
            />
          ))}
        </div>
      ) : (
        <>
          <div className="text-xs text-[var(--color-fg-placeholder)] py-4 text-center border border-dashed border-[var(--color-border-default)] rounded-lg">
            {t("character.detail.noAppearances")}
          </div>
          <p className="text-[11px] text-[var(--color-fg-placeholder)]">
            {t("character.detail.noAppearancesFallbackHint")}
          </p>
        </>
      )}
    </div>
  );
}
