import {
  filterSlashCommands,
  type SlashCommandDefinition,
  type SlashCommandId,
} from "./slashCommands";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives/Button";
import { Input } from "../../components/primitives/Input";

interface SlashCommandPanelProps {
  open: boolean;
  query: string;
  candidates: SlashCommandDefinition[];
  onQueryChange: (query: string) => void;
  onSelectCommand: (commandId: SlashCommandId) => void;
  onRequestClose: () => void;
}

export function SlashCommandPanel(
  props: SlashCommandPanelProps,
): JSX.Element | null {
  const { t } = useTranslation();

  if (!props.open) {
    return null;
  }

  const filteredCandidates = filterSlashCommands(props.candidates, props.query);

  return (
    <div
      data-testid="slash-command-panel"
      className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-raised)] px-3 py-2"
    >
      <Input
        data-testid="slash-command-search-input"
        type="text"
        value={props.query}
        placeholder={t("editor.slashCommand.searchPlaceholder")}
        onChange={(event) => props.onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Escape") {
            return;
          }
          event.preventDefault();
          props.onRequestClose();
        }}
        className="mb-2 h-8 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-2 text-sm text-[var(--color-fg-default)] outline-none"
      />

      {filteredCandidates.length === 0 ? (
        <div
          data-testid="slash-command-empty-state"
          className="rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)] px-2 py-2 text-sm text-[var(--color-fg-muted)]"
        >
          {t("editor.slashCommand.noCommandsFound")}
        </div>
      ) : (
        <ul className="space-y-1">
          {filteredCandidates.map((candidate) => (
            <li
              key={candidate.id}
              className="rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)]"
            >
              <Button
                type="button"
                data-testid={`slash-command-item-${candidate.id}`}
                onClick={() => props.onSelectCommand(candidate.id)}
                className="w-full rounded-[var(--radius-sm)] px-2 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-default"
              >
                <p className="text-sm text-[var(--color-fg-default)]">
                  {candidate.label}
                </p>
                <p className="text-xs text-[var(--color-fg-muted)]">
                  {candidate.description}
                </p>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
