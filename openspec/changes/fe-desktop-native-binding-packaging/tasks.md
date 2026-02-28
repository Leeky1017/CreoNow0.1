## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：修复 `better-sqlite3` native binding 在打包产物中的包含与加载路径，确保打包版启动不报 `DB_ERROR`。不解决 Provider 未配置问题（`AI_NOT_CONFIGURED`）。
- [ ] 1.2 审阅并确认错误路径与边界路径：开发态 vs 打包态路径差异；不同平台（win/mac/linux）ABI 差异；`asar` 内 `.node` 文件需 `asarUnpack`。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：打包版启动后 AI/Skills 初始化不因缺失 native binding 返回 `DB_ERROR`；CI 构建流程包含自动验证护栏。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/electron-builder.json`
  - 当前 `"npmRebuild": false` 可能导致 native addon 未针对 Electron ABI 重编译
  - `"asarUnpack": ["**/*.node", "**/*.dll"]` 已配置，但需确认 `better-sqlite3.node` 实际被包含
  - 可能需要调整 `files` 或 `extraResources` 确保 native binding 路径正确
- `apps/desktop/main/src/` — native binding 加载路径
  - 10+ 个 IPC handler 通过 `import type Database from "better-sqlite3"` 引用（类型导入不影响运行时）
  - 实际运行时 `require("better-sqlite3")` 的路径解析在打包态可能失败 → 需确认 `app.getPath` 或 `__dirname` 在 asar 中的行为
- `scripts/ensure-desktop-native-node-abi.ts`
  - 已有 ABI 探测脚本（probe `better-sqlite3` 内存数据库），可作为 CI 护栏
  - 需确认此脚本在 CI 打包后被调用

**为什么是这些触点**：`better-sqlite3` 是唯一的 native addon 依赖，electron-builder 配置决定打包行为，ABI 脚本是验证护栏。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例或构建验证
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败检查）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件/检查（计划） | 用例名（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | -------------------- | -------------- | -------- | --------- | -------- |
| `AI-FE-NATIVE-S1` | `scripts/ensure-desktop-native-node-abi.ts` | ABI probe：`better-sqlite3` 可加载并创建内存 DB | `require("better-sqlite3")` 不抛异常，`new Database(":memory:")` 成功 | 需要 native rebuild 完成 | `pnpm tsx scripts/ensure-desktop-native-node-abi.ts` |
| `AI-FE-NATIVE-S2` | `apps/desktop/main/src/ipc/__tests__/native-binding-path.guard.test.ts` | `it('electron-builder.json asarUnpack includes .node files')` | 读取 electron-builder.json，断言 `asarUnpack` 包含 `**/*.node` | `fs.readFileSync` | `pnpm -C apps/desktop test:run ipc/__tests__/native-binding-path.guard` |
| `AI-FE-NATIVE-S3` | 同上 | `it('electron-builder.json npmRebuild is enabled or rebuild is handled externally')` | 断言 `npmRebuild !== false` 或存在外部 rebuild 脚本调用 | `fs.readFileSync` | 同上 |

## 3. Red（先写失败检查）

- [ ] 3.1 `AI-FE-NATIVE-S1`：运行 `pnpm tsx scripts/ensure-desktop-native-node-abi.ts`。
  - 期望红灯原因：若当前 `npmRebuild: false` 且未外部 rebuild，probe 会因 ABI 不匹配失败。
  - 若开发态已 rebuild 则此步可能绿灯——需在 CI 打包后验证。
- [ ] 3.2 `AI-FE-NATIVE-S2`：新建 guard 测试，读取 `electron-builder.json`，断言 `asarUnpack` 包含 `**/*.node`。
  - 期望红灯原因：当前已配置（应绿灯），此为回归护栏。
- [ ] 3.3 `AI-FE-NATIVE-S3`：断言 `npmRebuild` 不为 `false`，或存在 CI 步骤调用 `electron-rebuild`。
  - 期望红灯原因：当前 `"npmRebuild": false`，且需确认是否有外部 rebuild 步骤。
- 运行：`pnpm -C apps/desktop test:run ipc/__tests__/native-binding-path.guard`

## 4. Green（最小实现通过）

- [ ] 4.1 `electron-builder.json`：将 `"npmRebuild": false` 改为 `true`（或改为由 CI 脚本显式调用 `electron-rebuild`）→ S3 转绿
- [ ] 4.2 确认 `asarUnpack` 已包含 `**/*.node`（当前已配置）→ S2 保持绿灯
- [ ] 4.3 在 CI workflow 中确保打包后运行 `pnpm tsx scripts/ensure-desktop-native-node-abi.ts` 作为 gate → S1 转绿
- [ ] 4.4 若 native binding 加载路径在打包态不正确（`__dirname` 在 asar 中指向虚拟路径），需调整加载逻辑使用 `app.getAppPath()` + `asarUnpack` 解压路径

## 5. Refactor（保持绿灯）

- [ ] 5.1 收敛 native binding 路径解析为单一入口（如 `lib/nativeBinding.ts`），避免多处分叉
- [ ] 5.2 确认 `ensure-desktop-native-node-abi.ts` 的错误信息足够明确（包含 expected/actual ABI 版本）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：`pnpm tsx scripts/ensure-desktop-native-node-abi.ts` 的 Red/Green 输出
- [ ] 6.2 记录 RUN_LOG：打包后产物中 `better-sqlite3.node` 的路径与大小
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
