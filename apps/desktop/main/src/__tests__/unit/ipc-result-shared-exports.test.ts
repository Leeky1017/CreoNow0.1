import assert from "node:assert/strict";

import { ipcError } from "../../services/shared/ipcResult";

function main(): void {
  const result = ipcError(
    "INTERNAL",
    "shared ipc error should carry options",
    { source: "AUD-C4-S1" },
    {
      traceId: "trace-aud-c4-s1",
      retryable: true,
    },
  );

  assert.equal(
    result.ok,
    false,
    "AUD-C4-S1: ipcError must return Err envelope",
  );
  assert.equal(
    result.error.traceId,
    "trace-aud-c4-s1",
    "AUD-C4-S1: ipcError should expose traceId from options",
  );
  assert.equal(
    result.error.retryable,
    true,
    "AUD-C4-S1: ipcError should expose retryable from options",
  );
  assert.deepEqual(result.error.details, { source: "AUD-C4-S1" });

  console.log("ipc-result-shared-exports.test.ts: all assertions passed");
}

main();
