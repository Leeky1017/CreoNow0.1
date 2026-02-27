import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import type fs from "node:fs";

import type { Logger } from "../../../logging/logger";
import { createCreonowWatchService } from "../watchService";

class FakeWatcher extends EventEmitter {
  closed = false;

  close(): void {
    this.closed = true;
  }
}

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function runScenario(name: string, fn: () => void): void {
  try {
    fn();
  } catch (error) {
    throw new Error(
      `[${name}] ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

runScenario("AUD-C15-S1 stop should remove watcher error listener", () => {
  const createdWatchers: FakeWatcher[] = [];
  const service = createCreonowWatchService({
    logger: createLogger(),
    watchFactory: (() => {
      const watcher = new FakeWatcher();
      createdWatchers.push(watcher);
      return watcher as unknown as fs.FSWatcher;
    }) as typeof fs.watch,
  });

  const started = service.start({
    projectId: "project-1",
    creonowRootPath: "/tmp/project-1/.creonow",
  });
  assert.equal(started.ok, true);
  assert.equal(createdWatchers.length, 1);
  const watcher = createdWatchers[0];
  assert.ok(watcher, "expected watcher to be created");
  assert.equal(watcher.listenerCount("error"), 1);

  const stopped = service.stop({ projectId: "project-1" });
  assert.equal(stopped.ok, true);
  assert.equal(watcher.listenerCount("error"), 0);
  assert.equal(watcher.closed, true);
});

runScenario("AUD-C15-S2 error path should remove watcher error listener", () => {
  const createdWatchers: FakeWatcher[] = [];
  const invalidations: Array<{ projectId: string; reason: "error" }> = [];
  const service = createCreonowWatchService({
    logger: createLogger(),
    watchFactory: (() => {
      const watcher = new FakeWatcher();
      createdWatchers.push(watcher);
      return watcher as unknown as fs.FSWatcher;
    }) as typeof fs.watch,
    onWatcherInvalidated: (event) => {
      invalidations.push(event);
    },
  });

  const started = service.start({
    projectId: "project-2",
    creonowRootPath: "/tmp/project-2/.creonow",
  });
  assert.equal(started.ok, true);
  const watcher = createdWatchers[0];
  assert.ok(watcher, "expected watcher to be created");
  assert.equal(watcher.listenerCount("error"), 1);

  watcher.emit("error", new Error("broken watch"));

  assert.equal(watcher.listenerCount("error"), 0);
  assert.equal(service.isWatching({ projectId: "project-2" }), false);
  assert.deepEqual(invalidations, [
    {
      projectId: "project-2",
      reason: "error",
    },
  ]);
});

runScenario("AUD-C15-S3 repeated create-stop cycles should not leak listeners", () => {
  const createdWatchers: FakeWatcher[] = [];
  const service = createCreonowWatchService({
    logger: createLogger(),
    watchFactory: (() => {
      const watcher = new FakeWatcher();
      createdWatchers.push(watcher);
      return watcher as unknown as fs.FSWatcher;
    }) as typeof fs.watch,
  });

  for (let i = 0; i < 5; i += 1) {
    const projectId = `project-${i.toString()}`;
    const started = service.start({
      projectId,
      creonowRootPath: `/tmp/${projectId}/.creonow`,
    });
    assert.equal(started.ok, true);
    const watcher = createdWatchers[i];
    assert.ok(watcher, `expected watcher #${i.toString()} to exist`);
    assert.equal(watcher.listenerCount("error"), 1);

    const stopped = service.stop({ projectId });
    assert.equal(stopped.ok, true);
    assert.equal(watcher.listenerCount("error"), 0);
  }
});
