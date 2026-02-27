import type {
  MemoryInjectionItem,
  MemoryService,
} from "../../memory/memoryService";
import type { ContextLayerFetcher } from "../types";
import type { Logger } from "../../../logging/logger";
import {
  DegradationCounter,
  logWarn,
} from "../../shared/degradationCounter";

const MEMORY_UNAVAILABLE_WARNING = "MEMORY_UNAVAILABLE: 记忆数据未注入";
const MEMORY_DEGRADED_WARNING_PREFIX = "MEMORY_DEGRADED";
const MEMORY_EMPTY_WARNING = "MEMORY_DEGRADED: no preview memory items";
const MEMORY_INJECTION_HEADER = "[用户写作偏好 — 记忆注入]";

const ORIGIN_LABEL_MAP: Record<MemoryInjectionItem["origin"], string> = {
  learned: "自动学习",
  manual: "手动添加",
};

export type SettingsFetcherDeps = {
  memoryService: Pick<MemoryService, "previewInjection">;
  logger?: Pick<Logger, "info" | "error"> & {
    warn?: (event: string, data?: Record<string, unknown>) => void;
  };
  degradationCounter?: DegradationCounter;
  degradationEscalationThreshold?: number;
};

/**
 * Why: settings layer memory text must keep one deterministic layout so prompt
 * caching and contract assertions remain stable across requests.
 */
function formatInjectionContent(
  items: readonly Pick<MemoryInjectionItem, "content" | "origin">[],
): string {
  const lines = items.map((item) => {
    const originLabel = ORIGIN_LABEL_MAP[item.origin] ?? item.origin;
    return `- ${item.content}（来源：${originLabel}）`;
  });
  return [MEMORY_INJECTION_HEADER, ...lines].join("\n");
}

/**
 * Why: memory preview failures must degrade to warnings instead of breaking
 * context assembly so AI writing flow remains available.
 */
export function createSettingsFetcher(
  deps: SettingsFetcherDeps,
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
    const tracked = counter.record("settingsFetcher");
    const payload: Record<string, unknown> = {
      module: "context-engine",
      fetcher: "settingsFetcher",
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
    counter.reset("settingsFetcher");
  };

  return async (request) => {
    try {
      const preview = await Promise.resolve(
        deps.memoryService.previewInjection({
          projectId: request.projectId,
          documentId: request.documentId,
        }),
      );
      if (!preview.ok) {
        reportDegradation({
          reason: "memory_preview_not_ok",
          errorMessage: preview.error.message,
        });
        return {
          chunks: [],
          warnings: [MEMORY_UNAVAILABLE_WARNING],
        };
      }

      if (preview.data.items.length === 0) {
        resetDegradation();
        return {
          chunks: [],
          warnings: [MEMORY_EMPTY_WARNING],
        };
      }

      const warnings: string[] = [];
      if (preview.data.diagnostics?.degradedFrom) {
        const reason = preview.data.diagnostics.reason.trim();
        warnings.push(
          reason.length > 0
            ? `${MEMORY_DEGRADED_WARNING_PREFIX}: ${reason}`
            : MEMORY_DEGRADED_WARNING_PREFIX,
        );
        reportDegradation({
          reason: "memory_semantic_fallback",
          errorMessage: reason.length > 0 ? reason : undefined,
        });
      } else {
        resetDegradation();
      }

      return {
        chunks: [
          {
            source: "memory:injection",
            projectId: request.projectId,
            content: formatInjectionContent(preview.data.items),
          },
        ],
        ...(warnings.length > 0 ? { warnings } : {}),
      };
    } catch (error) {
      reportDegradation({
        reason: "memory_preview_throw",
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return {
        chunks: [],
        warnings: [MEMORY_UNAVAILABLE_WARNING],
      };
    }
  };
}
