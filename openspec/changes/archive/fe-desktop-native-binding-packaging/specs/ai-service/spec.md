# AI Service Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-desktop-native-binding-packaging

### Requirement: 打包产物必须包含 AI/Skills 依赖的 native bindings [ADDED]

#### Scenario: 打包版启动不得因缺失 native binding 返回 DB_ERROR [ADDED]

- **假设** 用户运行打包版应用
- **当** AI 面板或 Skills 初始化触发数据库依赖
- **则** 系统不得因缺失 native binding 而返回 `DB_ERROR`
- **并且** 构建流程必须提供可自动验证的护栏以防回归
