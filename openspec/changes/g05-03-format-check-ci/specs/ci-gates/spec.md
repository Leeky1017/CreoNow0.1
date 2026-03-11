# Delta Spec: ci-gates — `format:check` 接入 CI

- **Parent Change**: `g05-03-format-check-ci`
- **Base Spec**: N/A（CI 门禁增量规则）
- **GitHub Issue**: 待创建

---

## 变更摘要

CI 必须执行 `pnpm format:check`。格式不一致的变更不得以“本地忘记跑”作为理由越过主线。

---

## Scenarios

### Scenario S-G05-03-01: CI 包含 format check

```
GIVEN  `.github/workflows/ci.yml`
WHEN   查看 lint / typecheck 链路
THEN   其中包含 `pnpm format:check`
```

### Scenario S-G05-03-02: 格式错误导致 CI 失败

```
GIVEN  一个含 Prettier 格式错误的 PR
WHEN   CI 运行 `pnpm format:check`
THEN   对应 job 失败
```