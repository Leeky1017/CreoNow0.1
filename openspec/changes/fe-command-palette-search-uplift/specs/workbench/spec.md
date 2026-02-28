# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-command-palette-search-uplift

### Requirement: Command Palette 必须支持文件搜索与 fuzzy match [ADDED]

#### Scenario: 用户输入模糊查询必须能找到目标文件 [ADDED]

- **假设** 工作区中存在文件 "Chapter 01.md"
- **当** 用户在 Command Palette 输入 "ch01"（或等价模糊查询）
- **则** 系统必须返回该文件作为候选
- **并且** 选择后必须打开该文件

#### Scenario: 命令面板必须维持性能阈值 [ADDED]

- **假设** 工作区文件数达到性能测试规模
- **当** 用户唤起 Command Palette
- **则** 面板必须在 p95 阈值内进入可输入状态
