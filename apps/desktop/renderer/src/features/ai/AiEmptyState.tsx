import { useTranslation } from "react-i18next";
import { Sun } from "lucide-react";
import { Text } from "../../components/primitives";

export function AiEmptyState(props: {
  className?: string;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <div
      data-testid="ai-empty-state"
      className={`flex-1 flex flex-col items-center justify-center text-center py-12 animate-fade-in ${props.className ?? ""}`}
    >
      <div className="animate-spin-slow">
        <Sun
          data-testid="ai-empty-state-icon"
          size={24}
          strokeWidth={1.5}
          className="w-12 h-12 text-[var(--color-fg-muted)]"
        />
      </div>
      <Text size="small" color="muted" className="mt-4">
        {t("ai.emptyHint")}
      </Text>
    </div>
  );
}
