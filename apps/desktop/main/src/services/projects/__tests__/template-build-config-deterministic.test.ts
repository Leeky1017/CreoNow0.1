import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { resolveBuiltInTemplateDirectory } from "../templateService";

async function main(): Promise<void> {
  const sandboxRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "creonow-c12-template-path-"),
  );

  try {
    const distModeRoot = path.join(sandboxRoot, "dist-mode");
    const distModeModulePath = path.join(
      distModeRoot,
      "dist/main/services/projects/templateService.js",
    );
    const distModeFallbackPath = path.join(
      distModeRoot,
      "main/templates/project",
    );

    await fs.mkdir(path.dirname(distModeModulePath), { recursive: true });
    await fs.writeFile(distModeModulePath, "// stub");
    await fs.mkdir(distModeFallbackPath, { recursive: true });

    const distModeResult = resolveBuiltInTemplateDirectory({
      moduleFilePath: distModeModulePath,
      cwd: distModeRoot,
      env: {},
    });

    assert.equal(
      distModeResult.ok,
      false,
      "dist runtime should fail when dist/main/templates/project is missing, even if legacy fallback paths exist",
    );
    if (distModeResult.ok) {
      throw new Error(
        "expected dist runtime resolution to fail when deterministic template path is missing",
      );
    }
    assert.match(
      distModeResult.error.message,
      /dist[\\/]main[\\/]templates[\\/]project/u,
      "error message should include deterministic dist/main/templates/project path",
    );

    const sourceModeRoot = path.join(sandboxRoot, "source-mode");
    const sourceModeModulePath = path.join(
      sourceModeRoot,
      "main/src/services/projects/templateService.ts",
    );
    const sourceModeFallbackPath = path.join(
      sourceModeRoot,
      "apps/desktop/main/templates/project",
    );
    const sourceModeExpectedPath = path.join(
      sourceModeRoot,
      "main/templates/project",
    );

    await fs.mkdir(path.dirname(sourceModeModulePath), { recursive: true });
    await fs.writeFile(sourceModeModulePath, "// stub");
    await fs.mkdir(sourceModeFallbackPath, { recursive: true });

    const sourceModeResult = resolveBuiltInTemplateDirectory({
      moduleFilePath: sourceModeModulePath,
      cwd: sourceModeRoot,
      env: {},
    });

    assert.equal(
      sourceModeResult.ok,
      false,
      "source runtime should fail when main/templates/project is missing, even if workspace fallback paths exist",
    );
    if (sourceModeResult.ok) {
      throw new Error(
        "expected source runtime resolution to fail when deterministic template path is missing",
      );
    }
    assert.match(
      sourceModeResult.error.message,
      /main[\\/]templates[\\/]project/u,
      "error message should include deterministic source main/templates/project path",
    );

    await fs.mkdir(sourceModeExpectedPath, { recursive: true });

    const sourceModeResolved = resolveBuiltInTemplateDirectory({
      moduleFilePath: sourceModeModulePath,
      cwd: sourceModeRoot,
      env: {},
    });

    assert.equal(
      sourceModeResolved.ok,
      true,
      "source runtime should resolve deterministic main/templates/project path",
    );
    if (!sourceModeResolved.ok) {
      throw new Error(
        "expected source runtime to resolve deterministic main/templates/project path",
      );
    }
    assert.equal(
      path.resolve(sourceModeResolved.data),
      path.resolve(sourceModeExpectedPath),
    );
  } finally {
    await fs.rm(sandboxRoot, { recursive: true, force: true });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
