// BE-TG-S2: project switch should unbind/bind and cleanup resources deterministically
import assert from "node:assert/strict";

import { createProjectLifecycle } from "../../services/projects/projectLifecycle";
import type { Logger } from "../../logging/logger";

type LogEntry = { event: string; data?: Record<string, unknown> };

function makeLogger(): { logs: LogEntry[]; logger: Logger } {
  const logs: LogEntry[] = [];
  return {
    logs,
    logger: {
      logPath: "<test>",
      info: (event, data) => logs.push({ event, data }),
      error: (event, data) => logs.push({ event, data }),
    },
  };
}

function runScenario(name: string, fn: () => Promise<void>): Promise<void> {
  return fn().catch((error) => {
    throw new Error(
      `[${name}] ${error instanceof Error ? error.message : String(error)}`,
    );
  });
}

async function main(): Promise<void> {
  await runScenario(
    "BE-TG-S2 switchProject: unbinds old then binds new deterministically",
    async () => {
      const { logger } = makeLogger();
      const lifecycle = createProjectLifecycle({ logger, timeoutMs: 1000 });
      const calls: string[] = [];

      lifecycle.register({
        id: "service-a",
        unbind: async ({ projectId }) => {
          calls.push(`unbind:${projectId}`);
        },
        bind: async ({ projectId }) => {
          calls.push(`bind:${projectId}`);
        },
      });

      lifecycle.register({
        id: "service-b",
        unbind: async ({ projectId }) => {
          calls.push(`unbind-b:${projectId}`);
        },
        bind: async ({ projectId }) => {
          calls.push(`bind-b:${projectId}`);
        },
      });

      let persistCalled = false;
      const result = await lifecycle.switchProject({
        fromProjectId: "proj-1",
        toProjectId: "proj-2",
        traceId: "trace-001",
        persist: async () => {
          persistCalled = true;
          // persist must happen after all unbinds
          assert.ok(
            calls.includes("unbind:proj-1"),
            "unbind must precede persist",
          );
          assert.ok(
            calls.includes("unbind-b:proj-1"),
            "unbind-b must precede persist",
          );
          assert.equal(
            calls.filter((c) => c.startsWith("bind")).length,
            0,
            "no binds before persist",
          );
          return "persisted";
        },
      });

      assert.equal(result, "persisted");
      assert.ok(persistCalled);
      assert.ok(
        calls.includes("bind:proj-2"),
        "bind must happen after persist",
      );
      assert.ok(
        calls.includes("bind-b:proj-2"),
        "bind-b must happen after persist",
      );
    },
  );

  await runScenario(
    "BE-TG-S2 unbindAll: calls unbind on all participants",
    async () => {
      const { logger } = makeLogger();
      const lifecycle = createProjectLifecycle({ logger, timeoutMs: 1000 });
      const unbound: string[] = [];

      lifecycle.register({
        id: "svc-x",
        unbind: async ({ projectId }) => {
          unbound.push(projectId);
        },
        bind: async () => undefined,
      });
      lifecycle.register({
        id: "svc-y",
        unbind: async ({ projectId }) => {
          unbound.push(projectId);
        },
        bind: async () => undefined,
      });

      await lifecycle.unbindAll({ projectId: "proj-abc", traceId: "t1" });
      assert.equal(unbound.length, 2);
      assert.ok(unbound.every((id) => id === "proj-abc"));
    },
  );

  await runScenario(
    "BE-TG-S2 bindAll: calls bind on all participants",
    async () => {
      const { logger } = makeLogger();
      const lifecycle = createProjectLifecycle({ logger, timeoutMs: 1000 });
      const bound: string[] = [];

      lifecycle.register({
        id: "svc-p",
        unbind: async () => undefined,
        bind: async ({ projectId }) => {
          bound.push(projectId);
        },
      });

      await lifecycle.bindAll({ projectId: "proj-xyz", traceId: "t2" });
      assert.equal(bound.length, 1);
      assert.equal(bound[0], "proj-xyz");
    },
  );

  await runScenario(
    "BE-TG-S2 timeout: slow participant does not block lifecycle",
    async () => {
      const { logger, logs } = makeLogger();
      const lifecycle = createProjectLifecycle({ logger, timeoutMs: 30 });
      const calls: string[] = [];

      lifecycle.register({
        id: "slow-svc",
        unbind: async ({ projectId }) => {
          await new Promise<void>((resolve) => setTimeout(resolve, 200));
          calls.push(`unbind:${projectId}`);
        },
        bind: async ({ projectId }) => {
          calls.push(`bind:${projectId}`);
        },
      });

      const start = Date.now();
      await lifecycle.unbindAll({ projectId: "proj-slow", traceId: "t3" });
      const elapsed = Date.now() - start;

      // Should complete well before the slow participant's 200ms
      assert.ok(
        elapsed < 150,
        `expected timeout to cut off slow unbind, elapsed=${elapsed.toString()}ms`,
      );
      assert.ok(
        logs.some((l) => l.event === "project_lifecycle_step_timed_out"),
        "expected timeout log",
      );
    },
  );

  await runScenario(
    "BE-TG-S2 error isolation: one participant error does not block others",
    async () => {
      const { logger, logs } = makeLogger();
      const lifecycle = createProjectLifecycle({ logger, timeoutMs: 1000 });
      const bound: string[] = [];

      lifecycle.register({
        id: "failing-svc",
        unbind: async () => {
          throw new Error("unbind failed");
        },
        bind: async () => undefined,
      });
      lifecycle.register({
        id: "healthy-svc",
        unbind: async () => undefined,
        bind: async ({ projectId }) => {
          bound.push(projectId);
        },
      });

      await lifecycle.unbindAll({ projectId: "proj-err", traceId: "t4" });
      assert.ok(
        logs.some((l) => l.event === "project_lifecycle_step_failed"),
        "expected error log",
      );

      await lifecycle.bindAll({ projectId: "proj-err", traceId: "t4" });
      assert.ok(
        bound.includes("proj-err"),
        "healthy service should still bind",
      );
    },
  );

  console.log("[BE-TG-S2] all scenarios passed");
}

await main();
