import type { ContextLayerFetcher } from "../types";
import type { KnowledgeGraphService } from "../../kg/kgService";
import { formatEntityForContext } from "../utils/formatEntity";
import type { Logger } from "../../../logging/logger";
import {
  DegradationCounter,
  logWarn,
} from "../../shared/degradationCounter";

const KG_UNAVAILABLE_WARNING = "KG_UNAVAILABLE: 知识图谱数据未注入";

export type RulesFetcherDeps = {
  kgService: Pick<KnowledgeGraphService, "entityList">;
  logger?: Pick<Logger, "info" | "error"> & {
    warn?: (event: string, data?: Record<string, unknown>) => void;
  };
  degradationCounter?: DegradationCounter;
  degradationEscalationThreshold?: number;
};

/**
 * Why: Rules-layer KG injection must degrade gracefully instead of breaking
 * full context assembly when KG query is temporarily unavailable.
 */
export function createRulesFetcher(
  deps: RulesFetcherDeps,
): ContextLayerFetcher {
  const counter =
    deps.degradationCounter ??
    new DegradationCounter({
      threshold: deps.degradationEscalationThreshold,
    });

  const reportDegradation = (args: {
    reason: string;
    errorMessage?: string;
  }): void => {
    if (!deps.logger) {
      return;
    }
    const tracked = counter.record("rulesFetcher");
    const payload: Record<string, unknown> = {
      module: "context-engine",
      fetcher: "rulesFetcher",
      reason: args.reason,
      count: tracked.count,
      firstDegradedAt: tracked.firstDegradedAt,
    };
    if (args.errorMessage) {
      payload.error = args.errorMessage;
    }
    logWarn(deps.logger, "context_fetcher_degradation", payload);
    if (tracked.escalated) {
      deps.logger.error("context_fetcher_degradation_escalation", payload);
    }
  };

  const resetDegradation = () => {
    counter.reset("rulesFetcher");
  };

  return async (request) => {
    try {
      const listed = await Promise.resolve(
        deps.kgService.entityList({
          projectId: request.projectId,
          filter: { aiContextLevel: "always" },
        }),
      );

      if (!listed.ok) {
        reportDegradation({
          reason: "kg_entity_list_not_ok",
          errorMessage: listed.error.message,
        });
        return {
          chunks: [],
          warnings: [KG_UNAVAILABLE_WARNING],
        };
      }

      resetDegradation();

      const alwaysItems = listed.data.items.filter(
        (entity) => entity.aiContextLevel === "always",
      );

      if (alwaysItems.length === 0) {
        return {
          chunks: [],
        };
      }

      return {
        chunks: alwaysItems.map((entity) => ({
          source: `kg:always:${entity.id}`,
          projectId: entity.projectId,
          content: formatEntityForContext(entity),
        })),
      };
    } catch (error) {
      reportDegradation({
        reason: "kg_entity_list_throw",
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return {
        chunks: [],
        warnings: [KG_UNAVAILABLE_WARNING],
      };
    }
  };
}
