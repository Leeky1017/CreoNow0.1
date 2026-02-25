import assert from "node:assert/strict";

import type {
  AiQueueStatusEvent,
  AiStreamChunkEvent,
  AiStreamDoneEvent,
} from "@shared/types/ai";

import { createIpcPushBackpressureGate } from "../pushBackpressure";

const BASE_TS = 1_703_000_000_000;

function chunkEvent(
  seq: number,
  chunk: string,
  ts: number,
): AiStreamChunkEvent {
  return {
    type: "chunk",
    executionId: "exec-aiw-s2",
    runId: "run-aiw-s2",
    traceId: "trace-aiw-s2",
    seq,
    chunk,
    ts,
  };
}

function queueEvent(ts: number): AiQueueStatusEvent {
  return {
    type: "queue",
    executionId: "exec-aiw-s2",
    runId: "run-aiw-s2",
    traceId: "trace-aiw-s2",
    status: "started",
    queuePosition: 0,
    queued: 0,
    globalRunning: 1,
    ts,
  };
}

function doneEvent(ts: number): AiStreamDoneEvent {
  return {
    type: "done",
    executionId: "exec-aiw-s2",
    runId: "run-aiw-s2",
    traceId: "trace-aiw-s2",
    terminal: "completed",
    outputText: "final-output",
    ts,
  };
}

async function main(): Promise<void> {
  let nowTs = BASE_TS;
  const drops: Array<{
    droppedInWindow: number;
    limitPerSecond: number;
    timestamp: number;
  }> = [];

  const gate = createIpcPushBackpressureGate({
    limitPerSecond: 2,
    now: () => nowTs,
    onDrop: (event) => {
      drops.push(event);
    },
  });

  const delivered = [
    gate.shouldDeliver(chunkEvent(1, "a", nowTs)),
    gate.shouldDeliver(chunkEvent(2, "b", nowTs)),
    gate.shouldDeliver(chunkEvent(3, "c", nowTs)),
    gate.shouldDeliver(chunkEvent(4, "d", nowTs)),
    gate.shouldDeliver(queueEvent(nowTs)),
    gate.shouldDeliver(doneEvent(nowTs)),
  ];

  assert.deepEqual(
    delivered,
    [true, true, false, false, true, true],
    "should drop low priority chunks but keep control events",
  );
  assert.equal(
    drops.length,
    1,
    "drop callback should be emitted once per pressure window",
  );
  assert.equal(drops[0]?.droppedInWindow, 1);
  assert.equal(drops[0]?.limitPerSecond, 2);
  assert.equal(drops[0]?.timestamp, BASE_TS);

  nowTs += 1_000;
  assert.equal(
    gate.shouldDeliver(chunkEvent(5, "e", nowTs)),
    true,
    "next second should reset chunk budget",
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
