## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：对齐 `workbench/spec.md` 与实现之间的漂移——IconBar 入口、`graph`/`knowledgeGraph` 命名、RightPanel tab 枚举。只做 spec 对齐与决策落盘，不做功能实现。
- [ ] 1.2 审阅并确认漂移点全集：
  - IconBar：`media` 面板 spec 要求存在但代码缺失
  - 命名：`graph` vs `knowledgeGraph` 同义双栈
  - RightPanel：spec 文字要求仅 AI/Info，但枚举包含 `quality`
- [ ] 1.3 审阅并确认不可变契约：同一面板不得存在同义双 ID；spec 内不得自相矛盾。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：
  - [x] D1（IconBar `media` 面板处置）Owner 决策已确认 — 保留但标注 `[FUTURE]`
  - [x] D2（`graph` vs `knowledgeGraph` 命名）Owner 决策已确认 — 统一到 `knowledgeGraph`（仅改 spec，代码零改动）
  - [x] D3（RightPanel `Quality` tab 保留/移除）Owner 决策已确认 — 保留，更新 Spec 为三 tab

### 1.5 预期实现触点

- `openspec/specs/workbench/spec.md`（delta spec 修改）：
  - IconBar 入口列表：按 D1 决策处理 `media`（标注未实现 / 删除 / 补全）
  - 面板 ID 命名：按 D2 决策统一为 `knowledgeGraph` 或 `graph`
  - RightPanel tab 枚举：按 D3 决策保留或移除 `quality`
- `apps/desktop/renderer/src/stores/layoutStore.tsx`（代码对齐）：
  - L22-29：`LeftPanelType` 枚举 — 若 D2 决定统一命名则此处同步
  - L34+：`RightPanelType` 枚举 — 若 D3 决定移除 quality 则此处同步
- `apps/desktop/renderer/src/components/layout/IconBar.tsx`：
  - 面板 ID 引用 — 与 layoutStore 枚举对齐
- Guard 测试（可选但推荐）：
  - 断言 LeftPanelType 和 RightPanelType 不含同义双 ID

**为什么是这些触点**：spec.md 是契约 SSOT，layoutStore 是代码 SSOT，IconBar 是入口消费方。三者必须一致。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-DRIFT-S1` | `apps/desktop/renderer/src/components/layout/__tests__/panel-id-ssot.guard.test.ts` | `it('LeftPanelType has no duplicated semantic IDs')` | 读取 layoutStore.tsx，断言不同时含 `graph` 和 `knowledgeGraph` | `fs.readFileSync` | `pnpm -C apps/desktop test:run components/layout/__tests__/panel-id-ssot.guard` |
| `WB-FE-DRIFT-S2` | 同上 | `it('RightPanelType matches spec definition')` | 读取 layoutStore.tsx，断言 RightPanelType 与 spec 一致（按 D3 决策） | `fs.readFileSync` | 同上 |
| `WB-FE-DRIFT-S3` | 同上 | `it('spec.md has no internal contradictions on panel enums')` | 读取 workbench/spec.md，断言面板枚举段落无矛盾 | `fs.readFileSync` | 同上 |

### 可复用测试范本

- panel-orchestrator 测试：`apps/desktop/renderer/src/components/layout/__tests__/panel-orchestrator.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-DRIFT-S1`：读取 layoutStore.tsx，断言不同时含 `graph` 和 `knowledgeGraph`。
  - 期望红灯原因：当前 LeftPanelType 含 `knowledgeGraph`，spec 可能引用 `graph`（需验证）。
- [ ] 3.2 `WB-FE-DRIFT-S2`：断言 RightPanelType 与 D3 决策一致。
  - 期望红灯原因：当前枚举可能含 `quality` 但 spec 文字排除。
- [ ] 3.3 `WB-FE-DRIFT-S3`：读取 spec.md，断言面板枚举无矛盾。
  - 期望红灯原因：当前 spec 内部自相矛盾。
- 运行：`pnpm -C apps/desktop test:run components/layout/__tests__/panel-id-ssot.guard`

## 4. Green（最小实现通过）

- [ ] 4.1 按 D2 决策统一面板 ID 命名（layoutStore + IconBar + spec） → S1 转绿
- [ ] 4.2 按 D3 决策对齐 RightPanelType（layoutStore + spec） → S2 转绿
- [ ] 4.3 修复 spec.md 内部矛盾段落 → S3 转绿
- [ ] 4.4 按 D1 决策处理 `media` 面板（spec 标注）

## 5. Refactor（保持绿灯）

- [ ] 5.1 确认 spec 修改后无其他引用断裂
- [ ] 5.2 确认 delta spec 使用 `[MODIFIED]`/`[REMOVED]` 标记

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：D1/D2/D3 决策输入与落盘结果
- [ ] 6.2 记录 RUN_LOG：guard 测试通过输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check：D1/D2/D3 决策状态
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
