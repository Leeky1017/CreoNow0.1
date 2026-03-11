# Delta Spec: test-quality — 测试结构规范自动化拦截

- **Parent Change**: `g05-01-require-describe-in-tests`
- **Base Spec**: N/A（测试治理增量规则）
- **GitHub Issue**: 待创建

---

## 变更摘要

新增 ESLint 规则 `local/require-describe-in-tests`，要求测试文件使用 `describe/it` 结构。新文件直接阻断，存量目录暂以 `warn` 方式过渡，并与 T-MIG 批次迁移联动收紧。

---

## Scenarios

### Scenario S-G05-01-01: 无 describe 的新测试文件被阻断

```
GIVEN  一个新增的 `.test.ts` 文件
AND    文件中没有 `describe()`
WHEN   运行 `pnpm lint`
THEN   ESLint 报出 `local/require-describe-in-tests` 错误
```

### Scenario S-G05-01-02: 合规测试文件通过 lint

```
GIVEN  一个使用 `describe()` 与 `it()` 组织的 `.test.ts` 文件
WHEN   运行 `pnpm lint`
THEN   该规则不报错
```

### Scenario S-G05-01-03: 存量目录在过渡期只告警不阻断

```
GIVEN  `apps/desktop/tests/unit/` 中存在尚未迁移的旧测试文件
WHEN   运行 `pnpm lint`
THEN   规则输出 warning
AND    CI 不因该 warning 直接失败
```

### Scenario S-G05-01-04: 迁移完成的目录收紧为 error

```
GIVEN  T-MIG 某个批次已完成
AND    对应目录已移除 override
WHEN   新的无 `describe()` 测试再次出现在该目录
THEN   规则以 error 形式阻断
```