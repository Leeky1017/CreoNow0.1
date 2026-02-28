# Version Control Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-editor-inline-diff-decoration-integration

### Requirement: 版本对比必须支持 Inline Diff（编辑器内） [ADDED]

#### Scenario: 用户进入版本对比时差异必须在编辑器正文中高亮 [ADDED]

- **假设** 用户选择两个版本进行对比
- **当** 对比视图渲染
- **则** 插入/删除/修改必须在编辑器正文中以高亮方式呈现
- **并且** 用户无需切换到独立面板才能理解差异
