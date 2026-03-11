# T-MIG 测试结构存量迁移总控

- **GitHub Issue**: 待创建（umbrella）
- **所属任务簇**: T-MIG（测试结构存量迁移）
- **涉及模块**: testing
- **前端验收**: 否

---

## Why：为什么必须做

当前仓库中测试结构债务不是单点问题，而是一串彼此勾连的存量工作：`describe/it` 迁移、浅断言替换、`getByText` 降率，它们共享同一条治理主线，却不适合继续在 EO 中伪装成“已存在的 7 个独立 change 目录”。

---

## What：做什么

1. 以 `t-mig-test-structure-migration` 作为 umbrella change 管理 7 个迁移批次
2. 在 EO 中把 T-MIG-01 ~ T-MIG-07 明确降级为 umbrella 下的 work package / child issue
3. 保留 P0-P4 优先级和批次顺序，但不再伪装为仓库中已存在的 7 个 change 目录

---

## Non-Goals：不做什么

1. 不在本 change 内执行任何真实迁移
2. 不重写 EO 之外的 A0 / G0 结构

---

## 依赖与影响

- **上游依赖**: G0.5-01
- **下游受益**: 后续所有测试结构清债批次