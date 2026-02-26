import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import type fs from "node:fs";

import type { Logger } from "../../../logging/logger";
import { createCreonowWatchService } from "../watchService";
import { createContextProjectScopedCache } from "../projectScopedCache";

class FakeWatcher extends EventEmitter {
  closed = false;

  close(): void {
    this.closed = true;
  }
}

function createLogger(
  errors: Array<{ event: string; data?: Record<string, unknown> }>,
): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: (event, data) => {
      errors.push({ event, ...(data ? { data } : {}) });
    },
  };
}

// Scenario: BE-SLA-S4
// project-scoped caches/watchers should be cleaned on unbind.
{
  const errors: Array<{ event: string; data?: Record<string, unknown> }> = [];
  const createdWatchers: FakeWatcher[] = [];
  const logger = createLogger(errors);

  const watchService = createCreonowWatchService({
    logger,
    watchFactory: (() => {
      const watcher = new FakeWatcher();
      createdWatchers.push(watcher);
      return watcher as unknown as fs.FSWatcher;
    }) as typeof fs.watch,
  });

  const cache = createContextProjectScopedCache({
    logger,
    watchService,
  });

  const started = watchService.start({
    projectId: "proj-a",
    creonowRootPath: "/tmp/proj-a/.creonow",
  });
  assert.equal(started.ok, true);
  assert.equal(watchService.isWatching({ projectId: "proj-a" }), true);
  assert.equal(createdWatchers.length, 1);

  const first = await cache.getOrComputeString({
    projectId: "proj-a",
    cacheKey: "rules",
    compute: () => "cached-v1",
  });
  assert.equal(first, "cached-v1");

  const cached = await cache.getOrComputeString({
    projectId: "proj-a",
    cacheKey: "rules",
    compute: () => "cached-v2",
  });
  assert.equal(cached, "cached-v1");

  cache.unbindProject({ projectId: "proj-a", traceId: "trace-1" });

  assert.equal(watchService.isWatching({ projectId: "proj-a" }), false);
  assert.equal(createdWatchers[0]?.closed, true);

  const after = await cache.getOrComputeString({
    projectId: "proj-a",
    cacheKey: "rules",
    compute: () => "cached-v2",
  });
  assert.equal(after, "cached-v2", "cache should be cleared on unbind");

  assert.equal(errors.length, 0);
}

console.log("project-scoped-cache.cleanup.contract.test.ts: all assertions passed");
