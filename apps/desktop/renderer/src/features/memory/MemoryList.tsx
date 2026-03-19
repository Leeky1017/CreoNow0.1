import { Button, Card, Text } from "../../components/primitives";
import { EmptyState } from "../../components/patterns/EmptyState";
import { LoadingState } from "../../components/patterns/LoadingState";
import type { PanelScope } from "./memoryPanelTypes";
import type { MemoryPanelState } from "./useMemoryState";
import { MemoryCard } from "./MemoryCard";

export function MemoryScopeTabs(props: {
  t: (key: string) => string;
  activeScope: PanelScope;
  setActiveScope: (scope: PanelScope) => void;
  hasProject: boolean;
}): JSX.Element {
  return (
    <div className="shrink-0 flex gap-1">
      <Button
        size="sm"
        variant={props.activeScope === "global" ? "secondary" : "ghost"}
        data-testid="memory-scope-global"
        onClick={() => props.setActiveScope("global")}
      >
        {props.t("memory.panel.globalTab")}
      </Button>
      <Button
        size="sm"
        variant={props.activeScope === "project" ? "secondary" : "ghost"}
        data-testid="memory-scope-project"
        disabled={!props.hasProject}
        onClick={() => props.setActiveScope("project")}
      >
        {props.t("memory.panel.projectTab")}
      </Button>
    </div>
  );
}

export function MemoryRulesCard(props: {
  t: (key: string, opts?: Record<string, unknown>) => string;
  state: MemoryPanelState;
}): JSX.Element {
  return (
    <Card
      noPadding
      className="flex-1 min-h-0 overflow-auto p-2.5 bg-[var(--color-bg-surface)]"
    >
      {props.state.status === "loading" ? (
        <LoadingState
          variant="spinner"
          size="sm"
          text={props.t("memory.panel.loading")}
          className="h-full"
        />
      ) : props.state.filteredRules.length === 0 ? (
        <EmptyState
          variant="generic"
          title={props.t("memory.panel.aiLearningHint")}
          actionLabel={props.t("memory.panel.addRuleManually")}
          onAction={() => props.state.setComposerOpen(true)}
          className="h-full min-h-45"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {props.state.groupedRules.map((group) => (
            <div key={group.category} className="flex flex-col gap-2">
              <Text size="small" color="muted">
                {props.t(group.labelKey)}
              </Text>
              {group.items.map((rule) => (
                <MemoryCard
                  key={rule.id}
                  t={props.t}
                  rule={rule}
                  state={props.state}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
