import assert from "node:assert/strict";

import { executeRoleBoundWrite } from "../dbReadWriteSeparation";

function runScenario(name: string, fn: () => void): void {
  try {
    fn();
  } catch (error) {
    throw new Error(
      `[${name}] ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

runScenario(
  "BE-UPF-S3 main/compute should reject write while data can write",
  () => {
    let writeCount = 0;

    const mainResult = executeRoleBoundWrite({
      role: "main",
      write: () => {
        writeCount += 1;
        return "main_write";
      },
    });
    const computeResult = executeRoleBoundWrite({
      role: "compute",
      write: () => {
        writeCount += 1;
        return "compute_write";
      },
    });
    const dataResult = executeRoleBoundWrite({
      role: "data",
      write: () => {
        writeCount += 1;
        return "data_write";
      },
    });

    assert.equal(mainResult.ok, false);
    assert.equal(computeResult.ok, false);
    assert.equal(dataResult.ok, true);
    assert.equal(writeCount, 1);

    if (!dataResult.ok) {
      throw new Error("data write should succeed");
    }
    assert.equal(dataResult.value, "data_write");
  },
);

runScenario("BE-UPF-S3 data write should surface stable DB error", () => {
  const result = executeRoleBoundWrite({
    role: "data",
    write: () => {
      throw new Error("sqlite_busy");
    },
  });

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("result should be DB_WRITE_FAILED");
  }
  assert.equal(result.error.code, "DB_WRITE_FAILED");
  assert.equal(result.error.message, "sqlite_busy");
});
