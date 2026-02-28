import assert from "node:assert/strict";

import { createAiWriteTransaction } from "../aiWriteTransaction";

function removeOne(items: string[], value: string): void {
  const index = items.indexOf(value);
  if (index >= 0) {
    items.splice(index, 1);
  }
}

async function main(): Promise<void> {
  {
    const writes: string[] = [];
    const tx = createAiWriteTransaction();

    tx.applyWrite({
      apply: () => {
        writes.push("user-message");
      },
      rollback: () => {
        removeOne(writes, "user-message");
      },
    });
    tx.applyWrite({
      apply: () => {
        writes.push("assistant-message");
      },
      rollback: () => {
        removeOne(writes, "assistant-message");
      },
    });

    tx.abort();

    assert.deepEqual(
      writes,
      [],
      "abort should rollback and leave no partial writes",
    );
    assert.equal(tx.state(), "aborted");
    assert.throws(
      () => tx.commit(),
      /aborted/,
      "aborted transaction must not be commit-able",
    );
  }

  {
    const writes: string[] = [];
    const tx = createAiWriteTransaction();

    tx.applyWrite({
      apply: () => {
        writes.push("first");
      },
      rollback: () => {
        removeOne(writes, "first");
      },
    });
    assert.throws(
      () =>
        tx.applyWrite({
          apply: () => {
            writes.push("second-partial");
            throw new Error("mid-write failure");
          },
          rollback: () => {
            removeOne(writes, "second-partial");
          },
        }),
      /mid-write failure/,
    );

    assert.deepEqual(
      writes,
      [],
      "failed apply should rollback already applied writes",
    );
    assert.equal(tx.state(), "aborted");
  }

  {
    const writes: string[] = [];
    const rollbackErrors: Array<{ message: string; index: number }> = [];
    const tx = createAiWriteTransaction({
      onRollbackError: (error, index) => {
        rollbackErrors.push({
          message: error instanceof Error ? error.message : String(error),
          index,
        });
      },
    });

    tx.applyWrite({
      apply: () => {
        writes.push("first");
      },
      rollback: () => {
        removeOne(writes, "first");
      },
    });
    tx.applyWrite({
      apply: () => {
        writes.push("second");
      },
      rollback: () => {
        removeOne(writes, "second");
        throw new Error("rollback second failed");
      },
    });
    assert.throws(
      () =>
        tx.applyWrite({
          apply: () => {
            throw new Error("trigger abort");
          },
          rollback: () => {
            throw new Error("rollback third failed");
          },
        }),
      /trigger abort/,
    );

    assert.deepEqual(
      rollbackErrors,
      [
        { message: "rollback third failed", index: 2 },
        { message: "rollback second failed", index: 1 },
      ],
      "rollback failures should be reported with stable index",
    );
    assert.deepEqual(
      writes,
      [],
      "rollback should continue after one rollback handler throws",
    );
    assert.equal(tx.state(), "aborted");
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
