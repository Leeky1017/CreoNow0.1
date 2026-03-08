import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  extractScenarios,
  findTestMappings,
  computeTier2Summary,
  readBaseline,
  writeBaseline,
  runGate,
} from "../spec-test-mapping-gate";

// ── Test Group 1: Spec Parsing ─────────────────────────────────────

// Test: single Scenario ID extraction
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-parse-single-"));
  const specDir = path.join(root, "openspec", "specs", "editor");
  mkdirSync(specDir, { recursive: true });
  writeFileSync(
    path.join(specDir, "spec.md"),
    `# Editor Spec

### Scenario S-ZEN-01: 禅模式可编辑

\`\`\`
GIVEN 用户进入禅模式
WHEN 用户点击编辑器区域
THEN 编辑器进入编辑状态
\`\`\`
`,
  );
  const scenarios = extractScenarios(root);
  assert.equal(scenarios.length, 1, "Should extract one Scenario ID");
  assert.equal(scenarios[0].id, "S-ZEN-01");
  assert.equal(scenarios[0].specFile, path.join("openspec", "specs", "editor", "spec.md"));
}

// Test: multiple Scenario IDs extraction
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-parse-multi-"));
  const specDir = path.join(root, "openspec", "specs", "editor");
  mkdirSync(specDir, { recursive: true });
  writeFileSync(
    path.join(specDir, "spec.md"),
    `# Editor Spec

### Scenario S-ZEN-01: 禅模式可编辑
一些描述

### Scenario S-ZEN-02: 禅模式只读退出
一些描述

### Scenario S-ZEN-03: 禅模式 CJK 文本输入
一些描述
`,
  );
  const scenarios = extractScenarios(root);
  assert.equal(scenarios.length, 3, "Should extract three Scenario IDs");
  assert.equal(scenarios[0].id, "S-ZEN-01");
  assert.equal(scenarios[1].id, "S-ZEN-02");
  assert.equal(scenarios[2].id, "S-ZEN-03");
}

// Test: no Scenario IDs → empty list
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-parse-empty-"));
  const specDir = path.join(root, "openspec", "specs", "editor");
  mkdirSync(specDir, { recursive: true });
  writeFileSync(
    path.join(specDir, "spec.md"),
    `# Editor Spec

Nothing here has scenario IDs.
`,
  );
  const scenarios = extractScenarios(root);
  assert.equal(scenarios.length, 0, "Should return empty list when no Scenarios");
}

// Test: change-level spec files also scanned
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-parse-change-"));
  const changeSpec = path.join(root, "openspec", "changes", "a0-01-zen-mode-editable", "specs", "editor");
  mkdirSync(changeSpec, { recursive: true });
  writeFileSync(
    path.join(changeSpec, "spec.md"),
    `# Zen Mode Editable Delta

### Scenario S-ZEN-EDIT-01: 禅模式编辑保存
描述
`,
  );
  const scenarios = extractScenarios(root);
  assert.equal(scenarios.length, 1, "Should find Scenarios in change-level specs");
  assert.equal(scenarios[0].id, "S-ZEN-EDIT-01");
}

// ── Test Group 2: Test File Mapping ────────────────────────────────

// Test: test file with Scenario comment → mapped
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-map-comment-"));
  const specDir = path.join(root, "openspec", "specs", "editor");
  mkdirSync(specDir, { recursive: true });
  writeFileSync(
    path.join(specDir, "spec.md"),
    `### Scenario S-ZEN-01: 禅模式可编辑`,
  );
  const testDir = path.join(root, "apps", "desktop", "renderer", "src");
  mkdirSync(testDir, { recursive: true });
  writeFileSync(
    path.join(testDir, "ZenMode.test.tsx"),
    `// Scenario: S-ZEN-01
describe('ZenMode', () => {
  it('should be editable', () => {
    expect(true).toBe(true);
  });
});`,
  );
  const scenarios = extractScenarios(root);
  const mappings = findTestMappings(scenarios, root);
  assert.equal(mappings.length, 1);
  assert.equal(mappings[0].mapped, true, "Comment reference should map");
  assert.equal(mappings[0].testFiles.length, 1);
}

