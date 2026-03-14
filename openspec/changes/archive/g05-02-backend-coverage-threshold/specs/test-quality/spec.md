# Delta Spec: test-quality — 后端 Coverage Threshold 门禁

- **Parent Change**: `g05-02-backend-coverage-threshold`
- **Base Spec**: N/A（测试治理增量规则）
- **GitHub Issue**: 待创建

---

## 变更摘要

后端 `vitest.config.core.ts` 必须配置 coverage thresholds，并在当前代码下可通过；当覆盖率跌破阈值时，CI 必须阻断合并。

---

## Scenarios

### Scenario S-G05-02-01: 后端配置存在非零阈值

```
GIVEN  `apps/desktop/vitest.config.core.ts`
WHEN   读取 `coverage.thresholds`
THEN   statements / branches / functions / lines 四项均存在且大于 0
```

### Scenario S-G05-02-02: 当前基线可以通过

```
GIVEN  当前 main 分支上的后端测试基线
WHEN   运行 `pnpm test:coverage:core`
THEN   命令通过
```

### Scenario S-G05-02-03: 阈值被突破时阻断

```
GIVEN  某项 threshold 被暂时调高到超出当前覆盖率
WHEN   运行 `pnpm test:coverage:core`
THEN   命令失败
AND    输出中明确指出低于阈值的维度
```
