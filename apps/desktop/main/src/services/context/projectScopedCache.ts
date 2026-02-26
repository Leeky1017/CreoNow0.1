import type { Logger } from "../../logging/logger";
import type { CreonowWatchService } from "./watchService";
import { createKeyedSingleflight } from "../shared/concurrency";

export type ContextProjectScopedCache = {
  getOrComputeString: (args: {
    projectId: string;
    cacheKey: string;
    compute: () => string | Promise<string>;
  }) => Promise<string>;
  bindProject: (args: { projectId: string; traceId: string }) => void;
  unbindProject: (args: { projectId: string; traceId: string }) => void;
};

export function createContextProjectScopedCache(deps: {
  logger: Logger;
  watchService: CreonowWatchService;
}): ContextProjectScopedCache {
  const cacheByProject = new Map<string, Map<string, string>>();
  const singleflight = createKeyedSingleflight();

  return {
    getOrComputeString: async ({ projectId, cacheKey, compute }) => {
      const normalizedProjectId = projectId.trim();
      if (normalizedProjectId.length === 0) {
        return await compute();
      }

      const normalizedKey = cacheKey.trim();
      if (normalizedKey.length === 0) {
        return await compute();
      }

      const existingProjectCache = cacheByProject.get(normalizedProjectId);
      if (existingProjectCache) {
        const cached = existingProjectCache.get(normalizedKey);
        if (cached !== undefined) {
          return cached;
        }
      }

      return await singleflight.run(
        `${normalizedProjectId}:${normalizedKey}`,
        async () => {
          const projectCacheForCheck = cacheByProject.get(normalizedProjectId);
          const cached = projectCacheForCheck?.get(normalizedKey);
          if (cached !== undefined) {
            return cached;
          }

          const value = await compute();
          const projectCache = projectCacheForCheck ?? new Map<string, string>();
          projectCache.set(normalizedKey, value);
          cacheByProject.set(normalizedProjectId, projectCache);
          return value;
        },
      );
    },

    bindProject: (_args) => {
      // Intentionally a no-op in S1/S4: binding may be extended as more
      // project-scoped context resources are introduced.
    },

    unbindProject: ({ projectId, traceId }) => {
      const normalizedProjectId = projectId.trim();
      if (normalizedProjectId.length === 0) {
        return;
      }

      cacheByProject.delete(normalizedProjectId);

      const stopped = deps.watchService.stop({ projectId: normalizedProjectId });
      if (!stopped.ok) {
        deps.logger.error("context_project_unbind_watch_stop_failed", {
          code: stopped.error.code,
          message: stopped.error.message,
          traceId,
          projectId: normalizedProjectId,
        });
      }
    },
  };
}
