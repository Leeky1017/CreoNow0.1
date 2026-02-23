import assert from "node:assert/strict";

import { createUtilityProcessSupervisor } from "../utilityProcessSupervisor";

type AsyncFn = () => Promise<void>;

async function runScenario(name: string, fn: AsyncFn): Promise<void> {
  try {
    await fn();
  } catch (error) {
    throw new Error(
      `[${name}] ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

await runScenario(
  "BE-UPF-S2 should fail inflight tasks with crashed after process exit",
  async () => {
    const supervisor = createUtilityProcessSupervisor({
      role: "compute",
    });

    const crashError = new Error("compute_exit");
    const first = supervisor.run({
      timeoutMs: 200,
      execute: async () => {
        return await new Promise<string>(() => undefined);
      },
    });
    const second = supervisor.run({
      timeoutMs: 200,
      execute: async () => {
        return await new Promise<string>(() => undefined);
      },
    });

    await Promise.resolve();
    supervisor.notifyProcessExit(crashError);

    const results = await Promise.all([first, second]);
    assert.equal(results[0].status, "crashed");
    assert.equal(results[1].status, "crashed");
    assert.equal(results[0].error.message, "compute_exit");
    assert.equal(results[1].error.message, "compute_exit");
    assert.equal(
      results[0].error,
      results[1].error,
      "inflight tasks should fail with the same crash cause",
    );
    assert.equal(supervisor.getRole(), "compute");
    assert.equal(supervisor.getRestartCount(), 1);
  },
);

await runScenario(
  "BE-UPF-S2 should restart and accept new tasks after crash",
  async () => {
    const supervisor = createUtilityProcessSupervisor({
      role: "data",
    });

    const inflight = supervisor.run({
      timeoutMs: 200,
      execute: async () => {
        return await new Promise<string>(() => undefined);
      },
    });

    await Promise.resolve();
    supervisor.notifyProcessExit();

    const crashed = await inflight;
    assert.equal(crashed.status, "crashed");
    assert.equal(crashed.error.message, "data_process_exit");

    const completed = await supervisor.run({
      timeoutMs: 50,
      execute: async () => "after_restart",
    });
    assert.equal(completed.status, "completed");
    assert.equal(completed.value, "after_restart");
    assert.equal(supervisor.getRestartCount(), 1);
  },
);
