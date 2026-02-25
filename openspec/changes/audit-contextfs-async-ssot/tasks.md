更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（contextFs.ts 同步/异步双份代码消除, 保留异步版本为 SSOT）
- [ ] 1.2 审阅并确认错误路径与边界路径（目录创建失败时 sync/async 错误行为一致；重复调用幂等性）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（同步版本仅包含 API 适配层，核心业务逻辑仅出现一次）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：上游依赖 C4 `audit-ipc-result-unification`）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件 | 计划用例名 / 断言块 |
| ----------- | --- | --- |
| AUD-C6-S1 | `apps/desktop/main/src/__tests__/unit/contextfs-async-ssot.test.ts` | `ensureCreonowDirStructureAsync should create complete .creonow directory structure` |
| AUD-C6-S2 | `apps/desktop/main/src/__tests__/contract/contextfs-sync-async-parity.test.ts` | `sync ensureCreonowDirStructure should produce identical structure as async version` |
| AUD-C6-S3 | `apps/desktop/main/src/__tests__/unit/contextfs-async-ssot.test.ts` | `getCreonowDirStatusAsync should return correct directory status` |
| AUD-C6-S4 | `apps/desktop/main/src/__tests__/contract/contextfs-sync-async-parity.test.ts` | `sync getCreonowDirStatus should return identical result as async version` |
| AUD-C6-S5 | `apps/desktop/main/src/__tests__/unit/contextfs-async-ssot.test.ts` | `sync and async should return same error semantics on unwritable path` |
| AUD-C6-S6 | `apps/desktop/main/src/__tests__/unit/contextfs-async-ssot.test.ts` | `ensureCreonowDirStructureAsync should be idempotent on existing directory` |
| AUD-C6-S7 | `apps/desktop/main/src/__tests__/unit/contextfs-async-ssot.test.ts` | `contextFs should contain single business logic (no duplicated mkdir/stat sequences)` |

## 3. Red（先写失败测试）

- [ ] 3.1 **异步 SSOT 基线**：调用 `ensureCreonowDirStructureAsync(projectPath)`，断言创建完整 `.creonow` 子目录结构（AUD-C6-S1）
- [ ] 3.2 **sync/async 一致性（结构）**：分别调用 sync 和 async 版本，断言产出的目录结构完全相同（AUD-C6-S2）
- [ ] 3.3 **异步状态查询**：调用 `getCreonowDirStatusAsync`，断言返回正确的目录存在/缺失状态（AUD-C6-S3）
- [ ] 3.4 **sync/async 一致性（状态）**：同一路径分别调用 sync 和 async 状态查询，断言返回值严格相等（AUD-C6-S4）
- [ ] 3.5 **错误语义一致**：在不可写路径上分别调用 sync 和 async，断言两者抛出/reject 的错误具有相同的 code 和 message 模式（AUD-C6-S5）
- [ ] 3.6 **幂等性**：对已存在的目录重复调用 `ensureCreonowDirStructureAsync`，断言不报错且目录内容不变（AUD-C6-S6）
- [ ] 3.7 **单一业务逻辑验证**：AST 或源码扫描 contextFs.ts，断言 `mkdir` / `stat` 调用序列仅出现一次（在异步实现中），sync 版本不含独立的 mkdir/stat 序列（AUD-C6-S7）

## 4. Green（最小实现通过）

- [ ] 4.1 提取 async 版本中的目录结构定义（路径列表、创建顺序）为纯数据常量或共享配置函数
- [ ] 4.2 重写 sync 版本为薄包装：调用共享配置函数获取目录列表，再用 `fs.mkdirSync` 逐个创建（业务逻辑不重复）
- [ ] 4.3 同理重写 `getCreonowDirStatus` sync 版本，调用共享纯逻辑后用 `fs.statSync` 适配
- [ ] 4.4 删除 sync 版本中原有的重复 mkdir/stat 调用序列

## 5. Refactor（保持绿灯）

- [ ] 5.1 将目录结构定义（`.creonow` 下的子目录清单）抽取为 `CREONOW_DIR_STRUCTURE` 常量，sync/async 共用
- [ ] 5.2 评估 sync wrapper 是否保持当前的 sync fs API + 共享配置模式（推荐），避免使用 `execSync` + async 函数的反模式
- [ ] 5.3 确保重构后无多余的 fs import（如同时 import `fs` 和 `fs/promises` 时各自仅用其必要 API）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
