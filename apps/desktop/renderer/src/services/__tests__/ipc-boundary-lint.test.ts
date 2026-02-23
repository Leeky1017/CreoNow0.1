import { describe, expect, it } from "vitest";

import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { scanRendererIpcBoundaryViolations } from "../ipcBoundaryLint";

describe("IPC boundary lint gate (IPC-P2-S1)", () => {
  it("feature should fail when directly invoking ipcRenderer/window bridge", async () => {
    const rendererSrcRoot = await mkdtemp(
      path.join(os.tmpdir(), "renderer-ipc-boundary-"),
    );

    const fixtureWindowBridgePath = path.join(
      rendererSrcRoot,
      "features",
      "FakePanel.tsx",
    );
    await mkdir(path.dirname(fixtureWindowBridgePath), { recursive: true });
    await writeFile(
      fixtureWindowBridgePath,
      `export async function FakePanel(){\n  await window.creonow.invoke("project:project:switch", { projectId: "p1" });\n}\n`,
      "utf8",
    );

    const fixtureIpcRendererPath = path.join(
      rendererSrcRoot,
      "features",
      "FakePanel2.tsx",
    );
    await writeFile(
      fixtureIpcRendererPath,
      `import { ipcRenderer } from "electron";\nexport async function Fake(){\n  await ipcRenderer.invoke("x");\n}\n`,
      "utf8",
    );

    const violations = await scanRendererIpcBoundaryViolations({
      rendererSrcRoot,
      reportRelativeTo: rendererSrcRoot,
    });

    expect(violations).toEqual([
      { filePath: "features/FakePanel.tsx", token: "window.creonow.invoke" },
      { filePath: "features/FakePanel2.tsx", token: "ipcRenderer.invoke" },
    ]);
  });

  it("repo should contain no IPC boundary violations", async () => {
    const REPO_ROOT = path.resolve(import.meta.dirname, "../../../../../..");
    const rendererSrcRoot = path.join(REPO_ROOT, "apps/desktop/renderer/src");

    const violations = await scanRendererIpcBoundaryViolations({
      rendererSrcRoot,
      reportRelativeTo: REPO_ROOT,
    });

    if (violations.length > 0) {
      const lines = violations
        .map((violation) => `- ${violation.filePath} (${violation.token})`)
        .join("\n");
      throw new Error(
        `IPC boundary violations (IPC-P2-S1). Move IPC calls into renderer/src/services and use lib/ipcClient:\n${lines}`,
      );
    }

    expect(violations).toEqual([]);
  });
});
