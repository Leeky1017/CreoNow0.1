import { i18n } from "../../i18n";

export type SlashCommandId =
  | "continueWriting"
  | "describe"
  | "dialogue"
  | "character"
  | "outline"
  | "search";

export interface SlashCommandDefinition {
  id: SlashCommandId;
  label: string;
  description: string;
  keywords: string[];
}

export function getSlashCommandRegistry(): SlashCommandDefinition[] {
  return [
    {
      id: "continueWriting",
      label: i18n.t("editor.slash.continue.label"),
      description: i18n.t("editor.slash.continue.description"),
      keywords: ["续写", "continue", "write"],
    },
    {
      id: "describe",
      label: i18n.t("editor.slash.describe.label"),
      description: i18n.t("editor.slash.describe.description"),
      keywords: ["描写", "description", "describe"],
    },
    {
      id: "dialogue",
      label: i18n.t("editor.slash.dialogue.label"),
      description: i18n.t("editor.slash.dialogue.description"),
      keywords: ["对白", "dialogue", "conversation"],
    },
    {
      id: "character",
      label: i18n.t("editor.slash.character.label"),
      description: i18n.t("editor.slash.character.description"),
      keywords: ["角色", "character", "persona"],
    },
    {
      id: "outline",
      label: i18n.t("editor.slash.outline.label"),
      description: i18n.t("editor.slash.outline.description"),
      keywords: ["大纲", "outline", "structure"],
    },
    {
      id: "search",
      label: i18n.t("editor.slash.search.label"),
      description: i18n.t("editor.slash.search.description"),
      keywords: ["搜索", "search", "find"],
    },
  ];
}

/**
 * @deprecated Use getSlashCommandRegistry() for i18n-aware labels.
 * Kept as a lazy alias for callers that still reference SLASH_COMMAND_REGISTRY.
 */
export const SLASH_COMMAND_REGISTRY: SlashCommandDefinition[] = new Proxy(
  [] as SlashCommandDefinition[],
  {
    get(_target, prop, receiver) {
      const live = getSlashCommandRegistry();
      return Reflect.get(live, prop, receiver);
    },
  },
);

export function filterSlashCommands(
  commands: SlashCommandDefinition[],
  query: string,
): SlashCommandDefinition[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return commands;
  }

  return commands.filter((command) => {
    if (command.label.toLowerCase().includes(normalized)) {
      return true;
    }
    if (command.description.toLowerCase().includes(normalized)) {
      return true;
    }
    return command.keywords.some((keyword) =>
      keyword.toLowerCase().includes(normalized),
    );
  });
}

export type SlashCommandExecutors = Partial<Record<SlashCommandId, () => void>>;

export function routeSlashCommandExecution(
  commandId: SlashCommandId,
  executors: SlashCommandExecutors,
): boolean {
  const executor = executors[commandId];
  if (!executor) {
    return false;
  }
  executor();
  return true;
}
