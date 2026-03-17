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
  const generationByProject = new Map<string, number>();
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

      const generation = generationByProject.get(normalizedProjectId) ?? 0;
      const existingProjectCache = cacheByProject.get(normalizedProjectId);
      if (existingProjectCache) {
        const cached = existingProjectCache.get(normalizedKey);
        if (cached !== undefined) {
          return cached;
        }
      }

      return await singleflight.run(
        `${normalizedProjectId}:${generation}:${normalizedKey}`,
        async () => {
          const projectCache = cacheByProject.get(normalizedProjectId);
          const cached = projectCache?.get(normalizedKey);
          if (cached !== undefined) {
            return cached;
          }

          const value = await compute();
          const latestGeneration =
            generationByProject.get(normalizedProjectId) ?? 0;
          if (latestGeneration !== generation) {
            return value;
          }

          const latestProjectCache =
            cacheByProject.get(normalizedProjectId) ??
            new Map<string, string>();
          latestProjectCache.set(normalizedKey, value);
          cacheByProject.set(normalizedProjectId, latestProjectCache);
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
      generationByProject.set(
        normalizedProjectId,
        (generationByProject.get(normalizedProjectId) ?? 0) + 1,
      );

      const stopped = deps.watchService.stop({
        projectId: normalizedProjectId,
      });
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
