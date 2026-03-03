# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-token-escape-sweep

### Requirement: Feature 层不得出现 Token 逃逸 [ADDED]

- Feature 层颜色必须映射到 `--color-*` 语义变量，禁止 raw Tailwind color、hex、rgba。
- Feature 层层级必须映射到 `--z-*`，禁止数字 z-index。
- Feature 层动效不得滥用 `transition-all`，必须使用明确属性与 tokenized duration。

#### Scenario: 新增 raw hex/rgba 必须被门禁阻断 [ADDED]

- **假设** 开发者在 Feature 组件新增 `#xxxxxx` 或 `rgba(...)`
- **当** 进入测试与门禁阶段
- **则** 检查必须失败并提示改用 `--color-*` token

#### Scenario: 新增数字 z-index 必须被门禁阻断 [ADDED]

- **假设** 开发者新增 `z-10/z-20/z-30/z-50` 等数字层级
- **当** 进入测试与门禁阶段
- **则** 检查必须失败并提示改用 `--z-*` token
