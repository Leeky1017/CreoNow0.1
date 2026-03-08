# G0-05 Spec-Test 映射与测试质量门禁行为规范

## Scenarios

### Scenario S-MAP-01: 已映射 Scenario 通过

```
GIVEN  openspec/specs/editor/spec.md 中定义了 Scenario S-ZEN-01
AND    renderer/src/features/zen-mode/ZenMode.test.tsx 中有测试注释 // Scenario: S-ZEN-01
WHEN   运行 pnpm gate:spec-test-mapping
THEN   S-ZEN-01 不在未映射列表中
```

### Scenario S-MAP-02: 未映射 Scenario 报告违规

```
GIVEN  openspec/specs/editor/spec.md 中定义了 Scenario S-ZEN-05
AND    没有任何测试文件引用 S-ZEN-05
WHEN   运行 pnpm gate:spec-test-mapping
THEN   S-ZEN-05 出现在未映射列表中
AND    输出包含 spec 文件路径、Scenario 名称
```

### Scenario S-MAP-03: Change 级 spec 也被检查

```
GIVEN  openspec/changes/a0-01-zen-mode-editable/specs/editor/spec.md 中定义了 Scenario S-ZEN-EDIT-01
AND    没有测试文件引用 S-ZEN-EDIT-01
WHEN   运行 pnpm gate:spec-test-mapping
THEN   S-ZEN-EDIT-01 出现在未映射列表中
```

### Scenario S-MAP-04: 未映射数不超过基线

```
GIVEN  spec-test-mapping-baseline.json 记录基线未映射数为 N
AND    当前未映射数 M ≤ N
WHEN   运行 pnpm gate:spec-test-mapping
THEN   gate 输出 PASS
AND    输出映射覆盖率百分比
```

### Scenario S-MAP-05: 新增未映射 Scenario 阻断

```
GIVEN  spec-test-mapping-baseline.json 记录基线未映射数为 N
AND    新 spec 引入了 Scenario 但没有对应测试
AND    当前未映射数 M > N
WHEN   运行 pnpm gate:spec-test-mapping
THEN   gate 输出 FAIL
AND    列出新增的未映射 Scenario
```

### Scenario S-MAP-06: 映射覆盖率输出

```
GIVEN  总 Scenario 数量为 T，已映射数量为 C
WHEN   运行 pnpm gate:spec-test-mapping
THEN   输出包含 [SPEC_TEST_MAP] coverage: C/T (XX%)
```

### Scenario S-NEG-01: 否定测试约定示例

```
GIVEN  一个被标记为"假 UI"的组件 ZenMode（只读版本）
WHEN   开发者按否定测试约定编写测试
THEN   测试文件中包含 describe('should NOT ...') 块
AND    至少一个 it() 断言该组件不提供编辑功能
```

### Scenario S-GTEST-01: Guard 测试质量约定

```
GIVEN  新建的 guard 脚本 my-gate.ts
WHEN   开发者按测试约定编写 guard 测试
THEN   测试文件中包含至少 1 个 PASS fixture 和 1 个 FAIL fixture
AND    FAIL fixture 验证 gate 能正确检出违规
```
