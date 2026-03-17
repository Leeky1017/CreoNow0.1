import assert from "node:assert/strict";

import type { Logger } from "../../logging/logger";
import { createProjectLifecycle } from "../../services/projects/projectLifecycle";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

async function main(): Promise<void> {
  // Scenario: AUD-C1-S4
  // concurrent switchProject on same source should be serialized without overlap.
  {
    const lifecycle = createProjectLifecycle({
      logger: createLogger(),
      timeoutMs: 500,
    });

    let inflightUnbindFromA = 0;
    let maxInflightUnbindFromA = 0;

    lifecycle.register({
      id: "participant-a",
      unbind: async ({ projectId }) => {
        if (projectId === "A") {
          inflightUnbindFromA += 1;
          if (inflightUnbindFromA > maxInflightUnbindFromA) {
            maxInflightUnbindFromA = inflightUnbindFromA;
          }
          await wait(30);
          inflightUnbindFromA -= 1;
          return;
        }
        await wait(5);
      },
      bind: async () => {
        await wait(5);
      },
    });

    const firstSwitch = lifecycle.switchProject({
      fromProjectId: "A",
      toProjectId: "B",
      traceId: "trace-1",
      persist: async () => {
        await wait(10);
        return "switch-1";
      },
    });

    const secondSwitch = lifecycle.switchProject({
      fromProjectId: "A",
      toProjectId: "C",
      traceId: "trace-2",
      persist: async () => {
        await wait(10);
        return "switch-2";
      },
    });

    const [firstResult, secondResult] = await Promise.all([
      firstSwitch,
      secondSwitch,
    ]);

    assert.equal(firstResult, "switch-1");
    assert.equal(secondResult, "switch-2");
    assert.equal(
      maxInflightUnbindFromA,
      1,
      "switchProject(A->B, A->C) should not interleave unbind on A",
    );
  }

  // Scenario: AUD-C1-S5
  // duplicate concurrent switch to same target should be idempotent.
  {
    const lifecycle = createProjectLifecycle({
      logger: createLogger(),
      timeoutMs: 500,
    });

    let unbindCount = 0;
    let bindCount = 0;
    let persistCount = 0;

    lifecycle.register({
      id: "participant-b",
      unbind: async () => {
        unbindCount += 1;
        await wait(20);
      },
      bind: async () => {
        bindCount += 1;
        await wait(20);
      },
    });

    const first = lifecycle.switchProject({
      fromProjectId: "A",
      toProjectId: "B",
      traceId: "trace-dup-1",
      persist: async () => {
        persistCount += 1;
        await wait(20);
        return "dup-ok";
      },
    });

    const second = lifecycle.switchProject({
      fromProjectId: "A",
      toProjectId: "B",
      traceId: "trace-dup-2",
      persist: async () => {
        persistCount += 1;
        await wait(20);
        return "dup-ok";
      },
    });

    const [left, right] = await Promise.all([first, second]);

    assert.equal(left, "dup-ok");
    assert.equal(right, "dup-ok");
    assert.equal(
      unbindCount,
      1,
      "duplicate switch should run unbind exactly once",
    );
    assert.equal(bindCount, 1, "duplicate switch should run bind exactly once");
    assert.equal(
      persistCount,
      1,
      "duplicate switch should run persist exactly once",
    );
  }

  console.log(
    "project-lifecycle-switch-lock.stress.test.ts: all assertions passed",
  );
}

await main();
