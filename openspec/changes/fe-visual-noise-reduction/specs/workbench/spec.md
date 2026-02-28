# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-visual-noise-reduction

### Requirement: 信息层级不得依赖过度边框分割 [ADDED]

信息层级优先使用间距与排版表达；边框仅作为最后手段，且分隔线必须使用 `--color-separator`。

#### Scenario: 非交互区域不得以默认边框包裹 [ADDED]

- **假设** 某区域内容为静态信息或表单分组
- **当** 该区域渲染
- **则** 不得以默认 `border` 卡片包裹作为主要分组手段
- **并且** 分组应优先通过间距/标题/背景色差异实现

#### Scenario: 需要分隔线时必须使用 separator token [ADDED]

- **假设** UI 需要使用细线进行分隔
- **当** 分隔线渲染
- **则** 必须使用 `--color-separator`
- **并且** 不得滥用 `--color-border-default` 造成视觉噪音
