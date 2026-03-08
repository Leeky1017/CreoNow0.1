# RFC: AI Service 速率限制

- **状态**: DRAFT
- **作者**: Wave 0 Gate 自动生成
- **创建日期**: 2026-03-08
- **评审会议**: 待定
- **关联 Pattern**: #27（全局速率限制缺失）
- **目标阶段**: A1（Phase 0 产出 RFC，A1 阶段实现后升级为 Tier 1 自动阻断）

---

## §1 现状

当前 AI 调用链路无任何速率限制：

```
用户操作
  → renderer (AiPanel / InlineAI / SkillRouter)
    → preload (ipcGateway)
      → main (aiService)
        → provider 层 (OpenAI / Anthropic / 本地模型)
          → 外部 API 端点
```

**无限流点标注**：
- `aiService.chat()` → 无调用频率计数
- `aiService.complete()` → 无调用频率计数
- `embeddingService.embed()` → 无批量大小限制
- `provider.sendRequest()` → 无重试退避策略
- Skill 批量执行 → 无并发控制

**风险**：
1. 用户快速连续触发 AI 操作 → API 调用风暴 → 供应商限流 → 全局不可用
2. 恶意或异常 Skill → 无限循环调用 → 账单爆炸
3. Embedding 批量操作 → 瞬时大量请求 → 供应商 429 响应

## §2 需限流端点清单

| 端点 | 层级 | 当前调用频率（估计） | 建议限制 |
|------|------|---------------------|---------|
| `aiService.chat()` | Service | 用户触发，无上限 | 10 req/min/user |
| `aiService.complete()` | Service | 用户触发（inline），无上限 | 20 req/min/user |
| `embeddingService.embed()` | Service | 文档变更触发，无上限 | 50 req/min |
| `provider.sendRequest()` | Provider | 上游透传，无上限 | 供应商限额 80% |
| Skill 执行 | SkillRouter | 用户/AI 触发，无上限 | 5 concurrent |

## §3 候选限流策略

| 策略 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **Token Bucket** | 允许突发流量；实现简单；内存占用小 | 突发可能仍触发供应商限制 | 用户交互类（chat, complete） |
| **Sliding Window** | 精确的时间窗口控制；平滑限流 | 实现较复杂；需记录每次请求时间戳 | API 调用计费统计 |
| **Leaky Bucket** | 严格平滑输出；保护下游 | 不允许任何突发；用户体验可能降低 | Embedding 批量操作 |
| **Concurrency Limiter** | 控制并行度；防止资源耗尽 | 不控制总量 | Skill 并发执行 |

## §4 推荐方案

采用**分层限流**策略：

1. **Service 层 — Token Bucket**
   - `aiService` 实例维护 token bucket（容量 10，补充速率 10/min）
   - 每次 `chat()`/`complete()` 消耗 1 token
   - token 耗尽时排队等待或返回 `RATE_LIMITED` 错误

2. **Provider 层 — 指数退避重试**
   - 收到 429 响应后，按 `2^n * 1000ms`（n=0..4）退避重试
   - 最大重试 3 次，超限后上报错误

3. **Embedding 层 — Leaky Bucket**
   - 固定输出速率：10 req/s
   - 批量请求排队处理

4. **Skill 层 — Concurrency Limiter**
   - 最大并发 Skill 执行数 = 5
   - 超限排队，超时（30s）后拒绝

**实现层级**：在 Service 层统一实现，通过中间件模式注入。

## §5 RFC 状态

- [x] DRAFT — 初始草案
- [ ] REVIEW — 架构评审
- [ ] APPROVED — 方案确认
- [ ] IMPLEMENTED — 代码实现（A1 阶段）
- [ ] TIER1 — 升级为 CI 自动阻断（Guard 检查限流中间件覆盖率）

**下一步**：
1. 收集实际 API 调用频率数据
2. 确认各供应商的限流策略和阈值
3. 架构评审会议确定最终方案
