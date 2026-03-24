import { useTranslation } from "react-i18next";
import type { AiCandidate } from "../../stores/aiStore";
import { Text } from "../../components/primitives";
import { Button } from "../../components/primitives/Button";

// ---------------------------------------------------------------------------
// AiCandidateCards — candidate selection grid + regenerate action
// ---------------------------------------------------------------------------

export function AiCandidateCards(props: {
  candidates: AiCandidate[];
  selectedCandidate: AiCandidate | null;
  working: boolean;
  onSelectCandidate: (id: string) => void;
  onRegenerateAll: () => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      {props.candidates.length > 0 ? (
        <div
          data-testid="ai-candidate-list"
          className="w-full grid grid-cols-1 gap-2"
        >
          {props.candidates.map((candidate, index) => {
            const isSelected = props.selectedCandidate?.id === candidate.id;
            return (
              <Button
                key={candidate.id}
                data-testid={`ai-candidate-card-${index + 1}`}
                type="button"
                onClick={() => props.onSelectCandidate(candidate.id)}
                className={`focus-ring w-full text-left rounded-[var(--radius-md)] border px-3 py-2 transition-colors ${
                  isSelected
                    ? "border-[var(--color-accent)] bg-[var(--color-bg-selected)]"
                    : "border-[var(--color-border-default)] bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-hover)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-(--text-caption) font-semibold text-[var(--color-fg-default)]">
                    {t("ai.candidate", { index: index + 1 })}
                  </span>
                  {isSelected ? (
                    <span className="text-(--text-status) text-[var(--color-fg-accent)]">
                      {t("ai.candidateSelected")}
                    </span>
                  ) : null}
                </div>
                <Text
                  size="small"
                  color="muted"
                  className="mt-1 whitespace-pre-wrap"
                >
                  {candidate.summary}
                </Text>
              </Button>
            );
          })}
        </div>
      ) : null}

      {props.candidates.length > 1 ? (
        <div className="w-full flex justify-end">
          <Button
            data-testid="ai-candidate-regenerate"
            variant="ghost"
            size="sm"
            onClick={() => void props.onRegenerateAll()}
            disabled={props.working}
          >
            {t("ai.regenerateAll")}
          </Button>
        </div>
      ) : null}
    </>
  );
}
