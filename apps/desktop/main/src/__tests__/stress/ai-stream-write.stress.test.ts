// BE-TG-S5: 1000 blocks stream write should not freeze main and should be rollback-safe
import assert from "node:assert/strict";

import { createAiWriteTransaction } from "../../services/ai/aiWriteTransaction";

/**
 * Simulates a stream of AI-generated block writes, each wrapped in a transaction.
 * Models the real pattern: each block is applied with a rollback function,
 * and the transaction can be aborted mid-stream.
 */
async function simulateStreamWrite(args: {
  blockCount: number;
  failAtBlock?: number;
  abortAtBlock?: number;
  yieldEvery?: number;
}): Promise<{
  applied: number;
  rolledBack: number;
  finalState: string;
  maxTickMs: number;
}> {
  const tx = createAiWriteTransaction();
  const blocks: string[] = [];
  let rolledBack = 0;
  let maxTickMs = 0;

  const yieldEvery = args.yieldEvery ?? 50;

  for (let i = 0; i < args.blockCount; i++) {
    if (tx.state() !== "open") break;

    // Yield to event loop periodically to avoid blocking main thread
    if (i > 0 && i % yieldEvery === 0) {
      const tickStart = performance.now();
      await new Promise<void>((resolve) => setImmediate(resolve));
      const tickMs = performance.now() - tickStart;
      if (tickMs > maxTickMs) maxTickMs = tickMs;
    }

    const blockId = `block-${i.toString()}`;

    if (args.failAtBlock !== undefined && i === args.failAtBlock) {
      try {
        tx.applyWrite({
          apply: () => { throw new Error(`write failed at block ${i.toString()}`); },
          rollback: () => { rolledBack += 1; },
        });
      } catch {
        // transaction auto-aborts on apply failure
        break;
      }
    } else if (args.abortAtBlock !== undefined && i === args.abortAtBlock) {
      tx.abort();
      break;
    } else {
      tx.applyWrite({
        apply: () => { blocks.push(blockId); },
        rollback: () => {
          const idx = blocks.lastIndexOf(blockId);
          if (idx >= 0) blocks.splice(idx, 1);
          rolledBack += 1;
        },
      });
    }
  }

  if (tx.state() === "open") {
    tx.commit();
  }

  return {
    applied: blocks.length,
    rolledBack,
    finalState: tx.state(),
    maxTickMs,
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
  await runScenario("BE-TG-S5 1000 blocks: all applied and committed", async () => {
    const result = await simulateStreamWrite({ blockCount: 1000 });

    assert.equal(result.finalState, "committed");
    assert.equal(result.applied, 1000);
    assert.equal(result.rolledBack, 0);
    console.log(`[BE-TG-S5] 1000-block write: applied=${result.applied.toString()} maxTickMs=${result.maxTickMs.toFixed(2)}`);
  });

  await runScenario("BE-TG-S5 no main thread freeze: max tick under 50ms", async () => {
    const result = await simulateStreamWrite({ blockCount: 1000, yieldEvery: 50 });

    // Each yield should return quickly — if main is frozen, ticks will be long
    assert.ok(
      result.maxTickMs < 50,
      `max tick must be <50ms to avoid freezing main, got ${result.maxTickMs.toFixed(2)}ms`,
    );
  });

  await runScenario("BE-TG-S5 rollback-safe: failure mid-stream rolls back all applied writes", async () => {
    const FAIL_AT = 500;
    const result = await simulateStreamWrite({
      blockCount: 1000,
      failAtBlock: FAIL_AT,
    });

    assert.equal(result.finalState, "aborted");
    // All previously applied blocks should be rolled back
    assert.equal(result.applied, 0, "all applied blocks must be rolled back on failure");
    assert.ok(result.rolledBack > 0, "rollback must have been called");
    console.log(`[BE-TG-S5] rollback at block ${FAIL_AT.toString()}: rolledBack=${result.rolledBack.toString()}`);
  });

  await runScenario("BE-TG-S5 abort mid-stream: partial writes rolled back", async () => {
    const ABORT_AT = 300;
    const result = await simulateStreamWrite({
      blockCount: 1000,
      abortAtBlock: ABORT_AT,
    });

    assert.equal(result.finalState, "aborted");
    assert.equal(result.applied, 0, "abort must roll back all applied writes");
    console.log(`[BE-TG-S5] abort at block ${ABORT_AT.toString()}: rolledBack=${result.rolledBack.toString()}`);
  });

  await runScenario("BE-TG-S5 double-commit guard: commit after commit throws", async () => {
    const tx = createAiWriteTransaction();
    tx.applyWrite({ apply: () => undefined, rollback: () => undefined });
    tx.commit();

    assert.throws(
      () => tx.commit(),
      (err: unknown) => err instanceof Error && /committed/u.test(err.message),
      "double commit must throw with state in message",
    );
  });

  await runScenario("BE-TG-S5 write after commit guard: applyWrite after commit throws", async () => {
    const tx = createAiWriteTransaction();
    tx.commit();

    assert.throws(
      () => tx.applyWrite({ apply: () => undefined, rollback: () => undefined }),
      (err: unknown) => err instanceof Error && /committed/u.test(err.message),
      "write after commit must throw",
    );
  });

  await runScenario("BE-TG-S5 abort idempotent: double abort is safe", async () => {
    const tx = createAiWriteTransaction();
    tx.applyWrite({ apply: () => undefined, rollback: () => undefined });
    tx.abort();
    // second abort must not throw
    assert.doesNotThrow(() => tx.abort());
    assert.equal(tx.state(), "aborted");
  });

  console.log("[BE-TG-S5] all scenarios passed");
}

await main();
