# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-i18n-core-pages-keying

### Requirement: 核心 Feature 页面必须完成 i18n 键值化 [ADDED]

核心页面（Search/AiPanel 等）不得残留硬编码可见字符串；必须使用 i18n key + `t()`。

#### Scenario: 切换语言后 SearchPanel/AiPanel 文案必须随之变化 [ADDED]

- **假设** 用户已切换 UI 语言
- **当** 用户打开 SearchPanel 或 AiPanel
- **则** 所有可见文案必须按所选语言渲染
- **并且** 不得出现中英混杂
