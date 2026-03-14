import assert from "node:assert/strict";

import type { Logger } from "../../../logging/logger";
import { createJudgeService } from "../judgeService";

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

async function runTests(): Promise<void> {
  // ── S1: getState initially not_ready ──
  {
    const svc = createJudgeService({
      logger: createLogger(),
      isE2E: true,
    });

    const state = svc.getState();
    assert.equal(state.status, "not_ready");
  }

  // ── S2: ensure in E2E mode → transitions to ready ──
  {
    const svc = createJudgeService({
      logger: createLogger(),
      isE2E: true,
      defaultTimeoutMs: 5000,
    });

    const result = await svc.ensure();

    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("unreachable");
    assert.equal(result.data.status, "ready");
    assert.equal(svc.getState().status, "ready");
  }

  // ── S3: ensure in non-E2E (rule-engine) mode → transitions to ready ──
  {
    const svc = createJudgeService({
      logger: createLogger(),
      isE2E: false,
    });

    const result = await svc.ensure();

    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("unreachable");
    assert.equal(result.data.status, "ready");
    assert.equal(svc.getState().status, "ready");
  }

  console.log("judgeService.test.ts: all assertions passed");
}

void runTests();
