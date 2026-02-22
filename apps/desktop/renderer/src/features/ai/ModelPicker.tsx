import React from "react";

import { Button, Input, Text } from "../../components/primitives";

export type AiModel = string;

export type AiModelOption = {
  id: string;
  name: string;
  provider: string;
};

const FALLBACK_MODELS: AiModelOption[] = [
  { id: "gpt-5.2", name: "GPT-5.2", provider: "OpenAI" },
  { id: "creo-w", name: "CreoW", provider: "CreoNow" },
  { id: "deepseek", name: "DeepSeek", provider: "DeepSeek" },
  { id: "claude-opus", name: "Claude Opus", provider: "Anthropic" },
];

type ModelPickerProps = {
  open: boolean;
  selectedModel: AiModel;
  models?: AiModelOption[];
  recentModelIds?: string[];
  onOpenChange: (open: boolean) => void;
  onSelectModel: (model: AiModel) => void;
};

/**
 * ModelPicker renders a searchable, grouped model dropdown.
 */
export function ModelPicker(props: ModelPickerProps): JSX.Element | null {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [groupBy, setGroupBy] = React.useState<"provider" | "none">("provider");

  React.useEffect(() => {
    if (!props.open) {
      setSearchQuery("");
    }
  }, [props.open]);

  if (!props.open) {
    return null;
  }

  const allModels =
    Array.isArray(props.models) && props.models.length > 0
      ? props.models
      : FALLBACK_MODELS;

  const loweredQuery = searchQuery.trim().toLowerCase();
  const filteredModels =
    loweredQuery.length === 0
      ? allModels
      : allModels.filter((model) => {
          const haystack =
            `${model.name} ${model.id} ${model.provider}`.toLowerCase();
          return haystack.includes(loweredQuery);
        });

  const recentSet = new Set(props.recentModelIds ?? []);
  const recentModels =
    props.recentModelIds
      ?.map((id) => filteredModels.find((model) => model.id === id) ?? null)
      .filter((model): model is AiModelOption => model !== null) ?? [];
  const normalModels = filteredModels.filter(
    (model) => !recentSet.has(model.id),
  );

  const groupedModels = new Map<string, AiModelOption[]>();
  if (groupBy === "provider") {
    for (const model of normalModels) {
      const key = model.provider;
      const list = groupedModels.get(key) ?? [];
      list.push(model);
      groupedModels.set(key, list);
    }
  }

  const renderItem = (model: AiModelOption): JSX.Element => {
    const selected = model.id === props.selectedModel;
    return (
      <Button
        key={model.id}
        variant="ghost"
        size="sm"
        fullWidth
        type="button"
        onClick={() => props.onSelectModel(model.id)}
        className={`
          !h-auto !px-2.5 !py-1.5 !justify-start !rounded-[var(--radius-sm)] !text-left
          text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)]
          [&>span]:w-full [&>span]:items-center [&>span]:justify-between
          ${selected ? "bg-[var(--color-bg-selected)]" : ""}
        `}
      >
        <div className="min-w-0">
          <Text
            size="small"
            className="text-[var(--color-fg-default)] truncate block"
          >
            {model.name}
          </Text>
          <Text size="tiny" color="muted" className="block truncate">
            {model.id}
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
  };

  return (
    <>
      <div
        role="presentation"
        onClick={() => props.onOpenChange(false)}
        className="fixed inset-0 z-[var(--z-dropdown)]"
      />
      <div
        role="dialog"
        aria-label="Select Model"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-full left-0 right-0 mb-1 z-[var(--z-popover)] bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] overflow-hidden"
      >
        <div className="px-2.5 py-2 border-b border-[var(--color-border-default)] flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              data-testid="ai-model-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              placeholder="Search all models"
              className="h-8"
              fullWidth
            />
            <select
              data-testid="ai-model-groupby"
              className="h-8 px-2 text-[11px] rounded-[var(--radius-sm)] bg-[var(--color-bg-base)] border border-[var(--color-border-default)]"
              value={groupBy}
              onChange={(e) =>
                setGroupBy(e.currentTarget.value as "provider" | "none")
              }
            >
              <option value="provider">Group by</option>
              <option value="none">No group</option>
            </select>
          </div>
          <Text size="tiny" color="muted" className="uppercase tracking-wide">
            Models
          </Text>
        </div>

        <div className="py-1 max-h-72 overflow-y-auto">
          {recentModels.length > 0 ? (
            <div className="px-1.5 pb-1">
              <Text size="tiny" color="muted" className="px-1 py-1 uppercase">
                Recently Used
              </Text>
              {recentModels.map(renderItem)}
            </div>
          ) : null}

          {groupBy === "provider" ? (
            Array.from(groupedModels.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([provider, items]) => (
                <div key={provider} className="px-1.5 pb-1">
                  <Text
                    size="tiny"
                    color="muted"
                    className="px-1 py-1 uppercase"
                  >
                    {provider}
                  </Text>
                  {items.map(renderItem)}
                </div>
              ))
          ) : (
            <div className="px-1.5 pb-1">{normalModels.map(renderItem)}</div>
          )}

          {filteredModels.length === 0 ? (
            <div className="px-3 py-2">
              <Text size="small" color="muted">
                No models found.
              </Text>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

export function getModelName(model: AiModel, models?: AiModelOption[]): string {
  const dynamic =
    Array.isArray(models) && models.length > 0
      ? models.find((item) => item.id === model)
      : null;
  if (dynamic) {
    return dynamic.name;
  }
  return FALLBACK_MODELS.find((m) => m.id === model)?.name ?? model;
}
