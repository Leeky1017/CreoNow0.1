import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives/Button";
import { Textarea } from "../../components/primitives/Textarea";
import { Text } from "../../components/primitives/Text";

export type AiDraft = {
  name: string;
  type: "novel" | "screenplay" | "media";
  description: string;
  chapterOutlines: string[];
  characters: string[];
};

interface AiAssistSectionProps {
  aiPrompt: string;
  setAiPrompt: (v: string) => void;
  aiGenerating: boolean;
  aiErrorMessage: string | null;
  aiDraft: AiDraft | null;
  onGenerate: () => void;
  onUseDraft: () => void;
}

export function AiAssistSection(props: AiAssistSectionProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <Textarea
        data-testid="create-project-ai-prompt"
        value={props.aiPrompt}
        onChange={(e) => props.setAiPrompt(e.target.value)}
        placeholder={t("projects.create.aiPlaceholder")}
        rows={4}
        fullWidth
      />
      <Button
        data-testid="create-project-ai-generate"
        variant="secondary"
        size="sm"
        loading={props.aiGenerating}
        onClick={props.onGenerate}
      >
        {props.aiGenerating
          ? t("projects.create.generating")
          : t("projects.create.generateDraft")}
      </Button>

      {props.aiErrorMessage ? (
        <Text
          size="small"
          color="muted"
          as="div"
          className="text-[var(--color-error)]"
        >
          {props.aiErrorMessage}
        </Text>
      ) : null}

      {props.aiDraft ? (
        <div className="space-y-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] p-3">
          <Text size="small" color="default">
            {t("projects.create.draftInfo", {
              name: props.aiDraft.name,
              type: props.aiDraft.type,
            })}
          </Text>
          <Text size="small" color="muted">
            {t("projects.create.draftStats", {
              chapters: props.aiDraft.chapterOutlines.length,
              characters: props.aiDraft.characters.length,
            })}
          </Text>
          <Button size="sm" variant="ghost" onClick={props.onUseDraft}>
            {t("projects.create.useDraft")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
