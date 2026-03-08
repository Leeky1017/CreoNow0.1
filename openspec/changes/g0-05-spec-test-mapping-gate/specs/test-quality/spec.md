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

---

## Tier 2 语义维度支持

> 以下 Scenario 对应三层执行模型中 Tier 2 的 6 类问题。gate 负责“存在性检测”（有没有测试），审计 Agent 负责“有效性验证”（测试是不是真有意义）。

### Scenario S-T2-01: 否定测试覆盖率报告

```
GIVEN  spec.md 中 Scenario 标题含 "should NOT" 或标签含 @negation
AND    无测试文件引用该 Scenario
WHEN   运行 pnpm gate:spec-test-mapping
THEN   该 Scenario 出现在“否定测试缺失”分类报告中
AND    输出单独统计否定测试覆盖率
```

### Scenario S-T2-02: 能力声称测试覆盖率报告

```
GIVEN  spec.md 中 Scenario 描述包含 "声称支持" "能力" "capability" 或标签含 @capability
AND    无测试文件引用该 Scenario
WHEN   运行 pnpm gate:spec-test-mapping
THEN   该 Scenario 出现在“能力声称未验证”分类报告中
```

### Scenario S-T2-03: CJK 场景测试覆盖率报告

```
GIVEN  spec.md 中 Scenario 标题含 "CJK" "中文" "日文" "韩文" 或标签含 @cjk
AND    无测试文件引用该 Scenario
WHEN   运行 pnpm gate:spec-test-mapping
THEN   该 Scenario 出现在“CJK 场景未覆盖”分类报告中
```

### Scenario S-T2-04: 拒绝路径测试覆盖率报告

```
GIVEN  spec.md 中 Scenario 描述包含 "拒绝" "reject" "deny" "失败" 或标签含 @rejection
AND    无测试文件引用该 Scenario
WHEN   运行 pnpm gate:spec-test-mapping
THEN   该 Scenario 出现在“拒绝路径未覆盖”分类报告中
```

### Scenario S-T2-05: Tier 2 维度汇总报告

```
GIVEN  gate 扫描完成后
WHEN   输出报告
THEN   报告末尾包含 Tier 2 维度汇总：
      [SPEC_TEST_MAP] Tier-2 summary:
        negation:   C1/T1 (XX%)
        capability: C2/T2 (XX%)
        cjk:        C3/T3 (XX%)
        rejection:  C4/T4 (XX%)
AND    审计 Agent 可直接引用该汇总数据作为 Tier 2 验证输入
```
