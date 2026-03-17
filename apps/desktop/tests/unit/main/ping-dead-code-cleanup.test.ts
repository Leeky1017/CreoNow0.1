import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, "../../../main/src/index.ts");
const phase4GatePath = path.resolve(
  __dirname,
  "../../../main/src/services/workbench/phase4-delivery-gate.ts",
);
const indexSource = readFileSync(indexPath, "utf8");

describe("ping dead-code cleanup", () => {
  it("S2-DC-PING-S1 keeps ping envelope and removes unreachable catch", () => {
    const pingBlockStart = indexSource.indexOf(
      'guardedIpcMain.handle(\n    "app:system:ping",',
    );
    expect(
      pingBlockStart,
      "S2-DC-PING-S1: ping handler registration must exist in main index",
    ).not.toBe(-1);

    const pingBlockEnd = indexSource.indexOf(
      "registerDbDebugIpcHandlers({",
      pingBlockStart,
    );
    expect(
      pingBlockEnd,
      "S2-DC-PING-S1: ping block boundary must stay parsable",
    ).not.toBe(-1);

    const pingBlock = indexSource.slice(pingBlockStart, pingBlockEnd);

    expect(pingBlock).toMatch(
      /return\s+\{\s*ok:\s*true,\s*data:\s*\{\s*\}\s*\};/su,
    );
    expect(
      /\bcatch\b/u.test(pingBlock),
      "S2-DC-PING-S1: ping handler should not keep unreachable catch branch",
    ).toBe(false);
    expect(
      pingBlock.includes("Ping failed"),
      "S2-DC-PING-S1: ping handler should not expose obsolete ping failure branch",
    ).toBe(false);
  });

  it("S2-DC-PING-S2 removes phase4 dead code and stale gate tests", () => {
    expect(
      existsSync(phase4GatePath),
      "S2-DC-PING-S2: phase4-delivery-gate.ts must be removed when it has no production imports",
    ).toBe(false);

    const stalePhase4GateTests = [
      path.resolve(
        __dirname,
        "../../e2e/visual/phase4-baseline-capture.spec.ts",
      ),
      path.resolve(__dirname, "../../e2e/visual/phase4-visual-diff.spec.ts"),
      path.resolve(__dirname, "../../perf/phase4-benchmark.spec.ts"),
      path.resolve(
        __dirname,
        "../../integration/workbench/phase4-visual-audit.spec.ts",
      ),
    ];

    for (const staleTestPath of stalePhase4GateTests) {
      expect(
        existsSync(staleTestPath),
        `S2-DC-PING-S2: stale phase4 gate test should be deleted: ${staleTestPath}`,
      ).toBe(false);
    }
  });
});
