# Delta Spec: visual-regression — 前端视觉回归测试基础设施

- **Parent Change**: `g05-06-visual-regression-testing`
- **Base Spec**: N/A（测试基础设施增量规则）
- **GitHub Issue**: 待创建

---

## 变更摘要

仓库新增基于 Playwright + Storybook 的视觉回归测试基础设施。关键 story 必须拥有 baseline 截图，截图差异在 CI 中必须可阻断。

---

## Scenarios

### Scenario S-G05-06-01: 关键 story 生成 baseline

```
GIVEN  原语、布局与关键功能 story
WHEN   首次运行 `pnpm test:visual --update-snapshots`
THEN   生成可被 Git 追踪的 baseline 截图
```

### Scenario S-G05-06-02: 样式退化触发截图差异

```
GIVEN  一个已存在 baseline 的 story
AND    样式发生非预期变化
WHEN   运行 `pnpm test:visual`
THEN   `toHaveScreenshot()` 失败
AND    CI 上传 diff 产物
```

### Scenario S-G05-06-03: 双主题被同时覆盖

```
GIVEN  一个需要视觉回归的 story
WHEN   执行视觉测试
THEN   dark 与 light 两个主题均被截图验证
```
