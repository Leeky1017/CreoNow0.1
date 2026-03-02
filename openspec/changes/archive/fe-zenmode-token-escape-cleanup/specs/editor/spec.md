# Editor Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-zenmode-token-escape-cleanup

### Requirement: ZenMode 必须彻底遵循 Token 体系 [MODIFIED]

ZenMode 作为沉浸式写作模式，其视觉表达必须完全通过 Token 定义，禁止残留硬编码颜色/间距/字号。

#### Scenario: ZenMode 不得使用硬编码 rgba/魔法间距/魔法字号 [ADDED]

- **假设** 用户进入 ZenMode
- **当** ZenMode 渲染
- **则** 样式不得出现硬编码 `rgba(...)`、`px-[80px]`、`text-[48px]` 等魔法值
- **并且** 必须通过 `tokens.css` 中的语义变量或 ZenMode 专用 Token 表达
