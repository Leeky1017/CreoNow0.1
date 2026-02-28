## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：为 Command Palette 补齐文件搜索能力 + 将搜索匹配从 `includes` 升级为 fuzzy match。不扩展到跨项目搜索。
- [ ] 1.2 审阅并确认错误路径与边界路径：无文件索引时降级为仅命令搜索（不报错）；空 query 时不显示文件项（保持现有行为）。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：fuzzy 搜索 p95 输入响应 < 120ms（或 workbench spec 阈值）；文件搜索结果必须包含文件名和路径。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：建议先行 `fe-ipc-open-folder-contract`（确保工作区语义稳定）

### 1.5 预期实现触点

- `apps/desktop/renderer/src/features/commandPalette/CommandPalette.tsx`
  - L399-411：`filterCommands()` 当前用 `label.toLowerCase().includes(query)` → 替换为 fuzzy match 引擎
  - L601：`filteredCommands` 调用处 → 接入 fuzzy 排序（按匹配分数排序）
  - 文件数据源：需从 fileStore 或文档索引获取文件列表，转为 `CommandItem[]`（category: "file"）
- 新增 `apps/desktop/renderer/src/features/commandPalette/fuzzyMatch.ts`（fuzzy 匹配模块）：
  - 可选方案：fuse.js / 自实现轻量 fuzzy（字符序列匹配 + 评分）
  - 导出 `fuzzyFilter(items: CommandItem[], query: string): CommandItem[]`
- `apps/desktop/renderer/src/features/commandPalette/CommandPalette.test.tsx`
  - 已有 filter 相关测试（L755-850），新测试可参考此范本

**为什么是这些触点**：`filterCommands()` 是搜索的唯一入口，fuzzy 模块独立抽取便于测试和替换。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-CP-S1` | `apps/desktop/renderer/src/features/commandPalette/fuzzyMatch.test.ts` | `it('matches items by fuzzy character sequence')` | 输入 "cmdplt" 匹配 "CommandPalette"；输入 "dshbrd" 匹配 "DashboardPage" | 无 | `pnpm -C apps/desktop test:run features/commandPalette/fuzzyMatch` |
| `WB-FE-CP-S1b` | 同上 | `it('returns empty array when no items match')` | 输入无关字符串，断言返回空数组 | 无 | 同上 |
| `WB-FE-CP-S1c` | 同上 | `it('ranks better matches higher')` | 精确前缀匹配排在模糊匹配之前 | 无 | 同上 |
| `WB-FE-CP-S2` | `apps/desktop/renderer/src/features/commandPalette/CommandPalette.file-search.test.tsx` | `it('shows file results when query matches file names')` | mock fileStore 返回文件列表，输入 query，断言渲染文件项 | mock fileStore | `pnpm -C apps/desktop test:run features/commandPalette/CommandPalette.file-search` |
| `WB-FE-CP-S3` | 同上 | `it('degrades gracefully when no file index available')` | mock fileStore 返回空，断言仅显示命令项、无报错 | mock fileStore | 同上 |

### 可复用测试范本

- CommandPalette 测试：`apps/desktop/renderer/src/features/commandPalette/CommandPalette.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-CP-S1`：构造 CommandItem 数组，调用 `fuzzyFilter(items, "cmdplt")`，断言匹配到 label 含 "CommandPalette" 的项。
  - 期望红灯原因：`fuzzyMatch.ts` 模块不存在。
- [ ] 3.2 `WB-FE-CP-S1b`：输入无关字符串，断言返回空数组。
  - 期望红灯原因：同上。
- [ ] 3.3 `WB-FE-CP-S1c`：构造精确前缀和模糊匹配项，断言精确前缀排在前面。
  - 期望红灯原因：同上。
- [ ] 3.4 `WB-FE-CP-S2`：mock fileStore 返回文件列表，渲染 CommandPalette，输入 query，断言文件项出现。
  - 期望红灯原因：当前 CommandPalette 不接入文件数据源。
- [ ] 3.5 `WB-FE-CP-S3`：mock fileStore 返回空，断言仅显示命令项且无报错。
  - 期望红灯原因：当前无文件搜索降级逻辑。
- 运行：`pnpm -C apps/desktop test:run features/commandPalette/fuzzyMatch` / `CommandPalette.file-search`

## 4. Green（最小实现通过）

- [ ] 4.1 新增 `fuzzyMatch.ts`：
  - `fuzzyFilter(items: CommandItem[], query: string): CommandItem[]`
  - 实现字符序列匹配 + 评分排序（或集成 fuse.js）
  → S1/S1b/S1c 转绿
- [ ] 4.2 `CommandPalette.tsx`：`filterCommands()` L399-411 替换 `includes` 为 `fuzzyFilter` 调用
- [ ] 4.3 `CommandPalette.tsx`：从 fileStore 获取文件列表，转为 `CommandItem[]`（category: "file"），合并到 commands
  → S2 转绿
- [ ] 4.4 文件索引为空时跳过合并，仅返回命令项 → S3 转绿

## 5. Refactor（保持绿灯）

- [ ] 5.1 抽取 search adapter 接口（`SearchSource`），便于未来扩展（命令/文件/设置）
- [ ] 5.2 确认 fuzzy 引擎在 1000+ 项时 p95 < 120ms（可加 benchmark 测试）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check：确认 `fe-ipc-open-folder-contract` 状态
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
