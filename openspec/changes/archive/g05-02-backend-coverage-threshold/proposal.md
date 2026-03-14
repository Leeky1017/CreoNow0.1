# G0.5-02 后端 Coverage Threshold 门禁

- **GitHub Issue**: 待创建
- **所属任务簇**: W0.5-GATE（审计补丁 — 制度门禁补齐）
- **涉及模块**: testing, ci-gates
- **前端验收**: 否

---

## Why：为什么必须做

### 1. 现状

前端 coverage 已经有阈值，后端 coverage 仍然只生成报告、不做阻断。结果是 `coverage-gate` 的存在感很强，咬合力却不够，形成“门在、锁不在”的假象。

### 2. 根因

- `apps/desktop/vitest.config.core.ts` 未配置 `thresholds`
- CI 对后端覆盖率只上传产物，不校验下限
- 文档中对后端 coverage 的收口路径没有与现状同步

### 3. 不做的后果

- 后端关键路径覆盖率可以持续下滑而不触发红灯
- Wave 0.5 的制度补丁无法完成“coverage 门禁自洽”这一目标

### 4. 证据来源

| 文档                                            | 章节     | 内容                                   |
| ----------------------------------------------- | -------- | -------------------------------------- |
| `docs/references/testing-excellence-roadmap.md` | GAP-2    | 后端 coverage threshold 缺失           |
| `openspec/changes/EXECUTION_ORDER.md`           | Wave 0.5 | 将 coverage threshold 设为完成标志之一 |

---

## What：做什么

1. 为 `vitest.config.core.ts` 增加非零 coverage thresholds
2. 以当前 baseline 为依据设置可执行阈值
3. 同步命令与 CI 映射文档，明确该门禁已生效

---

## Non-Goals：不做什么

1. 不在本 change 内提升所有后端测试覆盖率
2. 不修改前端 coverage 配置
3. 不引入第三套 coverage 统计工具

---

## 依赖与影响

- **上游依赖**: 无
- **下游受益**: A0-23、A0-24 及后续 main/src 测试扩展
