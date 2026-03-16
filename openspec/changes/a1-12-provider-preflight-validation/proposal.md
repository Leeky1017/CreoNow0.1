# Provider 前置校验与模型有效性提示

- **GitHub Issue**: #1127（child issue；umbrella #1122）
- **所属 umbrella**: `a1-capability-closure-program`
- **涉及模块**: ai-service
- **前端验收**: 是

---

## Why：为什么必须做

### 1. 用户现象

用户可以填写 API Key 并选择模型，但当前校验只看长度，不验证模型名与 provider 配置是否合理。

### 2. 根因

Provider 配置的前置约束没有在设置入口与请求发起前统一收口。

### 3. 风险 / 威胁

用户会把“配置错误导致必然失败”误解为“产品不稳定”或“模型服务波动”。

---

## What：这条 change 要完成什么

1. 为 API Key、模型名与 provider 组合增加前置有效性校验
2. 在设置与调用前给出用户可理解的失败提示
3. 让 factsheet、spec 与设置文案对齐，不再停留在模糊 follow-up

---

## Non-Goals：不做什么

1. 不在本 change 中实现 provider 级配额管理
2. 不在本 change 中改写流式 failover 机制

---

## 依赖与影响

- 依赖 ai-service 的 provider registry 与设置存储链路
- 与 `a1-08-judge-advanced-evaluation` 共享 provider / model 能力边界

---

## 当前计划中的主要落点

- `apps/desktop/main/src/services/ai/`
- `apps/desktop/renderer/src/features/settings-dialog/`
- `openspec/specs/ai-service/spec.md`