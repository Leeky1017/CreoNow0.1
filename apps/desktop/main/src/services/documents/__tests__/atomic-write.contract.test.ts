import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { atomicWrite } from "../atomicWrite";

/**
 * Scenario: BE-GHB-S4
 * atomicWrite should not leave partial file on crash simulation.
 */
{
  const baseDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "creonow-atomic-write-missing-"),
  );
  const targetPath = path.join(baseDir, "export.json");

  try {
    await assert.rejects(
      () =>
        atomicWrite({
          targetPath,
          writeTemp: async (tempPath) => {
            await fs.writeFile(tempPath, '{"status":"partial"', "utf8");
            throw new Error("simulated_crash_during_write");
          },
        }),
      /simulated_crash_during_write/,
      "interruption simulation should propagate as a write failure",
    );

    await assert.rejects(
      () => fs.access(targetPath),
      /ENOENT/u,
      "target path should stay absent after interrupted write",
    );
  } finally {
    await fs.rm(baseDir, { recursive: true, force: true });
  }
}

/**
 * Scenario: BE-GHB-S4
 * interrupted write should keep last committed content.
 */
{
  const baseDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "creonow-atomic-write-existing-"),
  );
  const targetPath = path.join(baseDir, "metadata.json");
  const baseline = '{"version":1}';

  try {
    await fs.writeFile(targetPath, baseline, "utf8");

    await assert.rejects(
      () =>
        atomicWrite({
          targetPath,
          writeTemp: async (tempPath) => {
            await fs.writeFile(tempPath, '{"version":2', "utf8");
            throw new Error("simulated_crash_before_rename");
          },
        }),
      /simulated_crash_before_rename/,
      "atomic write should surface interruption and skip commit",
    );

    const unchanged = await fs.readFile(targetPath, "utf8");
    assert.equal(
      unchanged,
      baseline,
      "target path should preserve last fully committed content",
    );
  } finally {
    await fs.rm(baseDir, { recursive: true, force: true });
  }
}
