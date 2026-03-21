import { Button, Card, Text, Textarea } from "../../components/primitives";
import { Select } from "../../components/primitives/Select";
import type { SemanticCategory, SemanticRule } from "./memoryPanelTypes";
import { CATEGORY_GROUPS } from "./memoryPanelTypes";
import type { MemoryPanelState } from "./useMemoryState";
import { Label } from "../../components/primitives/Label";

export function MemoryConflictSection(props: {
  t: (key: string, opts?: Record<string, unknown>) => string;
  state: MemoryPanelState;
}): JSX.Element | null {
  if (props.state.conflictCount <= 0) {
    return null;
  }

  return (
    <>
      <Card
        noPadding
        data-testid="memory-conflict-notice"
        className="shrink-0 px-2.5 py-2 border-[var(--color-warning)] text-[var(--color-warning)]"
      >
        <div className="flex items-center gap-2">
          <Text size="small" className="text-[var(--color-warning)]">
            {props.t("memory.panel.conflictsDetected", {
              count: props.state.conflictCount,
            })}
          </Text>
          <Button
            size="sm"
            variant="secondary"
            data-testid="memory-open-conflict-resolution"
            className="ml-auto"
            onClick={() => props.state.setConflictPanelOpen((open) => !open)}
          >
            {props.state.conflictPanelOpen
              ? props.t("memory.panel.hideConflictResolver")
              : props.t("memory.panel.openConflictResolver")}
          </Button>
        </div>
      </Card>

      {props.state.conflictPanelOpen &&
      props.state.pendingConflicts.length > 0 ? (
        <Card
          noPadding
          data-testid="memory-conflict-resolution-panel"
          className="shrink-0 sticky top-0 z-[var(--z-sticky)] p-2.5 border-[var(--color-warning)] bg-[var(--color-bg-surface)]"
        >
          <div className="flex flex-col gap-2">
            <Text size="small" color="muted">
              {props.t("memory.panel.conflictResolverTitle")}
            </Text>
            {props.state.pendingConflicts.map((conflict) => {
              const options = conflict.ruleIds
                .map((ruleId) =>
                  props.state.filteredRules.find((rule) => rule.id === ruleId),
                )
                .filter((rule): rule is SemanticRule => Boolean(rule));
              return (
                <div
                  key={conflict.id}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-border-default)] p-2"
                  data-testid={`memory-conflict-${conflict.id}`}
                >
                  <Text size="tiny" color="muted">
                    {props.t("memory.panel.conflictResolverHint")}
                  </Text>
                  <div className="mt-2 flex flex-col gap-2">
                    {options.map((option) => (
                      <div
                        key={option.id}
                        className="rounded-[var(--radius-sm)] bg-[var(--color-bg-raised)] p-2"
                      >
                        <Text size="small">{option.rule}</Text>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="mt-2"
                          data-testid={`memory-resolve-${conflict.id}-${option.id}`}
                          onClick={() =>
                            void props.state.handleResolveConflict(
                              conflict.id,
                              option.id,
                            )
                          }
                        >
                          {props.t("memory.panel.keepThisRule")}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}
    </>
  );
}

export function MemoryComposer(props: {
  t: (key: string) => string;
  draftRule: string;
  setDraftRule: (v: string) => void;
  draftCategory: SemanticCategory;
  setDraftCategory: (v: SemanticCategory) => void;
  handleCreateRule: () => Promise<void>;
  onClose: () => void;
}): JSX.Element {
  return (
    <Card
      noPadding
      className="shrink-0 p-2.5 bg-[var(--color-bg-raised)] rounded-[var(--radius-sm)]"
    >
      <div className="flex flex-col gap-2">
        <Label
          className="text-xs text-[var(--color-fg-muted)]"
          htmlFor="memory-rule-create-input"
        >
          {props.t("memory.panel.addRule")}
        </Label>
        <Textarea
          id="memory-rule-create-input"
          aria-label={props.t("memory.panel.addRule")}
          value={props.draftRule}
          onChange={(event) => props.setDraftRule(event.target.value)}
        />
        <Label
          className="text-xs text-[var(--color-fg-muted)]"
          htmlFor="memory-rule-category"
        >
          {props.t("memory.panel.category")}
        </Label>
        <Select
          id="memory-rule-category"
          value={props.draftCategory}
          onValueChange={(val) =>
            props.setDraftCategory(val as SemanticCategory)
          }
          options={CATEGORY_GROUPS.map((group) => ({
            value: group.category,
            label: props.t(group.labelKey),
          }))}
          className="h-8 text-sm"
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => void props.handleCreateRule()}>
            {props.t("memory.panel.saveRule")}
          </Button>
          <Button size="sm" variant="ghost" onClick={props.onClose}>
            {props.t("memory.panel.cancel")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
