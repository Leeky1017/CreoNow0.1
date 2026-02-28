# AI Service Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-rightpanel-ai-guidance-and-style

### Requirement: AI 未就绪时必须提供可操作的错误码 [ADDED]

当 AI 能力不可用时，系统必须返回稳定、可分流的错误码，供 Workbench 渲染专用引导 UI。

#### Scenario: Provider 未配置必须返回 AI_NOT_CONFIGURED [ADDED]

- **假设** 环境变量或设置中缺失 `CREONOW_AI_PROVIDER`
- **当** 前端请求模型列表或发起 AI 调用
- **则** AI Service 必须返回错误码 `AI_NOT_CONFIGURED`
- **并且** 错误信息必须可被用户理解（可直接指向 Settings → AI）
