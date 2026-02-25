# IPC Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-type-contract-alignment

### Requirement: 生产代码 `as unknown as` 强转必须清零或白名单化 [ADDED]

生产代码中 17 处 `as unknown as` 类型强转**必须**通过统一 IPC 响应类型定义来消除。无法消除的强转必须建立白名单并附理由。

#### Scenario: AUD-C8-S1 IPC 桥接类型与 renderer 期望类型一致 [ADDED]

- **假设** `preload/src/ipc.ts` 的 IPC 桥接层已统一类型定义
- **当** renderer 组件通过 IPC 桥接调用后端服务
- **则** 返回值类型与 renderer 期望类型直接匹配
- **并且** `preload/src/ipc.ts:22` 不再需要 `as unknown as` 强转

#### Scenario: AUD-C8-S2 ProxySection/AiSettingsSection 消除强转 [ADDED]

- **假设** C7 已完成 ProxySettings 类型统一
- **当** `ProxySection.tsx` 和 `AiSettingsSection.tsx` 接收 IPC 响应
- **则** 响应类型与组件期望类型直接匹配
- **并且** `ProxySection.tsx:77/:94/:155` 和 `AiSettingsSection.tsx:54/:116` 的 5 处强转全部消除

#### Scenario: AUD-C8-S3 deriveOutline 类型契约对齐 [ADDED]

- **假设** 大纲推导的输入/输出类型已统一定义
- **当** `deriveOutline.ts` 执行类型转换
- **则** 不再需要 `as unknown as` 强转
- **并且** `:107`、`:162`、`:235` 三处强转全部消除或白名单化并附理由

#### Scenario: AUD-C8-S4 ipcAcl 类型契约对齐 [ADDED]

- **假设** ACL 类型定义已与 IPC 层统一
- **当** `ipcAcl.ts` 执行权限检查
- **则** `:33` 处不再需要 `as unknown as` 强转

#### Scenario: AUD-C8-S5 白名单强转必须附理由 [ADDED]

- **假设** 存在技术上无法消除的强转（如第三方库类型不兼容）
- **当** 该强转被保留
- **则** 必须在白名单文件中登记并附技术理由
- **并且** 白名单外不存在任何 `as unknown as`（生产代码）

### Requirement: IpcInvoke 类型必须统一为共享定义 [ADDED]

8 个 store 文件中完全相同的 `IpcInvoke` 类型定义**必须**抽取到 `renderer/src/lib/ipcTypes.ts`，所有 store 统一 import。

#### Scenario: AUD-C8-S6 IpcInvoke 共享类型抽取 [ADDED]

- **假设** `renderer/src/lib/ipcTypes.ts` 已创建并导出 `IpcInvoke` 类型
- **当** 8 个 store 文件（`kgStore.ts`、`memoryStore.ts`、`editorStore.tsx`、`fileStore.ts`、`projectStore.tsx`、`aiStore.ts`、`versionStore.tsx`、`searchStore.ts`）引用 `IpcInvoke`
- **则** 全部从 `renderer/src/lib/ipcTypes.ts` import
- **并且** 各 store 文件中不再包含本地 `IpcInvoke` 类型定义

#### Scenario: AUD-C8-S7 tsc --noEmit 全量通过 [ADDED]

- **假设** 所有类型契约对齐与 IpcInvoke 统一完成
- **当** 执行 `tsc --noEmit` 全量类型检查
- **则** 零错误通过
- **并且** 不引入新的类型抑制注释

#### Scenario: AUD-C8-S8 静态扫描确认强转清零 [ADDED]

- **假设** 重构完成后
- **当** 对生产代码执行 `rg "as unknown as"` 扫描
- **则** 匹配数为零或仅匹配白名单中登记的条目
- **并且** 白名单条目数不超过合理上限（建议 ≤ 3）
