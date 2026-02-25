import assert from "node:assert/strict";

import type { AiStreamEvent } from "@shared/types/ai";
import { createIpcPushBackpressureGate } from "../pushBackpressure";

function chunkEvent(seq: number): AiStreamEvent {
  return {
    type: "chunk",
    executionId: "exec-1",
    runId: "run-1",
    traceId: "trace-1",
    seq,
    chunk: String(seq),
    ts: 1_700_000_200_000 + seq,
  };
}

// BE-AIW-S2
// should drop low priority chunks but keep control events
{
  let now = 1_700_000_200_000;
  const drops: Array<{
    droppedInWindow: number;
    limitPerSecond: number;
    timestamp: number;
  }> = [];

  const gate = createIpcPushBackpressureGate({
    limitPerSecond: 2,
    now: () => now,
    onDrop: (event) => {
      drops.push(event);
    },
  });

  assert.equal(gate.shouldDeliver(chunkEvent(1)), true);
  assert.equal(gate.shouldDeliver(chunkEvent(2)), true);
  assert.equal(gate.shouldDeliver(chunkEvent(3)), false);
  assert.equal(gate.shouldDeliver(chunkEvent(4)), false);
  assert.equal(gate.shouldDeliver(chunkEvent(5)), false);

  assert.equal(
    gate.shouldDeliver({
      type: "queue",
      executionId: "exec-1",
      runId: "run-1",
      traceId: "trace-1",
      status: "queued",
      queuePosition: 1,
      queued: 1,
      globalRunning: 0,
      ts: now,
    }),
    true,
  );
  assert.equal(
    gate.shouldDeliver({
      type: "done",
      executionId: "exec-1",
      runId: "run-1",
      traceId: "trace-1",
      terminal: "completed",
      outputText: "done",
      ts: now,
    }),
    true,
  );

  assert.equal(drops.length, 1, "drop telemetry should only emit once/window");
  assert.equal(drops[0]?.droppedInWindow, 1);
  assert.equal(drops[0]?.limitPerSecond, 2);

  now += 1_000;
  assert.equal(
    gate.shouldDeliver(chunkEvent(6)),
    true,
    "new time window should accept chunk traffic again",
  );
}
