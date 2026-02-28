# Editor Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-editor-inline-diff-decoration-integration

### Requirement: 编辑器必须支持版本差异 Decoration 渲染 [ADDED]

#### Scenario: 对比模式开启时编辑器渲染 diff decorations [ADDED]

- **假设** 编辑器处于“版本对比模式”
- **当** diff 数据可用
- **则** 编辑器必须渲染对应 decorations（增删改）
- **并且** 关闭对比模式后 decorations 必须被移除
