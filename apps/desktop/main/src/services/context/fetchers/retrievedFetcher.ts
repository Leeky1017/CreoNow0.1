import type { MatchResult, MatchableEntity } from "../../kg/entityMatcher";
import type {
  KnowledgeEntity,
  KnowledgeGraphService,
} from "../../kg/kgService";
import type { ContextLayerFetcher } from "../types";
import { formatEntityForContext } from "../utils/formatEntity";
import type { Logger } from "../../../logging/logger";
import {
  DegradationCounter,
  logWarn,
} from "../../shared/degradationCounter";

const KG_UNAVAILABLE_WARNING = "KG_UNAVAILABLE: 知识图谱数据未注入";
const ENTITY_MATCH_FAILED_WARNING = "ENTITY_MATCH_FAILED: 实体匹配异常";

export type RetrievedFetcherDeps = {
  kgService: Pick<KnowledgeGraphService, "entityList">;
  matchEntities: (text: string, entities: MatchableEntity[]) => MatchResult[];
  logger?: Pick<Logger, "info" | "error"> & {
    warn?: (event: string, data?: Record<string, unknown>) => void;
  };
  degradationCounter?: DegradationCounter;
  degradationEscalationThreshold?: number;
};

/**
 * Why: Retrieved layer must share the same deterministic entity rendering as
 * Rules layer while only injecting entities detected in additional input text.
 */
export function createRetrievedFetcher(
  deps: RetrievedFetcherDeps,
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
    const tracked = counter.record("retrievedFetcher");
    const payload: Record<string, unknown> = {
      module: "context-engine",
      fetcher: "retrievedFetcher",
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
    counter.reset("retrievedFetcher");
  };

  return async (request) => {
    const inputText = request.additionalInput?.trim();
    if (!inputText || inputText.length === 0) {
      resetDegradation();
      return {
        chunks: [],
      };
    }

    let entities: KnowledgeEntity[];
    try {
      const listed = await Promise.resolve(
        deps.kgService.entityList({
          projectId: request.projectId,
          filter: { aiContextLevel: "when_detected" },
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
      entities = listed.data.items.filter(
        (entity) => entity.aiContextLevel === "when_detected",
      );
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

    if (entities.length === 0) {
      resetDegradation();
      return {
        chunks: [],
      };
    }

    const matchableEntities: MatchableEntity[] = entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      aliases: entity.aliases,
      aiContextLevel: entity.aiContextLevel,
    }));

    let matches: MatchResult[];
    try {
      matches = deps.matchEntities(inputText, matchableEntities);
    } catch (error) {
      reportDegradation({
        reason: "entity_match_throw",
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return {
        chunks: [],
        warnings: [ENTITY_MATCH_FAILED_WARNING],
      };
    }

    if (matches.length === 0) {
      resetDegradation();
      return {
        chunks: [],
      };
    }

    const entitiesById = new Map(entities.map((entity) => [entity.id, entity]));
    const chunks = matches
      .map((match) => {
        const entity = entitiesById.get(match.entityId);
        if (!entity || entity.aiContextLevel !== "when_detected") {
          return null;
        }
        return {
          source: `codex:detected:${entity.id}`,
          projectId: entity.projectId,
          content: formatEntityForContext(entity),
        };
      })
      .filter((chunk): chunk is NonNullable<typeof chunk> => chunk !== null);

    resetDegradation();
    return {
      chunks,
    };
  };
}
