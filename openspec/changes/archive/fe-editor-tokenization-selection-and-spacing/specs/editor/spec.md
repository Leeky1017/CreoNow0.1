# Editor Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-editor-tokenization-selection-and-spacing

### Requirement: 编辑器光标/选区与段间距必须走 Token [ADDED]

#### Scenario: 选区高亮必须使用 --color-selection [ADDED]

- **假设** 用户在编辑器中选择一段文本
- **当** 选区高亮渲染
- **则** 选区颜色必须来自 `--color-selection` Token
- **并且** 在亮/暗主题下应分别取对应主题值

#### Scenario: 光标颜色必须使用 --color-caret [ADDED]

- **假设** 用户在编辑器中输入
- **当** 光标渲染
- **则** 光标颜色必须来自 `--color-caret` Token

#### Scenario: 段落间距必须可通过 Token 控制 [ADDED]

- **假设** 用户编辑长文档
- **当** 段落渲染
- **则** 段落间距必须可通过 `--text-editor-paragraph-spacing` 控制
