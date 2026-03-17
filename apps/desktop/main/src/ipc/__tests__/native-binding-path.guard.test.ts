/**
 * Guard test: native-binding-path.guard
 *
 * 静态断言 electron-builder.json 的打包配置，
 * 确保 better-sqlite3 native binding 不因配置缺陷而在打包产物中缺失。
 *
 * Scenarios:
 *   AI-FE-NATIVE-S2: asarUnpack 必须包含 **\/*.node
 *   AI-FE-NATIVE-S3: npmRebuild 不得为 false
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const ELECTRON_BUILDER_JSON_PATH = path.resolve(
  import.meta.dirname,
  "../../../../electron-builder.json",
);

type ElectronBuilderConfig = {
  npmRebuild?: boolean;
  asarUnpack?: string[];
};

function loadConfig(): ElectronBuilderConfig {
  const raw = readFileSync(ELECTRON_BUILDER_JSON_PATH, "utf8");
  return JSON.parse(raw) as ElectronBuilderConfig;
}

describe("native-binding-path guard", () => {
  const config = loadConfig();

  it("AI-FE-NATIVE-S2: asarUnpack includes **/*.node", () => {
    assert.ok(Array.isArray(config.asarUnpack), "asarUnpack must be an array");
    assert.ok(
      config.asarUnpack.includes("**/*.node"),
      'asarUnpack must include "**/*.node"',
    );
  });

  it("AI-FE-NATIVE-S3: npmRebuild is not false", () => {
    assert.notEqual(
      config.npmRebuild,
      false,
      "npmRebuild must not be false — native addons require ABI-compatible rebuild during packaging",
    );
  });
});
