# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-rightpanel-ai-guidance-and-style

### Requirement: AI 面板错误必须“指路”而非仅“报错” [ADDED]

AI 面板遇到不可恢复或可恢复错误时，必须展示专用引导卡片，明确下一步操作。

#### Scenario: DB_ERROR 必须展示 native binding 修复引导 [ADDED]

- **假设** AI 面板收到错误码 `DB_ERROR`
- **当** 用户查看错误区域
- **则** 系统必须展示包含修复步骤的引导卡片（含可复制的命令与重启提示）
- **并且** 不得仅展示通用错误文案

#### Scenario: AI_NOT_CONFIGURED 必须展示配置入口引导 [ADDED]

- **假设** AI 面板收到错误码 `AI_NOT_CONFIGURED`
- **当** 用户查看错误区域
- **则** 系统必须展示“去 Settings → AI 配置”的引导入口
- **并且** 入口点击必须能打开对应设置页

### Requirement: 禁止 AiPanel 内联 style 注入 [ADDED]

- AiPanel 不得通过渲染 `<style>` 标签注入 keyframes。
- 动画必须落入 Token/CSS 体系，并尊重 reduced motion。
