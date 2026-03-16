# Judge 高级评估闭环

- **GitHub Issue**: #1133（child issue；umbrella #1122）
- **所属 umbrella**: `a1-capability-closure-program`
- **涉及模块**: ai-service
- **前端验收**: 是

---

## Why：为什么必须做

### 1. 用户现象

现在 Judge 能给基础规则结果，但离“质量评审”还差高级语义层。

### 2. 根因

`runAdvancedChecks` 仍是扩展位，没有真正接入 provider / prompt / structured result。

### 3. 风险 / 威胁

多候选+Judge 的产品承诺无法完全兑现。

---

## What：这条 change 要完成什么

1. 为 advanced checks 定义 provider、prompt、fallback 与评分输出结构
2. 让 QualityPanel 与 candidate scoring 用上真实高级结果
3. 保留 partialChecksSkipped 的诚实降级路径

---

## Non-Goals：不做什么

1. 不强制所有 Judge 逻辑都依赖远程模型
2. 不在本 change 中重做 AI 面板布局

---

## 依赖与影响

- 依赖 ai-service / skill-system / workbench
- 与 provider 配置链路协同

---

## 当前计划中的主要落点

- `apps/desktop/main/src/services/ai/`
- `apps/desktop/main/src/ipc/judge.ts`
- `apps/desktop/renderer/src/features/rightpanel/`