// Test: test file with Scenario in describe → mapped
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-map-describe-"));
  const specDir = path.join(root, "openspec", "specs", "editor");
  mkdirSync(specDir, { recursive: true });
  writeFileSync(
    path.join(specDir, "spec.md"),
    `### Scenario S-ZEN-01: 禅模式可编辑`,
  );
  const testDir = path.join(root, "apps", "desktop", "renderer", "src");
  mkdirSync(testDir, { recursive: true });
  writeFileSync(
    path.join(testDir, "ZenMode.test.tsx"),
    `describe('S-ZEN-01: 禅模式可编辑', () => {
  it('should enable editing', () => {});
});`,
  );
  const scenarios = extractScenarios(root);
  const mappings = findTestMappings(scenarios, root);
  assert.equal(mappings[0].mapped, true, "Describe name reference should map");
}

// Test: no reference → unmapped
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-map-none-"));
  const specDir = path.join(root, "openspec", "specs", "editor");
  mkdirSync(specDir, { recursive: true });
  writeFileSync(
    path.join(specDir, "spec.md"),
    `### Scenario S-ZEN-05: 禅模式未实现功能`,
  );
  const testDir = path.join(root, "apps", "desktop", "renderer", "src");
  mkdirSync(testDir, { recursive: true });
  writeFileSync(
    path.join(testDir, "Other.test.tsx"),
    `describe('Other', () => { it('does stuff', () => {}); });`,
  );
  const scenarios = extractScenarios(root);
  const mappings = findTestMappings(scenarios, root);
  assert.equal(mappings[0].mapped, false, "Unreferenced Scenario should be unmapped");
}

// Test: one test file maps multiple Scenarios
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-map-multi-"));
  const specDir = path.join(root, "openspec", "specs", "editor");
  mkdirSync(specDir, { recursive: true });
  writeFileSync(
    path.join(specDir, "spec.md"),
    `### Scenario S-ZEN-01: 禅模式可编辑
### Scenario S-ZEN-02: 禅模式只读退出`,
  );
  const testDir = path.join(root, "apps", "desktop", "renderer", "src");
  mkdirSync(testDir, { recursive: true });
  writeFileSync(
    path.join(testDir, "ZenMode.test.tsx"),
    `// Scenario: S-ZEN-01
// Scenario: S-ZEN-02
describe('ZenMode', () => {
  it('editable', () => {});
  it('readonly exit', () => {});
});`,
  );
  const scenarios = extractScenarios(root);
  const mappings = findTestMappings(scenarios, root);
  assert.equal(mappings.length, 2);
  assert.equal(mappings[0].mapped, true);
  assert.equal(mappings[1].mapped, true);
}

// ── Test Group 3: Baseline Ratchet ─────────────────────────────────

// Test: unmapped ≤ baseline → PASS
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-ratchet-pass-"));
  const guardsDir = path.join(root, "openspec", "guards");
  mkdirSync(guardsDir, { recursive: true });
  writeBaseline(10, root);
  const baseline = readBaseline(root);
  assert.equal(baseline.count, 10);
  const result = runGate(root);
  assert.ok(result.ok, "No scenarios = 0 unmapped ≤ 10 baseline → PASS");
}

// Test: unmapped > baseline → FAIL
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-ratchet-fail-"));
  const guardsDir = path.join(root, "openspec", "guards");
  mkdirSync(guardsDir, { recursive: true });
  writeBaseline(0, root);
  const specDir = path.join(root, "openspec", "specs", "editor");
  mkdirSync(specDir, { recursive: true });
  writeFileSync(
    path.join(specDir, "spec.md"),
    `### Scenario S-NEW-01: 新增功能`,
  );
  const result = runGate(root);
  assert.ok(!result.ok, "1 unmapped > 0 baseline → FAIL");
  assert.equal(result.unmapped.length, 1);
}

// Test: --update-baseline writes correct count
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-baseline-write-"));
  const guardsDir = path.join(root, "openspec", "guards");
  mkdirSync(guardsDir, { recursive: true });
  writeBaseline(42, root);
  const baseline = readBaseline(root);
  assert.equal(baseline.count, 42);
  assert.ok(baseline.updatedAt.includes("T"), "updatedAt should be ISO-8601");
}

// ── Test Group 4: Tier 2 Semantic Dimensions ───────────────────────

// Test: "should NOT" title → negation dimension
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-tier2-neg-"));
  const specDir = path.join(root, "openspec", "specs", "editor");
  mkdirSync(specDir, { recursive: true });
  writeFileSync(
    path.join(specDir, "spec.md"),
    `### Scenario S-NEG-01: should NOT render editable controls`,
  );
  const scenarios = extractScenarios(root);
  assert.equal(scenarios[0].dimension, "negation", "should NOT → negation dimension");
}

// Test: @capability tag → capability dimension
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-tier2-cap-"));
  const specDir = path.join(root, "openspec", "specs", "editor");
  mkdirSync(specDir, { recursive: true });
  writeFileSync(
    path.join(specDir, "spec.md"),
    `### Scenario S-CAP-01: Export capability @capability 验证`,
  );
  const scenarios = extractScenarios(root);
  assert.equal(scenarios[0].dimension, "capability", "@capability → capability dimension");
}

// Test: CJK keyword → cjk dimension
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-tier2-cjk-"));
  const specDir = path.join(root, "openspec", "specs", "search");
  mkdirSync(specDir, { recursive: true });
  writeFileSync(
    path.join(specDir, "spec.md"),
    `### Scenario S-CJK-01: 中文搜索分词测试`,
  );
  const scenarios = extractScenarios(root);
  assert.equal(scenarios[0].dimension, "cjk", "中文 → cjk dimension");
}

// Test: rejection keyword → rejection dimension
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-tier2-rej-"));
  const specDir = path.join(root, "openspec", "specs", "memory");
  mkdirSync(specDir, { recursive: true });
  writeFileSync(
    path.join(specDir, "spec.md"),
    `### Scenario S-REJ-01: 拒绝信号处理路径验证`,
  );
  const scenarios = extractScenarios(root);
  assert.equal(scenarios[0].dimension, "rejection", "拒绝 → rejection dimension");
}

// Test: no keywords → general dimension
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-tier2-gen-"));
  const specDir = path.join(root, "openspec", "specs", "editor");
  mkdirSync(specDir, { recursive: true });
  writeFileSync(
    path.join(specDir, "spec.md"),
    `### Scenario S-GEN-01: 基础编辑功能`,
  );
  const scenarios = extractScenarios(root);
  assert.equal(scenarios[0].dimension, "general", "No keywords → general dimension");
}

// Test: Tier 2 summary computation
{
  const root = mkdtempSync(path.join(tmpdir(), "stm-tier2-summary-"));
  const specDir = path.join(root, "openspec", "specs", "mixed");
  mkdirSync(specDir, { recursive: true });
  writeFileSync(
    path.join(specDir, "spec.md"),
    `### Scenario S-MIX-01: should NOT allow editing
### Scenario S-MIX-02: 中文搜索
### Scenario S-MIX-03: 拒绝无效输入
### Scenario S-MIX-04: 普通功能`,
  );
  const testDir = path.join(root, "apps", "desktop", "renderer", "src");
  mkdirSync(testDir, { recursive: true });
  writeFileSync(
    path.join(testDir, "mixed.test.tsx"),
    `// Scenario: S-MIX-01
// Scenario: S-MIX-02`,
  );
  const scenarios = extractScenarios(root);
  const mappings = findTestMappings(scenarios, root);
  const summary = computeTier2Summary(mappings);

  assert.equal(summary.negation.total, 1, "1 negation scenario");
  assert.equal(summary.negation.mapped, 1, "negation scenario mapped");
  assert.equal(summary.cjk.total, 1, "1 cjk scenario");
  assert.equal(summary.cjk.mapped, 1, "cjk scenario mapped");
  assert.equal(summary.rejection.total, 1, "1 rejection scenario");
  assert.equal(summary.rejection.mapped, 0, "rejection scenario not mapped");
  assert.equal(summary.capability.total, 0, "no capability scenarios");
}

console.log("✅ spec-test-mapping-gate: all tests passed");
