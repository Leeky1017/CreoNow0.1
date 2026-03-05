# CN 统一路线图：代码治理 + 功能建设

更新时间：2026-03-05 12:00

> 整合 `CN-Code-Audit-2026-02-14`（代码质量审计）与 `docs/plans/archive/audit-roadmap.md`（AI Native 功能路线图）。
> 创建时间：2026-02-14
> 前置完成：audit-roadmap Phase 1（7 changes，已合并）
> 总 Changes：62 | 串行工量：~43d | 2 并行流壁钟：~22d

## 来源映射

| 来源 | 缩写 | 说明 |
|------|------|------|
| CN-Code-Audit-2026-02-14 | `CC-` | 代码质量/安全/架构/健壮性/可维护性治理 |
| audit-roadmap Phase 2-6 | `AR-` | AI Native 功能建设（Phase 1 已完成） |

## 执行原则

1. **Same-File Batching**：触碰文件时同时修复该文件所有已知问题
2. **Extract-Then-Extend**：不在 God Object 上加功能；先提取子服务，再在提取物上加功能
3. **Automated Ratchet**：每修一类问题立即加 lint/CI 规则防回退
4. **依赖驱动排序**：每个 Sprint 的产出恰好解锁下一个 Sprint

## 重构防线：12 类 AI 代码问题防治

> 来源：`docs/代码问题/` 目录下 12 份问题报告。
> 本节为 **硬约束**——每个 change 的执行者必须在提交前逐条自检对应风险项。违反等同于交付失败。

### 危害分级与高风险 Sprint 映射

| # | 问题 | 危害 | 高风险 Sprint/Change | 标签 |
|---|------|------|---------------------|------|
| P01 | 静默失败与表面正确 | ★★★★★ | S0 全部, S1-scheduler-error-ctx, S2-store-race-fix | `SILENT` |
| P02 | 安全漏洞与输入校验缺失 | ★★★★★ | S0-sandbox-enable, S1-ipc-acl, S2-debug-channel-gate | `SECURITY` |
| P03 | 过度防御性降级与保守回退 | ★★★★ | S0-metadata-failfast, S0-context-observe, S0-skill-loader-error | `FALLBACK` |
| P04 | 重构回避与只增不改 | ★★★★ | S1 全部提取类 change, S2-service-error-decouple | `ADDONLY` |
| P05 | 虚假测试覆盖率 | ★★★★ | S0/S1 所有含测试的 change, S2-story-assertions, S2-test-timing-fix | `FAKETEST` |
| P06 | 架构退化与单体回归 | ★★★★ | S1-doc/ai/kg-service-extract, S1-context-ipc-split | `MONOLITH` |
| P07 | Bug 重现与跨会话错误传播 | ★★★★ | 全部 Sprint（跨会话执行时） | `RECUR` |
| P08 | 辅助函数滥用与过度抽象 | ★★★ | S1 提取类 change, S2 新建文件类 change | `OVERABS` |
| P09 | 重复链路与冗余逻辑 | ★★★ | S1 提取类, S2-type-convergence, S2-judge-hook | `DUP` |
| P10 | 幽灵 Bug 与边界过度处理 | ★★★ | S0-kg-async-validate, S0-metadata-failfast | `GHOST` |
| P11 | 风格漂移与项目约定偏离 | ★★★ | S1-path-alias, S2/S3 全部新建 UI 组件 | `DRIFT` |
| P12 | 注释泛滥与噪音代码 | ★★ | 全部 Sprint | `NOISE` |

### 逐项防治规则

#### P01 — 静默失败与表面正确 `SILENT` ★★★★★

**核心风险**：代码不报错、测试通过，但结果是错的。AI 遇到困难时会伪造格式正确但内容错误的返回值；会删除安全检查来"修复"报错；会用短路 return 跳过真实逻辑。

**硬性规则**：
1. **禁止通过删除/绕过检查来消除报错** — 修复必须说明根因，不得删除 guard clause
2. **所有异步操作必须有完成确认** — `await` 后检查返回值，不得 fire-and-forget（`void promise` 除外且须有 `.catch`）
3. **关键路径端到端验证** — 文件保存、AI 调用、IPC 通信不能只断言"函数返回成功"，必须验证"结果落地"
4. **禁止伪造输出** — 遇到无法完成的操作必须返回错误，不得返回格式正确的空壳数据

**自检命令**：
```bash
# 搜索可疑的短路 return（函数开头就 return 默认值）
grep -rn "return { ok: true" apps/desktop/main/src/ | head -20
# 搜索 void promise（fire-and-forget）
grep -rn "void .*\." apps/desktop/main/src/ --include="*.ts" | grep -v "\.catch" | head -20
```

**关联 change**：`s0-fake-queued-fix`（直接修复伪造输出）, `s0-context-observe`（修复静默吞错）, `s1-scheduler-error-ctx`（修复丢弃错误细节）

---

#### P02 — 安全漏洞与输入校验缺失 `SECURITY` ★★★★★

**核心风险**：AI 默认不做输入校验。Electron 主进程有系统级权限，IPC 通道是攻击面。

**硬性规则**：
1. **IPC 消息必须在主进程侧做参数校验** — 不信任渲染进程传入的任何数据
2. **文件路径操作必须限制在沙盒目录内** — 使用 `path.resolve` + 白名单前缀校验，防止路径穿越
3. **错误信息不得包含系统路径、API Key、内部配置**
4. **新增依赖必须经过 Owner 批准** — 禁止自行引入 `package.json` 中不存在的库
5. **sandbox: true 必须保持** — S0 启用后任何后续 change 不得回退

**关联 change**：`s0-sandbox-enable`, `s1-ipc-acl`, `s2-debug-channel-gate`

---

#### P03 — 过度防御性降级与保守回退 `FALLBACK` ★★★★

**核心风险**：AI 代码充满 `catch { return null/[] }` 和 `?? {}`，错误被吞掉，问题被掩盖。

**硬性规则**：
1. **禁止空的 catch 块** — 每个 catch 必须至少有 `logger.warn/error` 记录
2. **禁止无条件 fallback 到默认值** — `|| ''` 和 `?? {}` 必须有注释说明为什么这里可以安全降级
3. **降级逻辑必须有 Owner 设计** — 只有 spec 中明确定义的降级策略才允许 fallback（如 AI Provider 容错的 ONNX → API → hash）
4. **Fail loud, not silent** — 宁可报错让人知道，也不要静默糊弄

**自检命令**：
```bash
# 搜索空 catch 块
grep -rn "catch.*{" apps/desktop/ --include="*.ts" -A1 | grep -B1 "return \[\]\|return null\|return {}\|return ''" | head -20
# 搜索可疑的 fallback
grep -rn "?? {}\|?? \[\]\||| ''" apps/desktop/ --include="*.ts" | head -20
```

**关联 change**：`s0-metadata-failfast`, `s0-skill-loader-error`, `s0-context-observe`

---

#### P04 — 重构回避与只增不改 `ADDONLY` ★★★★

**核心风险**：AI 不删旧代码，只在上面堆叠。文件只增不减。修 bug 用 `if` 绕过而非修根因。

**硬性规则**：
1. **提取 = 剪切 + 粘贴，不是复制 + 粘贴** — 子服务提取后，原文件中的对应代码必须删除，不得保留注释版
2. **禁止注释掉代码来替代删除** — `// old code...` 直接删除，git 有历史
3. **PR diff 中 deletion 行数应 ≥ addition 的 30%**（提取类 change 除外，但门面文件应大幅缩减）
4. **补丁式修复必须说明为什么不修根因** — 如果外层包 `if` 是临时方案，必须关联 issue

**自检**：提交前 `git diff --stat` 检查删除行数占比。

**关联 change**：S1 全部提取类 change（`s1-doc-service-extract`, `s1-ai-service-extract`, `s1-kg-service-extract`, `s1-context-ipc-split`）

---

#### P05 — 虚假测试覆盖率 `FAKETEST` ★★★★

**核心风险**：AI 写的测试只测 happy path，断言浅薄（`toBeDefined`），过度 mock 导致什么都没测到。

**硬性规则**：
1. **每个测试必须包含至少一个错误路径断言** — 不得只有 happy path
2. **禁止浅层断言** — `toBeDefined()`、`toBeTruthy()` 不算有效断言，必须检查具体值或行为
3. **测试必须按 spec/需求写，不是按代码逻辑写** — 避免 AI 写代码 → AI 写测试 → 循环自证
4. **mock 必须有边界** — mock 的是外部依赖（DB、网络、文件系统），不是被测模块的内部逻辑
5. **异步测试禁止 `setTimeout(resolve, N)`** — 使用 `waitFor`/条件轮询/事件等待

**自检命令**：
```bash
# 搜索浅层断言
grep -rn "toBeDefined()\|toBeTruthy()\|not.toBeNull()" apps/desktop/ --include="*.test.*" | wc -l
# 搜索 setTimeout 驱动的测试
grep -rn "setTimeout(resolve" apps/desktop/ --include="*.test.*" | wc -l
```

**关联 change**：`s2-story-assertions`, `s2-test-timing-fix`，以及所有含 "写测试" 步骤的 change

---

#### P06 — 架构退化与单体回归 `MONOLITH` ★★★★

**核心风险**：AI 不遵守分层架构，跨层直接引用，God Object 膨胀，循环依赖。

**硬性规则**：
1. **渲染进程不得直接访问文件系统** — 所有 fs 操作通过 IPC
2. **UI 组件不得直接 import service 层** — 通过 store 或 IPC 中转
3. **单个文件 ≤ 300 行**（新建文件硬限制；存量文件只减不增）
4. **提取后的门面文件必须只做委托** — `documentService.ts` 重构后不得包含业务逻辑，只做方法转发
5. **每次提交后跑 `npx madge --circular`** — 不得引入新的循环依赖

**自检命令**：
```bash
# 检查循环依赖
npx madge --circular apps/desktop/main/src/ 2>/dev/null | head -20
# 检查大文件
find apps/desktop/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20
```

**关联 change**：`s1-break-context-cycle`, `s1-break-panel-cycle`, `s1-doc/ai/kg-service-extract`, `s1-context-ipc-split`

---

#### P07 — Bug 重现与跨会话错误传播 `RECUR` ★★★★

**核心风险**：AI 无跨会话记忆。上次修好的问题下次又犯。修 A 时搞坏 B。

**硬性规则**：
1. **开始任何 change 前必须先读 `AGENTS.md`** — 确认已知约定和禁令
2. **每修一个 bug，立即在 PR 评论中记录根因和修复方式**
3. **修复后必须跑全量测试** — 不能只跑改动文件的测试
4. **交付证据通过 PR 评论 + CI 日志记录** — 落盘防失忆
5. **本路线图的 "踩坑提醒" 段落是跨会话记忆的核心载体** — 执行者必须阅读

**自动化门禁**：CI 的 `ci` + `merge-serial` 门禁确保质量基线。

---

#### P08 — 辅助函数滥用与过度抽象 `OVERABS` ★★★

**核心风险**：AI 把一行逻辑包成函数，创建 `utils.ts`/`helpers.ts` 垃圾抽屉文件，过早抽象。

**硬性规则**：
1. **三次法则** — 逻辑被使用 ≥3 次才值得抽取为独立函数
2. **禁止创建 `utils.ts`/`helpers.ts`/`common.ts`** — 工具函数按领域放入对应模块的 `utils/` 子目录，文件名必须语义化（如 `formatEntity.ts`）
3. **一行包装函数直接内联** — `function getX() { return a.x }` 不应存在
4. **抽象层不得超过 3 层** — A→B→C 可以，A→B→C→D→E 需要 Owner 审批

**关联 change**：S1 提取类 change（确保提取的是真正的独立职责，不是过度拆分）

---

#### P09 — 重复链路与冗余逻辑 `DUP` ★★★

**核心风险**：AI 重新发明轮子。项目已有 `formatDate()`，AI 又写一个 `convertDate()`。

**硬性规则**：
1. **写新函数前必须先搜索项目中已有的类似实现** — `grep -rn "functionName\|类似关键词" apps/`
2. **类型定义必须单源** — 每个业务类型只在一处定义（S1 提取的 `types.ts`），其他地方 import
3. **错误处理模式统一** — 全项目使用 `ServiceResult<T>` 模式，不混用 throw/try-catch/Result
4. **提取类 change 完成后必须搜索全库确认无残留副本**

**自检命令**：
```bash
# 搜索可能的重复类型定义
grep -rn "export type.*=\|export interface" apps/desktop/ --include="*.ts" | sort -t: -k3 | head -40
```

**关联 change**：`s2-type-convergence`, `s2-judge-hook`, `s2-service-error-decouple`

---

#### P10 — 幽灵 Bug 与边界过度处理 `GHOST` ★★★

**核心风险**：AI 为不存在的场景写防御代码。TypeScript 已约束类型仍做运行时检查。

**硬性规则**：
1. **依赖类型系统做编译时保证** — TypeScript 已有的类型约束不做运行时重复检查
2. **每个 `if` 防御检查必须能说明"这个条件在什么真实场景下为 true"** — 说不出来就删掉
3. **禁止对枚举穷举后再加 `else throw "impossible"`** — 用 TypeScript exhaustive check（`never` 类型）
4. **单线程环境不写多线程锁逻辑**

**关联 change**：`s0-kg-async-validate`（注意不要在修复异步校验时加入不必要的幽灵边界）

---

#### P11 — 风格漂移与项目约定偏离 `DRIFT` ★★★

**核心风险**：AI 不遵循项目编码风格。命名不一致，文件组织混乱，引入项目不用的库。

**硬性规则**：
1. **必须遵循 `docs/references/naming-conventions.md`** — 命名规范已外部化
2. **必须遵循 `docs/references/file-structure.md`** — 文件组织规则已外部化
3. **新建 UI 组件必须参照 `design/system/` 下的设计规范**
4. **错误处理风格统一为 `ServiceResult<T>`**（后端）和 store error state（前端）
5. **ESLint + Prettier 保存时自动执行** — 提交前 `pnpm lint` 必须通过

**关联 change**：`s1-path-alias`（统一 import 风格）, S2/S3 全部新建 UI 组件

---

#### P12 — 注释泛滥与噪音代码 `NOISE` ★★

**核心风险**：AI 在每行旁边写翻译式注释。TODO 泛滥。过时注释变成谎言。

**硬性规则**：
1. **代码应当自解释** — 注释只用于解释"为什么这样做"（意图/业务原因），不解释"做了什么"
2. **禁止逐行翻译式注释** — `// 设置变量 x 为 5` 直接删除
3. **TODO 必须关联 Issue** — `// TODO(#123): ...`，无 Issue 号的 TODO 禁止提交
4. **提取/重构时不得保留旧注释块** — 代码移动后，注释必须同步更新或删除
5. **不得添加/删除原有注释** — 除非该注释与本次修改直接相关（AGENTS.md P1 已有此规则）

### 防治标签使用说明

每个 Sprint change 的 **踩坑提醒** 段落末尾，标注该 change 的高风险标签，格式：

```
**防治标签**：`SILENT` `FALLBACK` `FAKETEST`
```

执行者在提交前，必须对照标签逐条检查对应的防治规则。CI 不能自动检查的规则，由 PR reviewer 人工核查。

---

## Sprint 总览

| Sprint | 主题 | Changes | 串行工量 | 2流壁钟 | 累计(壁钟) |
|--------|------|---------|----------|---------|------------|
| 0 | 紧急止血 | 8 | 3d | 2d | 2d |
| 1 | 架构解锁 | 10 | 9d | 5d | 7d |
| 2 | 交织推进（功能+债务） | 27 | 16.75d | 9d | 16d |
| 3 | 收尾 + 高级功能 | 17 | 14.5d | 7d | 23d |
| **合计** | | **62** | **~43d** | **~23d** | |

---

## Sprint 0 — 紧急止血（8 changes, 3d）

目标：消除所有可导致数据丢失、安全漏洞、启动失败的即时风险。全部是手术刀级小改，无架构变更。

### Changes 列表

| # | Change ID | 来源 | 修复项 | Est |
|---|-----------|------|--------|-----|
| 1 | `s0-fake-queued-fix` | A3-C-001 | 空内容请求伪造 queued → 改 skipped/ok:false | 0.25d |
| 2 | `s0-window-load-catch` | A6-H-001 | 窗口加载 Promise 兜底 | 0.25d |
| 3 | `s0-app-ready-catch` | A6-H-002 | app.whenReady() 链尾加 .catch | 0.25d |
| 4 | `s0-metadata-failfast` | A2-H-002+A2-H-003 | metadata 解析失败禁止清空回写 + KG Panel fail-fast | 0.5d |
| 5 | `s0-skill-loader-error` | A2-H-004 | skillLoader 目录读取返回结构化错误 | 0.25d |
| 6 | `s0-sandbox-enable` | A4-H-001 | 启用 Electron sandbox: true + 回归 | 0.5d |
| 7 | `s0-kg-async-validate` | A6-H-003 | KG Panel 异步写入校验结果 + allSettled | 0.5d |
| 8 | `s0-context-observe` | A2-H-001 | context 组装异常可观测化 | 0.5d |

### 内部依赖关系

```
并行组 A（独立，可同时执行）:
  s0-fake-queued-fix ─── 独立
  s0-window-load-catch ─ 独立
  s0-app-ready-catch ─── 独立
  s0-skill-loader-error ─ 独立
  s0-sandbox-enable ───── 独立

并行组 B（同模块，内部串行）:
  s0-metadata-failfast ──→ s0-kg-async-validate（同触 KG Panel）

并行组 C:
  s0-context-observe ──── 独立
```

执行策略：A 全部并行 → B 串行 → C 并行于 A/B。

### Change 详情

#### s0-fake-queued-fix（A3-C-001）

**证据**：`CN-Code-Audit-2026-02-14/A3-质量陷阱审计.md` L9-L29

**问题**：`kgRecognitionRuntime.ts` L470-L478，`normalizedContentText.length === 0` 时返回 `ok: true` + `randomUUID()` taskId + `status: "queued"`，但实际未入队。调用方误以为任务存在，后续取消/追踪命中不存在的 taskId。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/kg/kgRecognitionRuntime.ts` | MODIFY | L470-L478 |
| `apps/desktop/main/src/services/kg/__tests__/kgRecognitionRuntime.test.ts` | MODIFY | 新增测试用例 |

**具体操作**：
1. **Red** — 在 `kgRecognitionRuntime.test.ts` 新增用例 `"empty content returns skipped, not queued"`：
   - 构造 `enqueueRecognition({ contentText: "", projectId: "p1" })`
   - 断言 `result.ok === true`
   - 断言 `result.data.status === "skipped"`（非 `"queued"`）
   - 断言 `result.data.taskId === null`（非 `randomUUID()` 产生的字符串）
   - 断言 `result.data.queuePosition === 0`
   - 运行 `pnpm vitest run kgRecognitionRuntime` 确认 Red
2. **Green** — 修改 `kgRecognitionRuntime.ts` L470-L478：
   ```ts
   // BEFORE:
   if (normalizedContentText.length === 0) {
     return { ok: true, data: { taskId: randomUUID(), status: "queued", queuePosition: 0 } };
   }
   // AFTER:
   if (normalizedContentText.length === 0) {
     return { ok: true, data: { taskId: null, status: "skipped", queuePosition: 0 } };
   }
   ```
   - 运行测试确认 Green
3. **Refactor** — 运行 `pnpm vitest run` 全量确认无回归；检查调用方是否依赖 `taskId !== null` 做后续操作（搜索 `enqueueRecognition` 调用点）

**踩坑提醒**：`taskId` 改为 `null` 后，下游 `cancelTask(taskId)` 路径需要处理 null 入参，检查 `kgRecognitionRuntime.ts` 中 `cancelTask` 实现是否有 null guard。

**防治标签**：`SILENT` `FAKETEST`

---

#### s0-window-load-catch（A6-H-001）

**证据**：`CN-Code-Audit-2026-02-14/A6-健壮性审计.md` L12-L27

**问题**：`index.ts` L112-L115，`void win.loadURL(...)` / `void win.loadFile(...)` 丢弃 Promise，加载失败时黑屏且无日志。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/index.ts` | MODIFY | L112-L115 |

**具体操作**：
1. **Red** — 在 `apps/desktop/main/src/__tests__/index.test.ts`（如不存在则新建）新增用例 `"loadURL rejection is logged"`：
   - mock `BrowserWindow.prototype.loadURL` 返回 `Promise.reject(new Error("net::ERR_CONNECTION_REFUSED"))`
   - mock `logger.error`
   - 触发窗口创建逻辑
   - 断言 `logger.error` 被调用且包含 `"window_load_failed"` 事件名
2. **Green** — 修改 `index.ts` L112-L115：
   ```ts
   // BEFORE:
   void win.loadURL(process.env.VITE_DEV_SERVER_URL);
   // AFTER:
   win.loadURL(process.env.VITE_DEV_SERVER_URL).catch((err) => {
     logger.error("window_load_failed", { url: process.env.VITE_DEV_SERVER_URL, error: String(err) });
   });
   ```
   对 `win.loadFile(...)` 做同样处理
3. **Refactor** — 运行 E2E `pnpm test:e2e` 确认启动正常

**踩坑提醒**：`loadFile` 分支同样需要 `.catch`，不要只改 dev 分支。两个分支是 if/else，都需要处理。

**防治标签**：`SILENT` `FALLBACK`

---

#### s0-app-ready-catch（A6-H-002）

**证据**：`CN-Code-Audit-2026-02-14/A6-健壮性审计.md` L29-L42

**问题**：`index.ts` L339-L378，`void app.whenReady().then(...)` 无 `.catch`，初始化链任一点抛错成为 unhandled rejection。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/index.ts` | MODIFY | L339-L378 链尾 |

**具体操作**：
1. 在 `app.whenReady().then(...)` 链尾追加：
   ```ts
   .catch((err) => {
     logger.error("app_init_fatal", { error: String(err), stack: err instanceof Error ? err.stack : undefined });
     app.quit();
   });
   ```
2. 移除 `void` 前缀（`.catch` 已兜底，不再是 fire-and-forget）
3. 与 `s0-window-load-catch` 合并为同一 PR（同文件 `index.ts`）
4. 运行 `pnpm test:e2e` 验证启动正常

**踩坑提醒**：`app.quit()` 在 catch 中调用时，如果 app 尚未完成 ready，可能触发额外事件。确认 `app.on('window-all-closed')` 不会干扰退出流程。

**防治标签**：`SILENT` `FALLBACK`

---

#### s0-metadata-failfast（A2-H-002 + A2-H-003）

**证据**：
- `CN-Code-Audit-2026-02-14/A2-行为偏差审计.md` L32-L50（A2-H-002：kgToGraph.ts L228-L243）
- `CN-Code-Audit-2026-02-14/A2-行为偏差审计.md` L53-L70（A2-H-003：KnowledgeGraphPanel.tsx L50-L55, L63-L66）

**问题**：两处 metadata JSON 解析失败后 `metadata = {}`，然后写入 `ui.position` 或 `timeline.order`，覆盖原有 metadata 造成数据丢失。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/features/kg/kgToGraph.ts` | MODIFY | L228-L243 |
| `apps/desktop/renderer/src/features/kg/KnowledgeGraphPanel.tsx` | MODIFY | L50-L55, L63-L66 |
| `apps/desktop/renderer/src/features/kg/__tests__/metadata-parse-failfast.test.ts` | CREATE | |

**具体操作**：
1. **Red** — 创建 `metadata-parse-failfast.test.ts`，两个用例：
   - `"kgToGraph: invalid metadataJson preserves original"` — 传入 `metadataJson = "{{invalid"` + `position = {x:1,y:2}`，断言返回值 === 原始 `metadataJson`（未被覆盖为 `{"ui":{"position":{...}}}`）
   - `"KnowledgeGraphPanel: parseMetadataJson returns null on invalid JSON"` — 传入 `"not-json"`，断言返回 `null`（非 `{}`）
2. **Green — kgToGraph.ts** L228-L243：
   ```ts
   // BEFORE:
   try { metadata = JSON.parse(currentMetadataJson) as Record<string, unknown>; }
   catch { metadata = {}; }
   // AFTER:
   try { metadata = JSON.parse(currentMetadataJson) as Record<string, unknown>; }
   catch {
     console.warn("[kgToGraph] metadata parse failed, preserving original", { metadataJson: currentMetadataJson.slice(0, 100) });
     return currentMetadataJson; // 不做写入，原样返回
   }
   ```
3. **Green — KnowledgeGraphPanel.tsx** L50-L55 + L63-L66：
   ```ts
   // BEFORE:
   function parseMetadataJson(metadataJson: string): Record<string, unknown> {
     try { return JSON.parse(metadataJson) as Record<string, unknown>; }
     catch { return {}; }
   }
   // AFTER:
   function parseMetadataJson(metadataJson: string): Record<string, unknown> | null {
     try { return JSON.parse(metadataJson) as Record<string, unknown>; }
     catch { return null; }
   }
   ```
   所有调用方增加 null 检查：`const metadata = parseMetadataJson(json); if (!metadata) return;`
4. **Refactor** — 搜索 `parseMetadataJson` 的所有调用点（`grep -rn "parseMetadataJson" apps/desktop/renderer/`），确认每处都处理了 null 返回

**踩坑提醒**：`parseMetadataJson` 返回类型从 `Record<string, unknown>` 改为 `Record<string, unknown> | null`，TypeScript 会在所有调用方报错，利用编译器找到所有需要修改的位置。

**防治标签**：`SILENT` `FALLBACK` `GHOST` `FAKETEST`

---

#### s0-skill-loader-error（A2-H-004）

**证据**：`CN-Code-Audit-2026-02-14/A2-行为偏差审计.md` L72-L90

**问题**：`skillLoader.ts` L125-L135，`listSubdirs` catch 中 `return []`，权限错误/路径不存在表现为"没有技能"。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/skills/skillLoader.ts` | MODIFY | L125-L135 |
| `apps/desktop/main/src/services/skills/__tests__/skillLoader.test.ts` | MODIFY | 新增用例 |

**具体操作**：
1. **Red** — 在 `skillLoader.test.ts` 新增用例 `"listSubdirs returns structured error when directory does not exist"`：
   - 传入不存在的路径 `/tmp/nonexistent-skill-dir-${Date.now()}`
   - 断言返回 `{ dirs: [], error: { code: "ENOENT", path: expect.stringContaining("nonexistent") } }`
2. **Green** — 修改 `skillLoader.ts` L125-L135：
   ```ts
   // BEFORE:
   function listSubdirs(dirPath: string): string[] {
     try { ... return subdirs; }
     catch { return []; }
   }
   // AFTER:
   function listSubdirs(dirPath: string): { dirs: string[]; error?: { code: string; path: string } } {
     try { ... return { dirs: subdirs }; }
     catch (err) {
       const code = err instanceof Error && "code" in err ? (err as NodeJS.ErrnoException).code ?? "UNKNOWN" : "UNKNOWN";
       logger.warn("skill_dir_read_failed", { path: dirPath, code });
       return { dirs: [], error: { code, path: dirPath } };
     }
   }
   ```
3. 修改 `listSubdirs` 的所有调用方（在同文件内搜索），从 `const dirs = listSubdirs(...)` 改为 `const { dirs, error } = listSubdirs(...)`；如果 `error` 存在，将其透传到上层返回值
4. 运行 `pnpm vitest run skillLoader` 确认 Green + 无回归

**踩坑提醒**：`listSubdirs` 返回类型变化是 breaking change，同文件内有 2-3 处调用（`loadBuiltinSkills` 和 `loadUserSkills`），全部需要适配。搜索 `listSubdirs(` 确认完整。

**防治标签**：`FALLBACK` `FAKETEST`

---

#### s0-sandbox-enable（A4-H-001）

**证据**：`CN-Code-Audit-2026-02-14/A4-安全与规范审计.md` L12-L28

**问题**：`index.ts` L104-L108，`webPreferences.sandbox` 显式为 `false`，渲染层出现 XSS/依赖链污染时主进程边界保护减弱。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/index.ts` | MODIFY | L104-L108：`sandbox: false` → `sandbox: true` |
| `apps/desktop/preload/src/ipcGateway.ts` | VERIFY | 确认在 sandbox 模式下 contextBridge 正常 |
| E2E 测试 | RUN | 全量回归 |

**具体操作**：
1. 修改 `index.ts` L107：`sandbox: false` → `sandbox: true`
2. 运行 `pnpm test:e2e` 全量回归
3. 如果 E2E 有失败：
   - 最可能的原因是 preload 脚本中使用了 sandbox 不允许的 Node.js API（如 `require`、`fs`、`path`）
   - 检查 `apps/desktop/preload/src/` 下所有文件，确认只通过 `contextBridge.exposeInMainWorld` 暴露 API
   - 检查 `ipcGateway.ts` 是否有直接 `require` 调用
4. 增加 E2E 断言：在窗口创建后通过 `win.webContents.getProcessId()` 确认渲染进程是 sandboxed

**踩坑提醒**：sandbox 模式下 preload 脚本的 `require` 行为改变——只能 require Electron 模块（`electron`），不能 require Node.js 内建模块。如果 preload 中有 `import path from "node:path"` 之类的用法，需要改为通过 IPC 从 main 进程获取，或在 preload 构建时 bundle 进去。审查 `apps/desktop/preload/src/` 的所有 import 语句。

**防治标签**：`SECURITY` `FAKETEST`

---

#### s0-kg-async-validate（A6-H-003）

**证据**：`CN-Code-Audit-2026-02-14/A6-健壮性审计.md` L44-L67

**问题**：`KnowledgeGraphPanel.tsx` 三处异步调用未检查 `ServiceResult.ok`：
- L219-L223：`relationDelete` 后直接 `setEditing({ mode: "idle" })`
- L325-L331：`entityUpdate` 后直接 `saveKgViewPreferences`
- L347-L367：`Promise.all(orderedIds.map(entityUpdate))` 无部分失败处理

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/features/kg/KnowledgeGraphPanel.tsx` | MODIFY | L219-L223, L325-L331, L347-L367 |
| `apps/desktop/renderer/src/features/kg/__tests__/kg-async-validation.test.tsx` | CREATE | |

**具体操作**：
1. **Red** — 创建 `kg-async-validation.test.tsx`，三个用例：
   - `"relationDelete failure does not clear editing state"` — mock `relationDelete` 返回 `{ ok: false, error: { code: "DB_ERROR" } }`，断言 `editing.mode` 仍为修改前的值
   - `"entityUpdate failure does not save view preferences"` — mock `entityUpdate` 返回 ok:false，断言 `saveKgViewPreferences` 未被调用
   - `"batch entityUpdate partial failure reports errors"` — mock 3 个 entityUpdate 其中 1 个失败，断言 UI 显示错误提示且成功的 2 个正常更新
2. **Green — L219-L223**：
   ```ts
   // BEFORE:
   await relationDelete({ relationId });
   if (editing.mode === "relation" && editing.relationId === relationId) {
     setEditing({ mode: "idle" });
   }
   // AFTER:
   const delResult = await relationDelete({ relationId });
   if (!delResult.ok) { showError("关系删除失败"); return; }
   if (editing.mode === "relation" && editing.relationId === relationId) {
     setEditing({ mode: "idle" });
   }
   ```
3. **Green — L325-L331**：同理，`entityUpdate` 返回值检查后才执行 `saveKgViewPreferences`
4. **Green — L347-L367**：`Promise.all` → `Promise.allSettled`，收集 rejected 结果：
   ```ts
   const results = await Promise.allSettled(orderedIds.map(...));
   const failures = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok));
   if (failures.length > 0) {
     showError(`${failures.length}/${orderedIds.length} 个实体更新失败`);
   }
   ```
5. 运行测试确认 Green

**踩坑提醒**：`showError` 可能不存在，需确认 KnowledgeGraphPanel 中的错误提示机制——搜索已有的 toast/notification 调用方式（可能是 `useToast` 或 `setError` state）。不要自创错误提示机制，复用现有的。

**防治标签**：`SILENT` `GHOST` `DUP` `FAKETEST`

---

#### s0-context-observe（A2-H-001）

**证据**：`CN-Code-Audit-2026-02-14/A2-行为偏差审计.md` L12-L30

**问题**：`skillExecutor.ts` L250-L261，context 组装异常被空 `catch {}` 吞掉，仅有注释 `// Context is best-effort`，无日志无告警，真实故障不可观测。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/skills/skillExecutor.ts` | MODIFY | L250-L261 |
| `apps/desktop/main/src/services/skills/__tests__/skillExecutor.test.ts` | MODIFY | 新增用例 |

**具体操作**：
1. **Red** — 在 `skillExecutor.test.ts` 新增用例 `"context assembly failure emits structured warning"`：
   - mock `assembleContextPrompt` 抛出 `new Error("KG_UNAVAILABLE")`
   - 执行技能
   - 断言 `logger.warn` 被调用，参数包含：
     - 事件名 `"context_assembly_degraded"`
     - `executionId`（当前执行 ID）
     - `skillId`（当前技能 ID）
     - `error` 包含 `"KG_UNAVAILABLE"`
   - 断言技能仍然正常执行（降级但不中断）
2. **Green** — 修改 `skillExecutor.ts` L254-L256：
   ```ts
   // BEFORE:
   } catch {
     // Context is best-effort — skill runs without it
   }
   // AFTER:
   } catch (err) {
     logger.warn("context_assembly_degraded", {
       executionId,
       skillId: args.skillId,
       error: err instanceof Error ? err.message : String(err),
     });
     // Context is best-effort — skill runs without it
   }
   ```
3. 运行 `pnpm vitest run skillExecutor` 确认 Green

**踩坑提醒**：`logger` 在 `skillExecutor` 中的注入方式——检查函数签名中是否有 `logger` 参数（可能通过 `deps.logger` 或闭包捕获）。如果没有 logger 参数，需要从构造函数/工厂函数的 deps 中获取。搜索同文件中已有的 `logger.` 调用确认注入路径。

**防治标签**：`SILENT` `FALLBACK` `FAKETEST`

---

## Sprint 1 — 架构解锁（10 changes, 9d）

目标：打碎结构性瓶颈，建立基础设施，为 Sprint 2 的功能开发创造洁净空间。

### Changes 列表

| # | Change ID | 来源 | 修复项 | Est |
|---|-----------|------|--------|-----|
| 9 | `s1-break-context-cycle` | A5-C-001 | 打断 Context 装配链路循环依赖 | 1d |
| 10 | `s1-ipc-acl` | A4-H-002 | IPC 调用方身份与来源 ACL 鉴权 | 1.5d |
| 11 | `s1-path-alias` | A7-H-007+A7-H-008 | tsconfig paths alias 设置 + 批量替换 | 1d |
| 12 | `s1-break-panel-cycle` | A5-H-001 | RightPanel / AiPanel 循环依赖拆解 | 0.5d |
| 13 | `s1-runtime-config` | A7-H-009~012 | 运行时治理配置中心 | 1d |
| 14 | `s1-doc-service-extract` | A7-C-001+A5-H-002 | DocumentService 子服务接口设计 + 首轮提取 | 1d |
| 15 | `s1-ai-service-extract` | A7-C-002+A5-H-003 | AiService 子服务接口设计 + 首轮提取 | 1d |
| 16 | `s1-kg-service-extract` | A7-C-003 | KGService 子服务接口设计 + 首轮提取 | 1d |
| 17 | `s1-context-ipc-split` | A7-C-004 | registerContextIpcHandlers 拆分 | 0.5d |
| 18 | `s1-scheduler-error-ctx` | A3-H-001+A6-M-004 | skillScheduler 聚合 response/completion + 保留错误上下文 | 0.5d |

### 内部依赖关系

```
s1-break-context-cycle ──┐
                         ├──→ s1-context-ipc-split（依赖循环打断后才能拆 IPC）
                         │
s1-path-alias ───────────┤ （独立，可与任何项并行）
                         │
s1-break-panel-cycle ────┤ （独立）
                         │
s1-ipc-acl ──────────────┤ （独立）
                         │
s1-runtime-config ───────┤ （独立）
                         │
s1-doc-service-extract ──┤ （独立，但建议在 path-alias 之后）
s1-ai-service-extract ───┤ （独立，但建议在 path-alias 之后）
s1-kg-service-extract ───┤ （独立，但建议在 path-alias 之后）
                         │
s1-scheduler-error-ctx ──┘ （独立）
```

推荐执行顺序：
1. **并行 Wave 1**：`s1-path-alias` + `s1-break-context-cycle` + `s1-break-panel-cycle` + `s1-scheduler-error-ctx`
2. **并行 Wave 2**：`s1-ipc-acl` + `s1-runtime-config` + `s1-context-ipc-split`
3. **并行 Wave 3**：`s1-doc-service-extract` + `s1-ai-service-extract` + `s1-kg-service-extract`

### Change 详情

#### s1-break-context-cycle（A5-C-001）

**证据**：`CN-Code-Audit-2026-02-14/A5-架构合规审计.md` L9-L22

**问题**：`layerAssemblyService.ts` L6-L8 导入三个 fetcher；fetcher 反向 import `layerAssemblyService` 导出的类型（`ContextLayerChunk`、`ContextRuleConstraint` 等）；`retrievedFetcher` 还 import `rulesFetcher` 的 `formatEntityForContext`，形成三点闭环。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/context/types.ts` | CREATE | 提取共享类型 |
| `apps/desktop/main/src/services/context/utils/formatEntity.ts` | CREATE | 提取纯函数 |
| `apps/desktop/main/src/services/context/layerAssemblyService.ts` | MODIFY | L6-L8 及类型导出 |
| `apps/desktop/main/src/services/context/fetchers/rulesFetcher.ts` | MODIFY | import 路径 |
| `apps/desktop/main/src/services/context/fetchers/retrievedFetcher.ts` | MODIFY | import 路径 |
| `apps/desktop/main/src/services/context/fetchers/settingsFetcher.ts` | MODIFY | import 路径 |

**具体操作**：
1. 先跑 `pnpm tsc --noEmit 2>&1 | head -50` 记录当前编译状态作为基线
2. 创建 `types.ts`：
   - 打开 `layerAssemblyService.ts`，搜索所有被 fetcher 文件 import 的 `export type`（至少包括 `ContextLayerChunk`、`ContextRuleConstraint`、`ContextLayerFetcher`、`ContextAssembleRequest`）
   - 逐一剪切到 `types.ts`，`layerAssemblyService.ts` 改为 `export { ... } from "./types"`（临时 re-export，保持编译通过）
3. 创建 `utils/formatEntity.ts`：
   - 从 `rulesFetcher.ts` 找到 `formatEntityForContext` 函数定义，剪切到新文件
   - `rulesFetcher.ts` 改为 `import { formatEntityForContext } from "../utils/formatEntity"`
   - `retrievedFetcher.ts` 如果 import 了 rulesFetcher 的此函数，同样改路径
4. 修改三个 fetcher 的类型 import：从 `"../layerAssemblyService"` 改为 `"../types"`
5. 移除 `layerAssemblyService.ts` 中的临时 re-export（让直接依赖方改为从 `./types` 导入）
6. 验证：
   - `pnpm tsc --noEmit` 编译通过
   - `npx madge --circular apps/desktop/main/src/services/context/` 确认无环
   - `pnpm vitest run` 全量测试通过

**踩坑提醒**：`layerAssemblyService.ts` 可能有 `export type` 混在 `export function` 中间，需要仔细区分哪些是类型导出（该提取）和哪些是运行时函数导出（留在原处）。使用 `grep -n "export type\|export interface" layerAssemblyService.ts` 列出所有候选。

**防治标签**：`MONOLITH` `ADDONLY` `DUP` `NOISE`

---

#### s1-ipc-acl（A4-H-002）

**证据**：`CN-Code-Audit-2026-02-14/A4-安全与规范审计.md` L30-L46

**问题**：`runtime-validation.ts` L403-L417，handler 执行前只做 schema/envelope 校验，不校验 `event.senderFrame.url`、`webContents.id`、会话角色；preload `allowedChannels` 是白名单但无来源验证。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/ipc/ipcAcl.ts` | CREATE | ACL 模块 |
| `apps/desktop/main/src/ipc/runtime-validation.ts` | MODIFY | L403-L417 |
| `apps/desktop/main/src/ipc/__tests__/ipcAcl.test.ts` | CREATE | |
| `apps/desktop/preload/src/ipcGateway.ts` | MODIFY | |

**具体操作**：
1. 设计 ACL 数据结构（在 `ipcAcl.ts` 中）：
   ```ts
   type ChannelAcl = {
     channel: string;
     allowedOrigins: string[];  // 允许的 senderFrame.url pattern
     requireSandbox: boolean;
   };
   const ACL_MATRIX: ChannelAcl[] = [
     // 高权限通道（db:*, ai:run:*）需严格校验
     // 低权限通道（app:system:ping）可豁免
   ];
   export function validateIpcCaller(channel: string, event: Electron.IpcMainInvokeEvent): { allowed: boolean; reason?: string };
   ```
2. **Red** — 在 `ipcAcl.test.ts` 新增：
   - `"rejects call from unknown origin"` — mock event 的 `senderFrame.url` 为 `"https://evil.com"`，断言 `validateIpcCaller` 返回 `{ allowed: false, reason: "origin_not_allowed" }`
   - `"allows call from app origin"` — mock senderFrame.url 为 `"file://..."` 或 `"http://localhost:*"`
3. **Green** — 实现 `validateIpcCaller`
4. 集成到 `runtime-validation.ts` L403-L417：在 `await runWithTimeout(...)` 前调用 `validateIpcCaller`，不通过时返回 `{ ok: false, error: { code: "FORBIDDEN" } }`
5. E2E 全量回归

**踩坑提醒**：dev 模式下 `senderFrame.url` 是 `http://localhost:5173`（Vite dev server），production 模式是 `file://...`。ACL 白名单需要覆盖两种情况。检查 `process.env.VITE_DEV_SERVER_URL` 来动态构建白名单。

**防治标签**：`SECURITY` `FAKETEST` `DRIFT`

---

#### s1-path-alias（A7-H-007 + A7-H-008）

**证据**：
- `CN-Code-Audit-2026-02-14/A7-可维护性审计.md` L88-L99（A7-H-007：projectService.ts L10）
- `CN-Code-Audit-2026-02-14/A7-可维护性审计.md` L101-L112（A7-H-008：aiStore.ts L10）
- `CN-Code-Audit-2026-02-14/A5-架构合规审计.md` L89-L104（A5-M-002：ipcClient.ts L5，77 个非测试文件命中）

**问题**：818 处 `../../../../../../packages/shared/...` 或 `../../../../../packages/shared/...` 深层相对路径。目录结构微调触发大面积编译失败。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `tsconfig.base.json` | MODIFY | 增加 `paths` |
| `apps/desktop/main/tsconfig.json` | MODIFY | 继承 |
| `apps/desktop/renderer/tsconfig.json` | MODIFY | 继承 |
| `apps/desktop/preload/tsconfig.json` | MODIFY | 继承 |
| `apps/desktop/electron.vite.config.ts` | MODIFY | resolve alias |
| 818 处引用文件 | MODIFY | 批量替换 |

**具体操作**：
1. 在 `tsconfig.base.json` 的 `compilerOptions` 中增加：
   ```json
   "paths": { "@shared/*": ["packages/shared/*"] }
   ```
2. 确认三个子项目 tsconfig 已 `extends` base（如有 `paths` 覆盖则合并）
3. 在 `electron.vite.config.ts` 的 `resolve.alias` 中增加 `"@shared": path.resolve(__dirname, "../../packages/shared")`
4. 编写一次性替换脚本 `scripts/migrate-shared-imports.ts`：
   - 用 `grep -rl "packages/shared/" apps/ packages/` 找到所有文件
   - 对每个文件，用正则 `from ["']\.+/packages/shared/(.+)["']` 替换为 `from "@shared/$1"`
5. 执行脚本，然后 `pnpm tsc --noEmit` 验证
6. `pnpm vitest run` 全量测试
7. 删除一次性脚本（不入库），或保留在 `scripts/` 供审计

**踩坑提醒**：
- `electron.vite.config.ts` 可能有 main/renderer/preload 三个 build 配置，每个都需要加 alias
- 测试文件（`*.test.ts`）中的相对路径也需要替换
- `pnpm-workspace.yaml` 中如果有 `packages/shared` 作为独立 workspace package，则 alias 可能需要用 `workspace:*` 协议配合

**防治标签**：`DRIFT` `DUP` `NOISE`

---

#### s1-break-panel-cycle（A5-H-001）

**证据**：`CN-Code-Audit-2026-02-14/A5-架构合规审计.md` L25-L40

**问题**：`RightPanel.tsx` L8 import `AiPanel`；`AiPanel.tsx` import `useOpenSettings` from `RightPanel`，形成循环。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/contexts/OpenSettingsContext.ts` | CREATE | |
| `apps/desktop/renderer/src/components/layout/RightPanel.tsx` | MODIFY | L8 附近 |
| `apps/desktop/renderer/src/features/ai/AiPanel.tsx` | MODIFY | import 行 |

**具体操作**：
1. 创建 `contexts/OpenSettingsContext.ts`：
   - 从 `RightPanel.tsx` 中找到 `useOpenSettings` 的完整定义（含 Context 创建 + Provider + hook）
   - 剪切到新文件，导出 `OpenSettingsProvider` 和 `useOpenSettings`
2. 修改 `RightPanel.tsx`：删除 `useOpenSettings` 定义，改为 `import { useOpenSettings } from "../../contexts/OpenSettingsContext"`；同时 `export { useOpenSettings }` 保持临时向后兼容
3. 修改 `AiPanel.tsx`：import 改为 `from "../../contexts/OpenSettingsContext"`
4. 搜索全库 `from.*RightPanel.*useOpenSettings`，确认无其他消费方
5. 验证：`npx madge --circular apps/desktop/renderer/src/components/layout/RightPanel.tsx` 无环
6. `pnpm vitest run` 全量测试

**踩坑提醒**：`useOpenSettings` 可能依赖 `RightPanel` 内部的某些 state 或 context（如 `surfaceId`）。提取前先 `grep -n "useOpenSettings\|OpenSettingsContext" apps/desktop/renderer/src/components/layout/RightPanel.tsx` 确认完整依赖链。

**防治标签**：`MONOLITH` `ADDONLY`

---

#### s1-runtime-config（A7-H-009 ~ A7-H-012）

**证据**：
- `CN-Code-Audit-2026-02-14/A7-可维护性审计.md` L114-L125（A7-H-009：ipcGateway.ts L10，`MAX_IPC_PAYLOAD_BYTES = 10 * 1024 * 1024`）
- `CN-Code-Audit-2026-02-14/A7-可维护性审计.md` L127-L140（A7-H-010：aiService.ts L132/L136/L139，`DEFAULT_TIMEOUT_MS/RETRY_BACKOFF_MS/SESSION_TOKEN_BUDGET`）
- `CN-Code-Audit-2026-02-14/A7-可维护性审计.md` L142-L153（A7-H-011：kgService.ts L49，`DEFAULT_QUERY_TIMEOUT_MS = 2_000`）
- `CN-Code-Audit-2026-02-14/A7-可维护性审计.md` L155-L166（A7-H-012：rag.ts L37，`maxTokens: 1500`）

**问题**：四处关键运行时阈值散落硬编码，跨模块预算口径不一致，线上调参困难。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/config/runtimeGovernance.ts` | CREATE | |
| `apps/desktop/main/src/config/__tests__/runtimeGovernance.test.ts` | CREATE | |
| `apps/desktop/main/src/services/ai/aiService.ts` | MODIFY | L132, L136, L139 |
| `apps/desktop/main/src/services/kg/kgService.ts` | MODIFY | L49 |
| `apps/desktop/main/src/ipc/rag.ts` | MODIFY | L37 |
| `apps/desktop/preload/src/ipcGateway.ts` | MODIFY | L10 |

**具体操作**：
1. 创建 `runtimeGovernance.ts`，设计配置表：
   ```ts
   const CONFIG_SCHEMA = {
     "ipc.maxPayloadBytes": { default: 10 * 1024 * 1024, env: "CN_IPC_MAX_PAYLOAD_BYTES", type: "number" },
     "ai.timeoutMs": { default: 10_000, env: "CN_AI_TIMEOUT_MS", type: "number" },
     "ai.retryBackoffMs": { default: [1_000, 2_000, 4_000], env: "CN_AI_RETRY_BACKOFF_MS", type: "number[]" },
     "ai.sessionTokenBudget": { default: 200_000, env: "CN_AI_SESSION_TOKEN_BUDGET", type: "number" },
     "kg.queryTimeoutMs": { default: 2_000, env: "CN_KG_QUERY_TIMEOUT_MS", type: "number" },
     "rag.maxTokens": { default: 1_500, env: "CN_RAG_MAX_TOKENS", type: "number" },
   } as const;
   export function getConfig<K extends keyof typeof CONFIG_SCHEMA>(key: K): ...;
   ```
2. **Red** — 在 `runtimeGovernance.test.ts` 新增用例：
   - `"returns default when env not set"` — 断言 `getConfig("ai.timeoutMs") === 10_000`
   - `"env override takes precedence"` — 设 `process.env.CN_AI_TIMEOUT_MS = "30000"`，断言 `getConfig("ai.timeoutMs") === 30_000`
   - `"invalid env value falls back to default"` — 设 `process.env.CN_AI_TIMEOUT_MS = "not-a-number"`，断言 fallback 到 default
3. **Green** — 实现 `getConfig`
4. 逐文件替换（每改一个跑测试）：
   - `aiService.ts` L132：`const DEFAULT_TIMEOUT_MS = 10_000` → `const DEFAULT_TIMEOUT_MS = getConfig("ai.timeoutMs")`（类似处理 L136, L139）
   - `kgService.ts` L49：`const DEFAULT_QUERY_TIMEOUT_MS = 2_000` → `getConfig("kg.queryTimeoutMs")`
   - `rag.ts` L37：`maxTokens: 1500` → `maxTokens: getConfig("rag.maxTokens")`
   - `ipcGateway.ts` L10：`MAX_IPC_PAYLOAD_BYTES = 10 * 1024 * 1024` → `getConfig("ipc.maxPayloadBytes")`

**踩坑提醒**：`ipcGateway.ts` 在 preload 进程中运行，与 main 进程隔离。preload 中读环境变量的方式可能不同（sandbox 模式下 `process.env` 可能受限）。如果 preload 无法直接读 env，考虑通过 IPC 从 main 获取配置，或在构建时注入。

**防治标签**：`DUP` `OVERABS` `FAKETEST`

---

#### s1-doc-service-extract（A7-C-001 + A5-H-002）

**证据**：
- `CN-Code-Audit-2026-02-14/A7-可维护性审计.md` L9-L20（A7-C-001：documentService.ts L863，`createDocumentService` 1743 行，复杂度 236）
- `CN-Code-Audit-2026-02-14/A5-架构合规审计.md` L42-L55（A5-H-002：documentService.ts L300/L655/L863，同时承载 diff/branch/CRUD/版本合并）

**问题**：`createDocumentService` 1743 行，承载 CRUD + 版本 + 分支 + diff + 合并，单函数变更面极大。

**提取策略**：按职责拆为三个子服务 + 类型文件，原 `documentService.ts` 变为聚合门面保持接口不变。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/documents/types.ts` | CREATE | 共享类型 |
| `apps/desktop/main/src/services/documents/documentCrudService.ts` | CREATE | CRUD 子服务 |
| `apps/desktop/main/src/services/documents/versionService.ts` | CREATE | 版本子服务 |
| `apps/desktop/main/src/services/documents/branchService.ts` | CREATE | 分支子服务 |
| `apps/desktop/main/src/services/documents/documentService.ts` | MODIFY | 变为门面 |

**具体操作**：
1. 创建 `types.ts`：搜索 `documentService.ts` 中所有 `export type`/`export const`（至少包括 `DocumentType`、`DocumentStatus`、`VersionListItem`、`BranchListItem`、`EMPTY_DOC`、`SETTINGS_SCOPE_PREFIX`、`CURRENT_DOCUMENT_ID_KEY`、`MAX_TITLE_LENGTH`、`AUTOSAVE_MERGE_WINDOW_MS`），剪切到 `types.ts`
2. 创建 `versionService.ts`：从 `createDocumentService` 内部提取 `listVersions`/`readVersion`/`diffVersions`/`rollbackVersion`/`restoreVersion` 方法。每个方法保持完全相同的签名和实现，只是从大函数中剥离为独立 factory `createVersionService(deps: { db, logger })`
3. 创建 `branchService.ts`：提取 `createBranch`/`listBranches`/`switchBranch`/`mergeBranch`/`resolveMergeConflict`
4. 创建 `documentCrudService.ts`：提取剩余的 CRUD 方法
5. 修改 `documentService.ts`：变为聚合门面，内部创建三个子服务实例，对外暴露完全相同的 `DocumentService` 类型，方法委托到子服务
6. 验证：现有测试无需修改（接口不变），`pnpm vitest run documents` 全绿
7. `pnpm vitest run` 全量确认

**踩坑提醒**：
- 子服务之间可能存在内部调用（如 `rollbackVersion` 内部调用 `readVersion`），提取时保持调用链完整
- `diffLines` 是纯函数，可提取到 `utils/diffLines.ts` 供 `versionService` 使用
- `ipcError` import 暂时保留在子服务中（Sprint 2 的 `s2-service-error-decouple` 会统一处理）

**防治标签**：`MONOLITH` `ADDONLY` `OVERABS` `DUP` `FAKETEST`

---

#### s1-ai-service-extract（A7-C-002 + A5-H-003）

**证据**：
- `CN-Code-Audit-2026-02-14/A7-可维护性审计.md` L22-L33（A7-C-002：aiService.ts L981，`createAiService` 1460 行，复杂度 234）
- `CN-Code-Audit-2026-02-14/A5-架构合规审计.md` L57-L70（A5-H-003：aiService.ts L206/L769/L981，聚合 token 估算/env 解析/provider 路由/错误映射/运行时调度）

**问题**：`createAiService` 1460 行，协议/配置/运行耦合于单点。

**提取策略**：优先提取无状态纯函数模块（runtimeConfig、errorMapper），再提取有状态的 providerResolver。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/ai/types.ts` | CREATE | |
| `apps/desktop/main/src/services/ai/providerResolver.ts` | CREATE | |
| `apps/desktop/main/src/services/ai/runtimeConfig.ts` | CREATE | |
| `apps/desktop/main/src/services/ai/errorMapper.ts` | CREATE | |
| `apps/desktop/main/src/services/ai/aiService.ts` | MODIFY | 变为聚合层 |

**具体操作**：
1. 创建 `types.ts`：从 `aiService.ts` 提取 `AiProvider`、`ProviderConfig`、`ProviderResolution`、`RunEntry`、`AiStreamEvent` 等所有 `export type`
2. 创建 `runtimeConfig.ts`（纯函数，最安全）：提取 `estimateTokenCount`（约 L206）、`combineSystemText`、`modeSystemHint`、`parseTimeoutMs`、`parseMaxSkillOutputChars`、`parseChatHistoryTokenBudget` 等纯函数。每个函数保持相同签名。
3. 创建 `errorMapper.ts`（纯函数）：提取 `mapUpstreamStatusToIpcErrorCode`（约 L769）和 `ipcError` helper
4. 创建 `providerResolver.ts`（有状态）：提取 provider 路由逻辑 `resolveProvider`、`parseProxySettings`、provider health state 管理
5. 修改 `aiService.ts`：import 子模块，内部 `createAiService` 缩减为核心调度逻辑（runSkill/cancel/listModels），委托配置解析和错误映射到子模块
6. 逐模块验证：`pnpm vitest run ai` 每提取一个跑一次

**踩坑提醒**：
- `estimateTokenCount` 和 `combineSystemText` 可能被 `createAiService` 闭包内多处引用，提取后改为显式 import 调用
- `providerResolver` 可能持有 provider 健康状态（如 rate limit 退避），提取为独立 factory `createProviderResolver(deps)` 返回带状态的对象

**防治标签**：`MONOLITH` `ADDONLY` `OVERABS` `DUP` `FAKETEST`

---

#### s1-kg-service-extract（A7-C-003）

**证据**：`CN-Code-Audit-2026-02-14/A7-可维护性审计.md` L35-L46（A7-C-003：kgService.ts L784，`createKnowledgeGraphService` 1378 行，复杂度 269）

**问题**：`createKnowledgeGraphService` 1378 行，图查询/写入/约束/上下文注入混杂，扩展与性能治理风险高。

**提取策略**：按 `query/write/validation/context-injection` 分模块下沉，原 `kgService.ts` 变为聚合门面。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/kg/types.ts` | CREATE | 共享类型 |
| `apps/desktop/main/src/services/kg/kgQueryService.ts` | CREATE | 查询子服务 |
| `apps/desktop/main/src/services/kg/kgWriteService.ts` | CREATE | 写入子服务 |
| `apps/desktop/main/src/services/kg/kgService.ts` | MODIFY | 变为门面 |

**具体操作**：
1. 创建 `types.ts`：从 `kgService.ts` 提取所有 `export type`/`export const`，至少包括：
   - `KnowledgeEntityType`、`KNOWLEDGE_ENTITY_TYPES`（L 附近定义）
   - `AiContextLevel`、`AI_CONTEXT_LEVELS`
   - `KnowledgeEntity`、`KnowledgeRelation`、`BUILTIN_RELATION_TYPES`
   - `ServiceResult` 相关类型
   - entity/relation 限制常量
2. 创建 `kgQueryService.ts`：提取 `querySubgraph`/`queryPath`/`queryValidate`/`queryRelevant`/`queryByIds`/`buildRulesInjection`，封装为 `createKgQueryService(deps: { db, logger })`
3. 创建 `kgWriteService.ts`：提取 `entityCreate`/`entityUpdate`/`entityDelete`/`entityList`/`entityRead` + `relationCreate`/`relationUpdate`/`relationDelete`/`relationList`，封装为 `createKgWriteService(deps: { db, logger })`
4. 修改 `kgService.ts`：内部实例化 query + write 子服务，`KnowledgeGraphService` 类型保持不变，方法委托到子服务
5. 验证：`pnpm vitest run kg` 全绿 → `pnpm vitest run` 全量

**踩坑提醒**：
- `queryRelevant` 内部可能调用 `entityRead` 来获取实体详情，提取后需要通过 deps 注入或在门面层组合
- `buildRulesInjection` 是 context engine 的关键依赖（Sprint 2 Phase 2 `s2-fetcher-always` 会调用它），确保提取后的 export 路径对外可见

**防治标签**：`MONOLITH` `ADDONLY` `OVERABS` `DUP` `FAKETEST`

---

#### s1-context-ipc-split（A7-C-004）

**证据**：`CN-Code-Audit-2026-02-14/A7-可维护性审计.md` L48-L59（A7-C-004：context.ts L138，`registerContextIpcHandlers` 953 行，复杂度 102）

**前置依赖**：`s1-break-context-cycle`（循环依赖打断后才能安全拆分）

**问题**：`registerContextIpcHandlers` 953 行，IPC 注册层承载大量业务逻辑（token 估算、role 规范化、层组装调度），接口变更容易破坏契约一致性。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/ipc/contextAssembly.ts` | CREATE | context:assemble / context:inspect handlers |
| `apps/desktop/main/src/ipc/contextBudget.ts` | CREATE | context:budget:* handlers |
| `apps/desktop/main/src/ipc/contextFs.ts` | CREATE | context:fs:* handlers |
| `apps/desktop/main/src/ipc/context.ts` | MODIFY | L138 附近，变为聚合注册器 |

**具体操作**：
1. 分析 `context.ts` 中所有 `guardedIpcMain.handle(...)` 调用，按 channel 前缀分组：
   - `context:assemble:*` + `context:inspect:*` → `contextAssembly.ts`
   - `context:budget:*` → `contextBudget.ts`
   - `context:fs:*` → `contextFs.ts`
2. 每个子文件导出 `registerContextAssemblyHandlers(deps)`/`registerContextBudgetHandlers(deps)`/`registerContextFsHandlers(deps)` 函数
3. `context.ts` 变为：
   ```ts
   export function registerContextIpcHandlers(deps: ContextIpcDeps) {
     registerContextAssemblyHandlers(deps);
     registerContextBudgetHandlers(deps);
     registerContextFsHandlers(deps);
   }
   ```
4. 业务逻辑（token 估算、role 规范化）如果在 handler 内联实现，提取到 `services/context/` 下的独立函数，handler 只负责校验+路由+调用 service+返回
5. 验证：`pnpm vitest run context` → `pnpm vitest run` 全量

**踩坑提醒**：`context.ts` 中的 `createKnowledgeGraphService`/`createMemoryService`/`createContextLayerAssemblyService` 实例化可能在函数顶部一次性创建。拆分后这些实例需要通过 `deps` 传入子注册器，不要在每个子文件中重复创建。

**防治标签**：`MONOLITH` `ADDONLY` `DUP` `FAKETEST`

---

#### s1-scheduler-error-ctx（A3-H-001 + A6-M-004）

**证据**：
- `CN-Code-Audit-2026-02-14/A3-质量陷阱审计.md` L32-L49（A3-H-001：skillScheduler.ts L260-L278，`response`/`completion` 分离处理，catch 丢弃错误细节）
- `CN-Code-Audit-2026-02-14/A6-健壮性审计.md` L121-L134（A6-M-004：skillScheduler.ts L272-L278，`completion` catch 丢弃 error，仅标记 failed）

**问题**：`skillScheduler.ts` L260-L278，`completion.catch(() => { finalizeTask(sessionKey, task, "failed"); })` 丢弃了 error 对象，调度异常原因不可追踪。同时 `response` 和 `completion` 分离处理可能导致终态不一致。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/skills/skillScheduler.ts` | MODIFY | L260-L278 |
| `apps/desktop/main/src/services/skills/__tests__/skillScheduler.test.ts` | MODIFY | 新增用例 |

**具体操作**：
1. **Red** — 在 `skillScheduler.test.ts` 新增用例 `"completion rejection preserves error context"`：
   - 构造一个 skill execution，mock `started.completion` 为 `Promise.reject(new Error("UPSTREAM_TIMEOUT"))`
   - 断言 `finalizeTask` 被调用时第三个参数为 `"failed"`
   - 断言 `logger.warn` 被调用，参数包含 `{ event: "skill_completion_error", sessionKey, taskId, error: "UPSTREAM_TIMEOUT" }`
2. **Green** — 修改 `skillScheduler.ts` L272-L278：
   ```ts
   // BEFORE:
   void started.completion
     .then((terminal) => { finalizeTask(sessionKey, task, terminal); })
     .catch(() => { finalizeTask(sessionKey, task, "failed"); });
   // AFTER:
   void started.completion
     .then((terminal) => { finalizeTask(sessionKey, task, terminal); })
     .catch((err) => {
       logger.warn("skill_completion_error", {
         sessionKey,
         taskId: task.id,
         error: err instanceof Error ? err.message : String(err),
       });
       finalizeTask(sessionKey, task, "failed");
     });
   ```
3. 同时检查 L260-L268 的 `response.catch`，确认也保留了 error：
   ```ts
   // 确认 response catch 也记录错误：
   .catch((error) => {
     logger.warn("skill_response_error", { sessionKey, taskId: task.id, error: String(error) });
     task.resolveResult(ipcError(...));
   });
   ```
4. `pnpm vitest run skillScheduler` 确认 Green

**踩坑提醒**：`finalizeTask` 函数签名可能需要扩展以接受 `error?: string` 参数（用于记录失败原因到 task 终态）。先检查 `finalizeTask` 当前签名再决定是否扩展，不要改变其对外行为。

**防治标签**：`SILENT` `FALLBACK` `FAKETEST`

---

## Sprint 2 — 交织推进（27 changes, 16.75d）

目标：功能建设与剩余债务交织执行。audit-roadmap Phase 2 + Phase 3 + CN-Code P1/P2 剩余项。采用 Same-File Batching 策略，触碰文件时同步修复已知问题。

### Changes 列表

#### Phase 2 功能组（Codex 上下文，6 changes）

| # | Change ID | 来源 | Scope | Est |
|---|-----------|------|-------|-----|
| 19 | `s2-kg-context-level` | AR-C8 | entity 增加 aiContextLevel 字段 + migration + 编辑 UI | 0.5d |
| 20 | `s2-kg-aliases` | AR-C9 | entity 增加 aliases 字段 + migration + 编辑 UI | 0.5d |
| 21 | `s2-entity-matcher` | AR-C10 | 实体名/别名匹配引擎，100 实体 × 1000 字 < 10ms | 1d |
| 22 | `s2-fetcher-always` | AR-C11 | rules fetcher: 查询 aiContextLevel="always" 实体，格式化注入 | 0.5d |
| 23 | `s2-fetcher-detected` | AR-C12 | retrieved fetcher: 调用匹配引擎，注入 when_detected 实体 | 1d |
| 24 | `s2-memory-injection` | AR-C13 | Memory previewInjection → AI prompt + KG rules → Context | 1d |

#### Phase 3 功能组（写作技能 + 编辑器，8 changes）

| # | Change ID | 来源 | Scope | Est |
|---|-----------|------|-------|-----|
| 25 | `s2-writing-skills` | AR-C14 | 5 个写作技能 SKILL.md（write/expand/describe/shrink/dialogue） | 0.5d |
| 26 | `s2-conversation-skills` | AR-C15 | 3 个对话技能 SKILL.md（brainstorm/roleplay/critique） | 0.5d |
| 27 | `s2-write-button` | AR-C16 | 续写悬浮按钮组 UI + 技能调用 | 1d |
| 28 | `s2-bubble-ai` | AR-C17 | Bubble Menu AI 按钮（润色/改写/描写/对白） | 1d |
| 29 | `s2-slash-framework` | AR-C18 | TipTap Slash Command 扩展框架 + 命令面板 UI | 1d |
| 30 | `s2-slash-commands` | AR-C19 | 写作命令集注册（/续写 /描写 /对白 /角色 /大纲 /搜索） | 0.5d |
| 31 | `s2-inline-diff` | AR-C20 | Inline diff decoration + 接受/拒绝按钮 | 1d |
| 32 | `s2-shortcuts` | AR-C21 | 快捷键系统（Ctrl+Enter 续写、Ctrl+Shift+R 润色等） | 0.5d |

#### 债务修复组（CN-Code P1/P2 剩余，13 changes）

| # | Change ID | 来源 | 修复项 | Est |
|---|-----------|------|--------|-----|
| 33 | `s2-kg-metrics-split` | A3-H-002 | KG metrics 拆分 succeeded/failed/completed 计数 | 0.5d |
| 34 | `s2-type-convergence` | A1-H-002 | VersionListItem 类型定义收敛单源 | 0.25d |
| 35 | `s2-judge-hook` | A1-H-003 | judge:model:ensure 共享状态机 hook 收敛 | 0.5d |
| 36 | `s2-settings-disable` | A1-H-001 | Settings 账户入口禁用（未实现逻辑下线） | 0.25d |
| 37 | `s2-demo-params-cleanup` | A1-M-001+A1-M-002 | 移除 AiInlineConfirm/AiErrorCard 中的 demo 控制参数 | 0.5d |
| 38 | `s2-dual-field-migrate` | A2-M-002+A2-M-003 | executionId/runId + id/skillId 双字段弃用策略 | 0.5d |
| 39 | `s2-dead-code-cleanup` | A2-M-004+A1-M-003+A1-M-004 | ping 不可达 catch + barrel 注释 + 一行包装函数 | 0.25d |
| 40 | `s2-test-timing-fix` | A3-M-001 | 固定 sleep 异步测试改条件等待（批量 19 处） | 1d |
| 41 | `s2-story-assertions` | A3-M-002 | story 测试增加行为断言 | 0.5d |
| 42 | `s2-debug-channel-gate` | A4-M-001 | debug IPC 通道生产禁用/加门禁 | 0.25d |
| 43 | `s2-service-error-decouple` | A5-M-001 | service 领域错误与 IPC 错误映射解耦 | 0.5d |
| 44 | `s2-store-race-fix` | A6-M-002+A6-M-003 | kgStore/searchStore 引入 requestId/AbortController 防竞态 | 1d |
| 45 | `s2-memory-panel-error` | A6-M-001 | MemoryPanel 异常处理 + UI 错误态闭环 | 0.25d |

### 内部依赖关系

```
Phase 2 功能组内部:
  s2-kg-context-level ──┐
  s2-kg-aliases ─────────┤ （可并行）
                         ├──→ s2-entity-matcher（依赖 C8+C9 的字段）
  s2-kg-context-level ───┤
                         ├──→ s2-fetcher-always（依赖 C8 的 aiContextLevel）
                         │
  s2-entity-matcher ─────┤
  s2-fetcher-always ─────┼──→ s2-fetcher-detected（依赖匹配引擎 + rules fetcher）
                         │
  s2-memory-injection ───┘ （依赖 Phase 1 C2，独立于 Phase 2 其他项）

Phase 3 功能组内部:
  s2-writing-skills ─────┐
                         ├──→ s2-write-button（依赖 C14）
                         ├──→ s2-bubble-ai（依赖 C14）
  s2-conversation-skills ┤ （独立）
                         │
  s2-slash-framework ────┼──→ s2-slash-commands（依赖 C18）
                         │
  s2-inline-diff ────────┤ （独立）
                         │
  s2-write-button ───────┤
  s2-bubble-ai ──────────┼──→ s2-shortcuts（依赖 C16+C17）

Phase 2 与 Phase 3 之间: 无直接依赖，可并行

债务组内部:
  全部独立，可任意并行或按触碰文件批处理

跨组依赖:
  s2-kg-context-level / s2-kg-aliases → 建议在 s1-kg-service-extract 之后
  s2-fetcher-always / s2-fetcher-detected → 建议在 s1-break-context-cycle 之后
  s2-write-button / s2-bubble-ai → 建议在 s1-break-panel-cycle 之后
  s2-service-error-decouple → 建议在 s1-ai-service-extract 之后
```

### 推荐执行顺序（6 Waves）

| Wave | 内容 | 并行度 |
|------|------|--------|
| W1 | `s2-kg-context-level` + `s2-kg-aliases` + `s2-memory-injection` + 债务批A (`s2-dead-code-cleanup`, `s2-settings-disable`, `s2-type-convergence`) | 6并行 |
| W2 | `s2-entity-matcher` + `s2-fetcher-always` + `s2-writing-skills` + `s2-conversation-skills` + 债务批B (`s2-kg-metrics-split`, `s2-judge-hook`) | 6并行 |
| W3 | `s2-fetcher-detected` + `s2-write-button` + `s2-bubble-ai` + `s2-slash-framework` + 债务批C (`s2-demo-params-cleanup`, `s2-dual-field-migrate`) | 6并行 |
| W4 | `s2-slash-commands` + `s2-inline-diff` + 债务批D (`s2-test-timing-fix`, `s2-story-assertions`) | 4并行 |
| W5 | `s2-shortcuts` + 债务批E (`s2-debug-channel-gate`, `s2-service-error-decouple`) | 3并行 |
| W6 | 债务批F (`s2-store-race-fix`, `s2-memory-panel-error`) | 2并行 |

### Change 详情 — Phase 2 功能组

#### s2-kg-context-level（AR-C8）

**证据**：`docs/plans/archive/audit-roadmap.md` L65（Phase 2 C8）

**Scope**：KG entity 增加 `aiContextLevel` 字段。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/kg/types.ts` | MODIFY | 已有 `AiContextLevel` 类型（Sprint 1 已提取） |
| `apps/desktop/main/src/services/kg/kgWriteService.ts` | MODIFY | entityCreate/entityUpdate 支持 aiContextLevel 参数 |
| `apps/desktop/main/src/db/migrations/` | CREATE | 增加 migration：`ALTER TABLE kg_entities ADD COLUMN ai_context_level TEXT DEFAULT 'when_detected'` |
| `apps/desktop/renderer/src/features/kg/KnowledgeGraphPanel.tsx` | MODIFY | 实体编辑表单增加 aiContextLevel 下拉选择 |
| `apps/desktop/main/src/services/kg/__tests__/` | MODIFY | 增加 aiContextLevel 字段的 CRUD 测试 |

**子任务**：
1. 写 migration 脚本
2. 写测试：entityCreate 带 aiContextLevel → entityRead 返回正确值（Red）
3. 修改 kgWriteService（Green）
4. 修改 KG Panel UI 增加编辑控件
5. 写 UI 交互测试

**防治标签**：`FAKETEST` `DRIFT`

---

#### s2-kg-aliases（AR-C9）

**证据**：`docs/plans/archive/audit-roadmap.md` L66（Phase 2 C9）

**Scope**：KG entity 增加 `aliases: string[]` 字段。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/kg/types.ts` | MODIFY | 确认 aliases 字段已存在（当前代码已有 `aliases: string[]`） |
| `apps/desktop/main/src/services/kg/kgWriteService.ts` | MODIFY | 确认 entityCreate/entityUpdate 正确处理 aliases |
| `apps/desktop/renderer/src/features/kg/KnowledgeGraphPanel.tsx` | MODIFY | 实体编辑表单增加 aliases 编辑（tag 输入） |
| `apps/desktop/main/src/services/kg/__tests__/` | MODIFY | 增加 aliases 字段 CRUD + 边界测试 |

**子任务**：
1. 写测试：aliases 保存和读取（Red→Green）
2. UI 增加 tag 编辑组件
3. 边界测试：空 aliases、超长 alias、重复 alias

**防治标签**：`FAKETEST` `DRIFT`

---

#### s2-entity-matcher（AR-C10）

**证据**：`docs/plans/archive/audit-roadmap.md` L67, L78-L86（Phase 2 C10，含 Scenario 示例）

**Scope**：实体名/别名匹配引擎，替换 mock recognizer。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/kg/entityMatcher.ts` | MODIFY | 已有骨架，需实现真实匹配算法（Aho-Corasick 或前缀树） |
| `apps/desktop/main/src/services/kg/__tests__/entityMatcher.test.ts` | CREATE | 性能测试：100 实体 × 1000 字 < 10ms |

**子任务**：
1. 写测试：基础匹配（名字 + 别名）（Red）
2. 写测试：性能基线 100×1000 < 10ms（Red）
3. 实现 Aho-Corasick 匹配（Green）
4. 边界测试：重叠名称、中文匹配、空输入

**防治标签**：`FAKETEST` `OVERABS`

---

#### s2-fetcher-always（AR-C11）

**证据**：`docs/plans/archive/audit-roadmap.md` L68（Phase 2 C11）；同时修复 `CN-Code-Audit-2026-02-14/A2-行为偏差审计.md` L93-L106（A2-M-001：settingsFetcher 降级 warning 缺少错误摘要 ID）

**Scope**：rules fetcher 查询 `aiContextLevel="always"` 实体并格式化注入。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/context/fetchers/rulesFetcher.ts` | MODIFY | 增加查询 `entityList({ filter: { aiContextLevel: "always" } })` 并格式化为 context chunks |
| `apps/desktop/main/src/services/context/__tests__/rulesFetcher.test.ts` | MODIFY | 增加 always 实体注入测试 |

**子任务**：
1. 写测试：有 always 实体 → context 包含其档案（Red）
2. 写测试：无 always 实体 → context 不包含额外内容（Red）
3. 修改 rulesFetcher（Green）

**防治标签**：`FAKETEST` `SILENT`

---

#### s2-fetcher-detected（AR-C12）

**证据**：`docs/plans/archive/audit-roadmap.md` L69, L88-L98（Phase 2 C12，含 Scenario 示例）

**Scope**：retrieved fetcher 调用匹配引擎，注入 `when_detected` 实体。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/context/fetchers/retrievedFetcher.ts` | MODIFY | 调用 entityMatcher，匹配结果 → 查询完整实体 → 格式化注入 |
| `apps/desktop/main/src/services/context/__tests__/retrievedFetcher.test.ts` | MODIFY | 增加 detected 实体注入测试 |

**子任务**：
1. 写测试：文本包含实体名 → context 包含该实体（Red）
2. 写测试：aiContextLevel=never 实体不注入（Red）
3. 修改 retrievedFetcher（Green）

**防治标签**：`FAKETEST` `SILENT`

---

#### s2-memory-injection（AR-C13）

**证据**：`docs/plans/archive/audit-roadmap.md` L70（Phase 2 C13）

**Scope**：Memory preview 注入 AI prompt。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/memory/memoryService.ts` | MODIFY | 增加 `getPreviewInjection(projectId)` 方法 |
| `apps/desktop/main/src/services/context/fetchers/settingsFetcher.ts` | MODIFY | 调用 memoryService.getPreviewInjection 并注入 |
| `apps/desktop/main/src/services/memory/__tests__/` | MODIFY | preview injection 测试 |

**子任务**：
1. 写测试：有记忆 → prompt 包含记忆片段（Red）
2. 实现 getPreviewInjection（Green）
3. 集成到 settingsFetcher
4. 端到端验证 context 组装包含记忆

**防治标签**：`FAKETEST` `SILENT`

### Change 详情 — Phase 3 功能组

#### s2-writing-skills（AR-C14）

**证据**：`docs/plans/archive/audit-roadmap.md` L108（Phase 3 C14）

**Scope**：5 个写作技能 SKILL.md。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/skills/builtin/write/SKILL.md` | CREATE | 续写技能定义 |
| `apps/desktop/main/skills/builtin/expand/SKILL.md` | CREATE | 扩写技能定义 |
| `apps/desktop/main/skills/builtin/describe/SKILL.md` | CREATE | 描写技能定义 |
| `apps/desktop/main/skills/builtin/shrink/SKILL.md` | CREATE | 精简技能定义 |
| `apps/desktop/main/skills/builtin/dialogue/SKILL.md` | CREATE | 对白技能定义 |
| `apps/desktop/main/src/services/skills/__tests__/` | MODIFY | 增加 5 个技能加载和校验测试 |

**子任务**：
1. 编写 5 个 SKILL.md（可并行）
2. 写测试：skillLoader 正确加载每个技能（Red→Green）

**防治标签**：`FAKETEST` `DRIFT` `NOISE`

---

#### s2-conversation-skills（AR-C15）

**证据**：`docs/plans/archive/audit-roadmap.md` L109（Phase 3 C15）

**Scope**：3 个对话技能 SKILL.md。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/skills/builtin/brainstorm/SKILL.md` | CREATE | 头脑风暴技能 |
| `apps/desktop/main/skills/builtin/roleplay/SKILL.md` | CREATE | 角色扮演技能 |
| `apps/desktop/main/skills/builtin/critique/SKILL.md` | CREATE | 批评技能 |
| `apps/desktop/main/src/services/skills/__tests__/` | MODIFY | 增加 3 个技能加载测试 |

**子任务**：
1. 编写 3 个 SKILL.md
2. 写测试：skillLoader 正确加载（Red→Green）

**防治标签**：`FAKETEST` `DRIFT` `NOISE`

---

#### s2-write-button（AR-C16）

**证据**：`docs/plans/archive/audit-roadmap.md` L110（Phase 3 C16）

**Scope**：续写悬浮按钮组 UI + 技能调用。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/features/editor/WriteButton.tsx` | CREATE | 续写悬浮按钮组件 |
| `apps/desktop/renderer/src/features/editor/WriteButton.test.tsx` | CREATE | 按钮交互测试 |
| `apps/desktop/renderer/src/features/editor/WriteButton.stories.tsx` | CREATE | Storybook |
| `apps/desktop/renderer/src/features/editor/` | MODIFY | 编辑器集成续写按钮 |

**子任务**：
1. 设计按钮 UI（参照 design/system）
2. 写测试：点击按钮 → 调用 write 技能（Red）
3. 实现 WriteButton 组件（Green）
4. 集成到编辑器
5. Storybook

**防治标签**：`FAKETEST` `DRIFT` `OVERABS`

---

#### s2-bubble-ai（AR-C17）

**证据**：`docs/plans/archive/audit-roadmap.md` L111（Phase 3 C17）

**Scope**：Bubble Menu AI 按钮。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/features/editor/BubbleAiMenu.tsx` | CREATE | Bubble Menu AI 子菜单 |
| `apps/desktop/renderer/src/features/editor/BubbleAiMenu.test.tsx` | CREATE | 交互测试 |
| `apps/desktop/renderer/src/features/editor/BubbleAiMenu.stories.tsx` | CREATE | Storybook |

**子任务**：
1. 写测试：选中文本 → 出现 AI 菜单 → 点击润色 → 调用技能（Red）
2. 实现 BubbleAiMenu（Green）
3. 集成到 TipTap Bubble Menu 扩展
4. Storybook

**防治标签**：`FAKETEST` `DRIFT` `OVERABS`

---

#### s2-slash-framework（AR-C18）

**证据**：`docs/plans/archive/audit-roadmap.md` L112（Phase 3 C18）

**Scope**：TipTap Slash Command 扩展框架。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/features/editor/extensions/slashCommand.ts` | CREATE | TipTap Extension：监听 `/` 输入，弹出命令面板 |
| `apps/desktop/renderer/src/features/editor/SlashCommandPanel.tsx` | CREATE | 命令面板 UI（搜索 + 列表） |
| `apps/desktop/renderer/src/features/editor/SlashCommandPanel.test.tsx` | CREATE | 面板交互测试 |

**子任务**：
1. 实现 TipTap Extension 骨架
2. 写测试：输入 `/` → 弹出面板（Red）
3. 实现 SlashCommandPanel（Green）
4. 集成测试

**防治标签**：`FAKETEST` `DRIFT` `OVERABS`

---

#### s2-slash-commands（AR-C19）

**证据**：`docs/plans/archive/audit-roadmap.md` L113（Phase 3 C19）

**Scope**：写作命令集注册。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/features/editor/slashCommands.ts` | CREATE | 命令注册表：/续写 /描写 /对白 /角色 /大纲 /搜索 |
| `apps/desktop/renderer/src/features/editor/slashCommands.test.ts` | CREATE | 命令解析和执行测试 |

**子任务**：
1. 定义命令接口和注册表
2. 写测试：命令过滤和执行（Red→Green）

**防治标签**：`FAKETEST` `DUP` `DRIFT`

---

#### s2-inline-diff（AR-C20）

**证据**：`docs/plans/archive/audit-roadmap.md` L114（Phase 3 C20）

**Scope**：Inline diff decoration + 接受/拒绝按钮。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/features/editor/extensions/inlineDiff.ts` | CREATE | TipTap Extension：diff decoration |
| `apps/desktop/renderer/src/features/editor/InlineDiffControls.tsx` | CREATE | 接受/拒绝按钮组件 |
| `apps/desktop/renderer/src/features/editor/InlineDiffControls.test.tsx` | CREATE | 测试 |

**子任务**：
1. 设计 diff decoration 数据结构
2. 写测试：AI 输出 → 显示 diff → 接受 → 应用到编辑器（Red）
3. 实现 inlineDiff extension + InlineDiffControls（Green）

**防治标签**：`FAKETEST` `DRIFT` `SILENT`

---

#### s2-shortcuts（AR-C21）

**证据**：`docs/plans/archive/audit-roadmap.md` L115（Phase 3 C21）

**Scope**：快捷键系统。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/features/editor/keyboardShortcuts.ts` | CREATE | 快捷键注册和分发 |
| `apps/desktop/renderer/src/features/editor/keyboardShortcuts.test.ts` | CREATE | 快捷键测试 |

**子任务**：
1. 定义快捷键映射表
2. 写测试：Ctrl+Enter → 触发续写技能（Red→Green）
3. 写测试：Ctrl+Shift+R → 触发润色技能（Red→Green）

**防治标签**：`FAKETEST` `DRIFT` `DUP`

### Change 详情 — 债务修复组

#### s2-kg-metrics-split（A3-H-002）

**证据**：`CN-Code-Audit-2026-02-14/A3-质量陷阱审计.md` L51-L71（A3-H-002：kgRecognitionRuntime.ts L424-L437, L645-L660）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/kg/kgRecognitionRuntime.ts` | MODIFY | L424-437, L645-660: metrics 增加 `failed` 计数器，finally 中区分 succeeded/failed |
| `apps/desktop/main/src/services/kg/__tests__/` | MODIFY | 增加失败任务不计入 completed 的断言 |

**子任务**：
1. 写测试：processTask 失败 → metrics.failed += 1, metrics.completed 不变（Red）
2. 修改 kgRecognitionRuntime.ts（Green）

**防治标签**：`SILENT` `FAKETEST`

---

#### s2-type-convergence（A1-H-002）

**证据**：`CN-Code-Audit-2026-02-14/A1-代码膨胀审计.md` L33-L51（A1-H-002：VersionHistoryContainer.tsx L17-L24）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/features/version-history/VersionHistoryContainer.tsx` | MODIFY | L17-24: 删除本地 `VersionListItem` 类型，改为从 `@shared/` 或 documentService types 导入 |
| `apps/desktop/main/src/services/documents/types.ts` | VERIFY | 确认是单一来源 |

**子任务**：
1. 确认类型定义单一来源
2. 替换 VersionHistoryContainer 中的重复定义
3. `pnpm tsc --noEmit` 验证

**防治标签**：`DUP` `ADDONLY`

---

#### s2-judge-hook（A1-H-003）

**证据**：`CN-Code-Audit-2026-02-14/A1-代码膨胀审计.md` L53-L72（A1-H-003：JudgeSection.tsx L49-L70）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/hooks/useJudgeEnsure.ts` | CREATE | 共享 hook：busy/downloading/error 状态机 |
| `apps/desktop/renderer/src/features/settings/JudgeSection.tsx` | MODIFY | L49-70: 改用 useJudgeEnsure hook |
| （另一处使用 judge:model:ensure 的文件） | MODIFY | 改用 useJudgeEnsure hook |

**新建文件清单**：
- `apps/desktop/renderer/src/hooks/useJudgeEnsure.ts`

**子任务**：
1. 提取共享 hook
2. 替换两处使用
3. 测试状态机行为

**防治标签**：`DUP` `OVERABS` `FAKETEST`

---

#### s2-settings-disable（A1-H-001）

**证据**：`CN-Code-Audit-2026-02-14/A1-代码膨胀审计.md` L12-L31（A1-H-001：SettingsDialog.tsx L195-L203）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.tsx` | MODIFY | L195-203: 为 onUpgrade/onDeleteAccount 按钮增加 `disabled` 属性 + tooltip "即将推出" |

**子任务**：
1. 修改按钮为 disabled 态
2. 验证 UI

**防治标签**：`ADDONLY` `DRIFT`

---

#### s2-demo-params-cleanup（A1-M-001 + A1-M-002）

**证据**：
- `CN-Code-Audit-2026-02-14/A1-代码膨胀审计.md` L94-L108（A1-M-001：AiInlineConfirm.tsx L263-L274）
- `CN-Code-Audit-2026-02-14/A1-代码膨胀审计.md` L110-L127（A1-M-002：AiErrorCard.tsx L532-L535, L616-L621）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/components/features/AiDialogs/AiInlineConfirm.tsx` | MODIFY | L263-274: 移除 `simulateDelay`/`initialState` 参数，行为改为真实回调驱动 |
| `apps/desktop/renderer/src/components/features/AiDialogs/AiErrorCard.tsx` | MODIFY | L532-535, L616-621: 移除 `retryWillSucceed`/`simulateDelay`，重试结果由外部回调决定 |
| 对应 `.stories.tsx` 文件 | MODIFY | demo 参数迁移到 story args |

**子任务**：
1. 修改 AiInlineConfirm 移除 demo 参数
2. 修改 AiErrorCard 移除 demo 参数
3. 更新 stories 适配
4. 测试验证

**防治标签**：`ADDONLY` `FAKETEST` `NOISE`

---

#### s2-dual-field-migrate（A2-M-002 + A2-M-003）

**证据**：
- `CN-Code-Audit-2026-02-14/A2-行为偏差审计.md` L108-L119（A2-M-002：ai.ts L838）
- `CN-Code-Audit-2026-02-14/A2-行为偏差审计.md` L121-L132（A2-M-003：skills.ts L129）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/ipc/ai.ts` | MODIFY | L838: 增加 `if (payload.runId) logger.warn("deprecated_field", { field: "runId" })` |
| `apps/desktop/main/src/ipc/skills.ts` | MODIFY | L129: 增加 `if (payload.skillId) logger.warn("deprecated_field", { field: "skillId" })` |
| `packages/shared/types/` | MODIFY | 类型定义中标记 `@deprecated` |

**子任务**：
1. 增加弃用日志
2. 标记类型 @deprecated
3. 测试日志正确输出

**防治标签**：`ADDONLY` `FAKETEST`

---

#### s2-dead-code-cleanup（A2-M-004 + A1-M-003 + A1-M-004）

**证据**：
- `CN-Code-Audit-2026-02-14/A2-行为偏差审计.md` L134-L149（A2-M-004：index.ts L175-L182）
- `CN-Code-Audit-2026-02-14/A1-代码膨胀审计.md` L128-L144（A1-M-003：AiDialogs/index.ts L1-L41）
- `CN-Code-Audit-2026-02-14/A1-代码膨胀审计.md` L146-L159（A1-M-004：kgRecognitionRuntime.ts L275-L277）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/index.ts` | MODIFY | L175-182: 删除 ping handler 不可达 catch |
| `apps/desktop/renderer/src/components/features/AiDialogs/index.ts` | MODIFY | 压缩 barrel 注释至最小 |
| `apps/desktop/main/src/services/kg/kgRecognitionRuntime.ts` | MODIFY | L275-277: 去除 `service()` 一行包装函数，直接调用 |

**子任务**：
1. 逐文件修改（可并行）
2. 全量测试验证

**防治标签**：`ADDONLY` `NOISE`

---

#### s2-test-timing-fix（A3-M-001）

**证据**：`CN-Code-Audit-2026-02-14/A3-质量陷阱审计.md` L74-L87（A3-M-001：recognition-query-failure-degrade.test.ts L46-L48，模式统计 19 处 setTimeout 驱动异步测试）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| 19 个包含 `setTimeout(resolve, ...)` 的测试文件 | MODIFY | 替换为 `waitFor`/条件轮询/事件等待 |

**子任务**：
1. 批量搜索 `setTimeout(resolve` 的测试文件
2. 逐文件替换为条件等待
3. 逐文件验证测试稳定性

**防治标签**：`FAKETEST` `GHOST`

---

#### s2-story-assertions（A3-M-002）

**证据**：`CN-Code-Audit-2026-02-14/A3-质量陷阱审计.md` L89-L103（A3-M-002：AiPanel.stories.test.ts L6-L10，模式统计 18 处浅层断言）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/features/ai/AiPanel.stories.test.ts` | MODIFY | L6-10: 增加渲染断言（至少检查关键元素存在和初始状态） |
| 其他仅做 `toBeDefined` 断言的 story test | MODIFY | 增加行为断言 |

**子任务**：
1. 搜索所有 `toBeDefined` 断言的 story test
2. 逐文件增加渲染/交互断言
3. 验证测试

**防治标签**：`FAKETEST`

---

#### s2-debug-channel-gate（A4-M-001）

**证据**：`CN-Code-Audit-2026-02-14/A4-安全与规范审计.md` L48-L64（A4-M-001：index.ts L186-L204，`db:debug:tablenames` 常规注册泄露数据库结构）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/index.ts` | MODIFY | L186-204: `db:debug:tablenames` 仅在 `process.env.NODE_ENV !== 'production'` 时注册 |

**子任务**：
1. 增加环境判断
2. 写测试：production 环境下通道不存在

**防治标签**：`SECURITY` `FAKETEST`

---

#### s2-service-error-decouple（A5-M-001）

**证据**：`CN-Code-Audit-2026-02-14/A5-架构合规审计.md` L73-L87（A5-M-001：documentService.ts L5-L8，业务 service 直接依赖 `IpcError/IpcErrorCode`）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/documents/types.ts` | MODIFY | 增加领域错误类型 `DocumentError` |
| `apps/desktop/main/src/services/documents/documentCrudService.ts` | MODIFY | 返回 `DocumentError` 而非 `IpcError` |
| `apps/desktop/main/src/ipc/` | MODIFY | IPC 层做 `DocumentError → IpcError` 映射 |

**子任务**：
1. 定义领域错误类型
2. 修改 service 返回
3. 在 IPC 层增加映射
4. 测试验证

**防治标签**：`MONOLITH` `ADDONLY` `DUP` `FAKETEST`

---

#### s2-store-race-fix（A6-M-002 + A6-M-003）

**证据**：
- `CN-Code-Audit-2026-02-14/A6-健壮性审计.md` L90-L104（A6-M-002：kgStore.ts L216-L235）
- `CN-Code-Audit-2026-02-14/A6-健壮性审计.md` L106-L119（A6-M-003：searchStore.ts L75-L113）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/stores/kgStore.ts` | MODIFY | L216-235: 引入 requestEpoch，set 前校验 `get().projectId === projectId` |
| `apps/desktop/renderer/src/stores/searchStore.ts` | MODIFY | L75-113: 引入 AbortController + requestStamp，提交前比对 query |

**子任务**：
1. 写测试：快速切换项目 → 旧数据不覆盖新数据（Red）
2. 修改 kgStore（Green）
3. 写测试：快速输入查询 → 旧结果不覆盖新结果（Red）
4. 修改 searchStore（Green）

**防治标签**：`SILENT` `FAKETEST` `GHOST`

---

#### s2-memory-panel-error（A6-M-001）

**证据**：`CN-Code-Audit-2026-02-14/A6-健壮性审计.md` L70-L88（A6-M-001：MemoryPanel.tsx L80-L84, L103-L105）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/features/memory/MemoryPanel.tsx` | MODIFY | L80-84, L103-105: `loadPanelData` 增加 try/catch，失败时 `setStatus("error")` |

**子任务**：
1. 写测试：invoke 异常 → 面板显示错误态（Red）
2. 修改 MemoryPanel（Green）

**防治标签**：`SILENT` `FALLBACK` `FAKETEST`

---

## Sprint 3 — 收尾 + 高级功能（17 changes, 14.5d）

目标：audit-roadmap Phase 4-6 + CN-Code P3 Backlog + 自动化治理 ratchet。

### Changes 列表

#### Phase 4 功能组（叙事记忆 + 摘要，5 changes）

| # | Change ID | 来源 | Scope | Est |
|---|-----------|------|-------|-----|
| 46 | `s3-kg-last-seen` | AR-C22 | entity 增加 last_seen_state 字段 + migration + UI | 0.5d |
| 47 | `s3-state-extraction` | AR-C23 | 章节完成时 LLM 提取角色状态变化，更新 KG | 1d |
| 48 | `s3-synopsis-skill` | AR-C24 | synopsis 技能 SKILL.md（生成 200-300 字章节摘要） | 0.5d |
| 49 | `s3-synopsis-injection` | AR-C25 | 摘要持久存储 + 续写时注入前几章摘要 | 1d |
| 50 | `s3-trace-persistence` | AR-C26 | generation_traces + trace_feedback SQLite 持久化 | 1d |

#### Phase 5 功能组（语义检索，4 changes）

| # | Change ID | 来源 | Scope | Est |
|---|-----------|------|-------|-----|
| 51 | `s3-onnx-runtime` | AR-C27 | ONNX Runtime 集成 + bge-small-zh 模型加载推理 | 1d |
| 52 | `s3-embedding-service` | AR-C28 | embedding 服务三级降级：ONNX → API → hash | 1d |
| 53 | `s3-hybrid-rag` | AR-C29 | Semantic + FTS hybrid ranking (RRF) | 1d |
| 54 | `s3-entity-completion` | AR-C30 | KG 实体名 ghost text 补全（纯本地匹配） | 1d |

#### Phase 6 功能组（体验完善，6 changes）

| # | Change ID | 来源 | Scope | Est |
|---|-----------|------|-------|-----|
| 55 | `s3-i18n-setup` | AR-C31 | react-i18next 集成 + locale 文件结构 | 0.5d |
| 56 | `s3-i18n-extract` | AR-C32 | 硬编码中文 → locale keys 抽取 | 1d |
| 57 | `s3-search-panel` | AR-C33 | 搜索面板 UI（全文搜索 + 结果 + 跳转） | 1d |
| 58 | `s3-export` | AR-C34 | Markdown/TXT/DOCX 导出 | 1d |
| 59 | `s3-zen-mode` | AR-C35 | 禅模式（全屏编辑器，隐藏侧边栏） | 0.5d |
| 60 | `s3-project-templates` | AR-C36 | 项目模板系统（小说/短篇/剧本/自定义） | 1d |

#### P3 Backlog + Ratchet（2 changes）

| # | Change ID | 来源 | 修复项 | Est |
|---|-----------|------|--------|-----|
| 61 | `s3-p3-backlog-batch` | A1-L/A2-L/A3-L/A4-L/A5-L/A6-L/A7-L 合并 | 14 项 P3 低危问题批量清理 | 1d |
| 62 | `s3-lint-ratchet` | A7 模式统计 | ESLint ratchet CI：函数长度/复杂度/import 深度 | 0.5d |

### 内部依赖关系

```
Phase 4 内部:
  s3-kg-last-seen ──→ s3-state-extraction（依赖 last_seen_state 字段）
  s3-synopsis-skill ──→ s3-synopsis-injection（依赖 synopsis 技能定义）
  s3-trace-persistence ── 独立

Phase 5 内部:
  s3-onnx-runtime ──→ s3-embedding-service ──→ s3-hybrid-rag
  s3-entity-completion ── 独立（依赖 Sprint 2 s2-kg-context-level）

Phase 6 内部:
  s3-i18n-setup ──→ s3-i18n-extract
  s3-search-panel ── 独立
  s3-export ── 独立
  s3-zen-mode ── 独立
  s3-project-templates ── 独立

跨 Phase:
  Phase 4 ←── Sprint 2 Phase 2 完成（KG 字段 + context injection 就绪）
  Phase 5 ←── 独立（仅 C30 依赖 Sprint 2 s2-kg-context-level）
  Phase 6 ←── 独立

P3 + Ratchet:
  s3-p3-backlog-batch ── 独立，任何时间可穿插
  s3-lint-ratchet ── 独立，建议在 Sprint 3 初期设置
```

### 推荐执行顺序（4 Waves）

| Wave | 内容 | 并行度 |
|------|------|--------|
| W1 | `s3-lint-ratchet` + `s3-kg-last-seen` + `s3-synopsis-skill` + `s3-trace-persistence` + `s3-onnx-runtime` + `s3-i18n-setup` | 6并行 |
| W2 | `s3-state-extraction` + `s3-synopsis-injection` + `s3-embedding-service` + `s3-entity-completion` + `s3-i18n-extract` + `s3-search-panel` + `s3-export` + `s3-p3-backlog-batch` | 8并行 |
| W3 | `s3-hybrid-rag` + `s3-zen-mode` + `s3-project-templates` | 3并行 |

### Change 详情

#### s3-kg-last-seen（AR-C22）

**证据**：`docs/plans/archive/audit-roadmap.md` L130（Phase 4 C22）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/kg/types.ts` | MODIFY | 增加 `lastSeenState?: string` 字段 |
| `apps/desktop/main/src/services/kg/kgWriteService.ts` | MODIFY | entityUpdate 支持 lastSeenState |
| `apps/desktop/main/src/db/migrations/` | CREATE | `ALTER TABLE kg_entities ADD COLUMN last_seen_state TEXT` |
| `apps/desktop/renderer/src/features/kg/KnowledgeGraphPanel.tsx` | MODIFY | 实体详情面板显示 lastSeenState |

**子任务**：
1. 写 migration
2. 写测试：lastSeenState 读写（Red→Green）
3. 修改 UI

**防治标签**：`FAKETEST` `DRIFT`

---

#### s3-state-extraction（AR-C23）

**证据**：`docs/plans/archive/audit-roadmap.md` L131（Phase 4 C23）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/kg/stateExtractor.ts` | CREATE | 章节完成时调用 LLM 提取角色状态变化 |
| `apps/desktop/main/src/services/kg/__tests__/stateExtractor.test.ts` | CREATE | mock LLM 测试 |

**新建文件清单**：
- `apps/desktop/main/src/services/kg/stateExtractor.ts`

**子任务**：
1. 设计 LLM prompt 模板
2. 写测试：mock LLM 返回状态变化 → KG entity 更新（Red）
3. 实现 stateExtractor（Green）
4. 集成到章节保存流程

**防治标签**：`FAKETEST` `OVERABS` `SILENT`

---

#### s3-synopsis-skill（AR-C24）

**证据**：`docs/plans/archive/audit-roadmap.md` L132（Phase 4 C24）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/skills/builtin/synopsis/SKILL.md` | CREATE | synopsis 技能定义 |

**子任务**：
1. 编写 SKILL.md
2. 写测试：skillLoader 正确加载（Red→Green）

**防治标签**：`FAKETEST` `DRIFT` `NOISE`

---

#### s3-synopsis-injection（AR-C25）

**证据**：`docs/plans/archive/audit-roadmap.md` L133（Phase 4 C25）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/context/synopsisStore.ts` | CREATE | 摘要持久存储（SQLite） |
| `apps/desktop/main/src/services/context/fetchers/synopsisFetcher.ts` | CREATE | 续写时注入前几章摘要 |
| `apps/desktop/main/src/services/context/layerAssemblyService.ts` | MODIFY | 注册 synopsisFetcher |
| `apps/desktop/main/src/db/migrations/` | CREATE | synopsis 表 |

**新建文件清单**：
- `apps/desktop/main/src/services/context/synopsisStore.ts`
- `apps/desktop/main/src/services/context/fetchers/synopsisFetcher.ts`

**子任务**：
1. 设计 synopsis 表结构
2. 写测试：存储和检索摘要（Red→Green）
3. 写测试：续写时 context 包含前几章摘要（Red→Green）
4. 实现 synopsisFetcher 并注册

**防治标签**：`FAKETEST` `SILENT` `OVERABS`

---

#### s3-trace-persistence（AR-C26）

**证据**：`docs/plans/archive/audit-roadmap.md` L134（Phase 4 C26）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/ai/traceStore.ts` | CREATE | generation_traces + trace_feedback SQLite DAO |
| `apps/desktop/main/src/db/migrations/` | CREATE | traces 表 |
| `apps/desktop/main/src/services/ai/aiService.ts` | MODIFY | 运行完成后持久化 trace |

**新建文件清单**：
- `apps/desktop/main/src/services/ai/traceStore.ts`

**子任务**：
1. 设计 trace 表结构
2. 写测试：trace 写入和查询（Red→Green）
3. 集成到 aiService 运行流程

**防治标签**：`FAKETEST` `SILENT`

---

#### s3-onnx-runtime（AR-C27）

**证据**：`docs/plans/archive/audit-roadmap.md` L153（Phase 5 C27）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/embedding/onnxRuntime.ts` | CREATE | ONNX Runtime 封装 + bge-small-zh 模型加载 |
| `apps/desktop/main/src/services/embedding/__tests__/onnxRuntime.test.ts` | CREATE | 模型加载和推理测试 |
| `apps/desktop/package.json` | MODIFY | 增加 `onnxruntime-node` 依赖 |

**新建文件清单**：
- `apps/desktop/main/src/services/embedding/onnxRuntime.ts`

**子任务**：
1. 集成 onnxruntime-node
2. 写测试：模型加载 + 向量推理（Red→Green）
3. 性能基线测试

**防治标签**：`FAKETEST` `DRIFT`

---

#### s3-embedding-service（AR-C28）

**证据**：`docs/plans/archive/audit-roadmap.md` L154（Phase 5 C28）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/embedding/embeddingService.ts` | MODIFY | 已有骨架，增加三级降级：ONNX → API → hash |

**子任务**：
1. 写测试：ONNX 可用 → 使用 ONNX（Red→Green）
2. 写测试：ONNX 不可用 → fallback API（Red→Green）
3. 写测试：API 也不可用 → fallback hash（Red→Green）

**防治标签**：`FALLBACK` `FAKETEST` `SILENT`

---

#### s3-hybrid-rag（AR-C29）

**证据**：`docs/plans/archive/audit-roadmap.md` L155（Phase 5 C29）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/rag/hybridRanker.ts` | CREATE | Semantic + FTS 混合排名（RRF 算法） |
| `apps/desktop/main/src/services/rag/__tests__/hybridRanker.test.ts` | CREATE | 排名正确性测试 |

**新建文件清单**：
- `apps/desktop/main/src/services/rag/hybridRanker.ts`

**子任务**：
1. 实现 RRF 排名算法
2. 写测试：语义和全文结果融合排名（Red→Green）
3. 集成到 RAG IPC handler

**防治标签**：`FAKETEST` `OVERABS`

---

#### s3-entity-completion（AR-C30）

**证据**：`docs/plans/archive/audit-roadmap.md` L156（Phase 5 C30）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/features/editor/extensions/entityCompletion.ts` | CREATE | TipTap Extension：实体名 ghost text 补全 |
| `apps/desktop/renderer/src/features/editor/extensions/entityCompletion.test.ts` | CREATE | 补全测试 |

**新建文件清单**：
- `apps/desktop/renderer/src/features/editor/extensions/entityCompletion.ts`

**子任务**：
1. 写测试：输入匹配实体名 → 出现补全建议（Red→Green）
2. 实现 entityCompletion extension

**防治标签**：`FAKETEST` `DRIFT`

---

#### s3-i18n-setup（AR-C31）

**证据**：`docs/plans/archive/audit-roadmap.md` L174（Phase 6 C31）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/i18n/index.ts` | CREATE | react-i18next 初始化 |
| `apps/desktop/renderer/src/i18n/locales/zh-CN.json` | CREATE | 中文 locale |
| `apps/desktop/renderer/src/i18n/locales/en.json` | CREATE | 英文 locale |
| `apps/desktop/package.json` | MODIFY | 增加 `react-i18next` + `i18next` 依赖 |

**新建文件清单**：
- `apps/desktop/renderer/src/i18n/index.ts`
- `apps/desktop/renderer/src/i18n/locales/zh-CN.json`
- `apps/desktop/renderer/src/i18n/locales/en.json`

**子任务**：
1. 安装 i18next 依赖
2. 创建初始化配置
3. 创建 locale 文件骨架
4. 集成到 App 入口

**防治标签**：`DRIFT` `FAKETEST`

---

#### s3-i18n-extract（AR-C32）

**证据**：`docs/plans/archive/audit-roadmap.md` L175（Phase 6 C32）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| 全库 renderer 中硬编码中文字符串 | MODIFY | 替换为 `t('key')` 调用 |
| `apps/desktop/renderer/src/i18n/locales/zh-CN.json` | MODIFY | 填充 key-value |
| `apps/desktop/renderer/src/i18n/locales/en.json` | MODIFY | 填充英文翻译 |

**子任务**：
1. 批量搜索中文硬编码
2. 逐文件替换为 `t()` 调用
3. 同步更新 locale 文件
4. 全量测试

**防治标签**：`DRIFT` `DUP` `NOISE`

---

#### s3-search-panel（AR-C33）

**证据**：`docs/plans/archive/audit-roadmap.md` L176（Phase 6 C33）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/features/search/SearchPanel.tsx` | MODIFY | 已有骨架，完善全文搜索 + 结果列表 + 跳转 |
| `apps/desktop/renderer/src/features/search/SearchPanel.test.tsx` | CREATE | 搜索交互测试 |

**子任务**：
1. 写测试：输入查询 → 显示结果 → 点击跳转（Red）
2. 完善 SearchPanel（Green）
3. Storybook

**防治标签**：`FAKETEST` `DRIFT`

---

#### s3-export（AR-C34）

**证据**：`docs/plans/archive/audit-roadmap.md` L177（Phase 6 C34）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/export/exportService.ts` | MODIFY | 已有骨架，增加 Markdown/TXT/DOCX 导出实现 |
| `apps/desktop/renderer/src/features/export/` | MODIFY | 导出 UI 完善 |

**子任务**：
1. 写测试：文档 → Markdown 输出（Red→Green）
2. 写测试：文档 → TXT 输出（Red→Green）
3. 写测试：文档 → DOCX 输出（Red→Green）
4. UI 集成

**防治标签**：`FAKETEST` `DRIFT` `SILENT`

---

#### s3-zen-mode（AR-C35）

**证据**：`docs/plans/archive/audit-roadmap.md` L178（Phase 6 C35）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/renderer/src/features/zen-mode/` | MODIFY | 已有目录，完善全屏编辑模式 |

**子任务**：
1. 写测试：进入禅模式 → 侧边栏隐藏（Red→Green）
2. 完善禅模式实现

**防治标签**：`FAKETEST` `DRIFT`

---

#### s3-project-templates（AR-C36）

**证据**：`docs/plans/archive/audit-roadmap.md` L179（Phase 6 C36）

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `apps/desktop/main/src/services/projects/templateService.ts` | CREATE | 模板管理服务 |
| `apps/desktop/main/templates/` | CREATE | 内置模板（小说/短篇/剧本/自定义）目录 |
| `apps/desktop/renderer/src/features/projects/` | MODIFY | 新建项目时选择模板 UI |

**新建文件清单**：
- `apps/desktop/main/src/services/projects/templateService.ts`
- `apps/desktop/main/templates/novel.json`
- `apps/desktop/main/templates/short-story.json`
- `apps/desktop/main/templates/screenplay.json`
- `apps/desktop/main/templates/custom.json`

**子任务**：
1. 设计模板 schema
2. 写测试：创建项目时应用模板（Red→Green）
3. 实现 templateService
4. UI 集成

**防治标签**：`FAKETEST` `DRIFT` `OVERABS`

---

#### s3-p3-backlog-batch（P3 批量）

**证据**：各审计报告 Low 级别条目汇总：
- `CN-Code-Audit-2026-02-14/A1-代码膨胀审计.md` L161-L183（A1-L-001, A1-L-002）
- `CN-Code-Audit-2026-02-14/A2-行为偏差审计.md` L151-L175（A2-L-001, A2-L-002）
- `CN-Code-Audit-2026-02-14/A3-质量陷阱审计.md` L105-L117（A3-L-001）
- `CN-Code-Audit-2026-02-14/A4-安全与规范审计.md` L66-L88（A4-L-001, A4-L-002）
- `CN-Code-Audit-2026-02-14/A5-架构合规审计.md` L106-L128（A5-L-001, A5-L-002）
- `CN-Code-Audit-2026-02-14/A6-健壮性审计.md` L136-L161（A6-L-001, A6-L-002）
- `CN-Code-Audit-2026-02-14/A7-可维护性审计.md` L209-L261（A7-L-017 ~ A7-L-019）

**批量修复 14 项 P3 低危问题**：

| 子项 | 来源 | 文件 | 修复内容 |
|------|------|------|---------|
| 1 | A1-L-001 | `OutlinePanel.tsx` | 移除 `_onScrollSync` 占位参数 |
| 2 | A1-L-002 | `QualityGatesPanel.tsx` | 下线 deprecated panelStyles |
| 3 | A2-L-001 | `AppShell.tsx` | JSON 解析失败增加一次性告警 |
| 4 | A2-L-002 | `skillService.ts` | contextRules 非法输入返回校验错误 |
| 5 | A3-L-001 | `recognition-silent-degrade.test.ts` | `assert.equal(len > 0, true)` → `assert.strictEqual(len, expectedCount)` |
| 6 | A4-L-001 | `documentService.ts` | 错误处理风格统一为 Result/Err |
| 7 | A4-L-002 | `package.json` / tech-stack.md | 补齐 docx/pdfkit 依赖批准记录 |
| 8 | A5-L-001 | features 目录 | 命名规范统一 + lint 规则 |
| 9 | A5-L-002 | 9 个含 BOM 的文件 | 清理 UTF-8 BOM |
| 10 | A6-L-001 | `aiStreamBridge.ts` | 返回 dispose() + 移除监听器 |
| 11 | A6-L-002 | `AddRelationshipPopover.tsx` | setTimeout 改为保存 timer id + clearTimeout |
| 12 | A7-L-017 | `SettingsDialog.tsx` | TODO 关联 issue |
| 13 | A7-L-018 | `VersionHistoryContainer.tsx` | wordChange TODO 关联 issue（实际计算由 s2-type-convergence 或后续 change 覆盖） |
| 14 | A7-L-019 | `command-palette.spec.ts` | Windows 键盘事件 TODO 关联 issue |

**子任务**：
1. 逐文件修复（可并行，按文件分配）
2. 全量测试验证

**防治标签**：`FAKETEST` `ADDONLY` `NOISE` `DRIFT`

---

#### s3-lint-ratchet（A7 模式统计治理）

**证据**：`CN-Code-Audit-2026-02-14/A7-可维护性审计.md` L168-L207（模式统计：1631 条规则命中，Critical 223，High 328，Medium 1076）；`CN-Code-Audit-2026-02-14/99-修复优先级排序.md` L81-L89（P3-7 ratchet 建议）

**目标**：设置 ESLint ratchet，记录当前违规基线，任何 PR 不允许增加违规数。

**修改文件**：
| 文件 | 动作 | 说明 |
|------|------|------|
| `.eslintrc.cjs` | MODIFY | 增加 `max-lines-per-function` (warn, 300)、`complexity` (warn, 25) 规则 |
| `scripts/lint-ratchet.ts` | CREATE | 记录当前违规数基线，CI 中比较 |
| `.github/workflows/ci.yml` | MODIFY | 增加 lint-ratchet step |
| `scripts/lint-baseline.json` | CREATE | 当前违规基线快照 |

**新建文件清单**：
- `scripts/lint-ratchet.ts`
- `scripts/lint-baseline.json`

**子任务**：
1. 配置 ESLint 规则（warn 级别）
2. 生成当前基线
3. 实现 ratchet 脚本（新提交违规数 <= 基线违规数）
4. 集成到 CI

**防治标签**：`RECUR` `FAKETEST`

---

## 全局新建文件清单

按 Sprint 汇总所有新建文件：

### Sprint 0（0 新建，仅 MODIFY + 少量 test）
无新建生产文件。

### Sprint 1（21 新建文件）

| 文件路径 | 类型 | 所属 Change |
|---------|------|------------|
| `apps/desktop/main/src/services/context/types.ts` | 类型 | s1-break-context-cycle |
| `apps/desktop/main/src/services/context/utils/formatEntity.ts` | 工具 | s1-break-context-cycle |
| `apps/desktop/main/src/ipc/ipcAcl.ts` | 安全 | s1-ipc-acl |
| `apps/desktop/main/src/ipc/__tests__/ipcAcl.test.ts` | 测试 | s1-ipc-acl |
| `apps/desktop/renderer/src/contexts/OpenSettingsContext.ts` | Context | s1-break-panel-cycle |
| `apps/desktop/main/src/config/runtimeGovernance.ts` | 配置 | s1-runtime-config |
| `apps/desktop/main/src/config/__tests__/runtimeGovernance.test.ts` | 测试 | s1-runtime-config |
| `apps/desktop/main/src/services/documents/types.ts` | 类型 | s1-doc-service-extract |
| `apps/desktop/main/src/services/documents/documentCrudService.ts` | 服务 | s1-doc-service-extract |
| `apps/desktop/main/src/services/documents/versionService.ts` | 服务 | s1-doc-service-extract |
| `apps/desktop/main/src/services/documents/branchService.ts` | 服务 | s1-doc-service-extract |
| `apps/desktop/main/src/services/ai/types.ts` | 类型 | s1-ai-service-extract |
| `apps/desktop/main/src/services/ai/providerResolver.ts` | 服务 | s1-ai-service-extract |
| `apps/desktop/main/src/services/ai/runtimeConfig.ts` | 配置 | s1-ai-service-extract |
| `apps/desktop/main/src/services/ai/errorMapper.ts` | 工具 | s1-ai-service-extract |
| `apps/desktop/main/src/services/kg/types.ts` | 类型 | s1-kg-service-extract |
| `apps/desktop/main/src/services/kg/kgQueryService.ts` | 服务 | s1-kg-service-extract |
| `apps/desktop/main/src/services/kg/kgWriteService.ts` | 服务 | s1-kg-service-extract |
| `apps/desktop/main/src/ipc/contextAssembly.ts` | IPC | s1-context-ipc-split |
| `apps/desktop/main/src/ipc/contextBudget.ts` | IPC | s1-context-ipc-split |
| `apps/desktop/main/src/ipc/contextFs.ts` | IPC | s1-context-ipc-split |

### Sprint 2（22 新建文件）

| 文件路径 | 类型 | 所属 Change |
|---------|------|------------|
| `apps/desktop/main/skills/builtin/write/SKILL.md` | 技能 | s2-writing-skills |
| `apps/desktop/main/skills/builtin/expand/SKILL.md` | 技能 | s2-writing-skills |
| `apps/desktop/main/skills/builtin/describe/SKILL.md` | 技能 | s2-writing-skills |
| `apps/desktop/main/skills/builtin/shrink/SKILL.md` | 技能 | s2-writing-skills |
| `apps/desktop/main/skills/builtin/dialogue/SKILL.md` | 技能 | s2-writing-skills |
| `apps/desktop/main/skills/builtin/brainstorm/SKILL.md` | 技能 | s2-conversation-skills |
| `apps/desktop/main/skills/builtin/roleplay/SKILL.md` | 技能 | s2-conversation-skills |
| `apps/desktop/main/skills/builtin/critique/SKILL.md` | 技能 | s2-conversation-skills |
| `apps/desktop/renderer/src/features/editor/WriteButton.tsx` | UI | s2-write-button |
| `apps/desktop/renderer/src/features/editor/BubbleAiMenu.tsx` | UI | s2-bubble-ai |
| `apps/desktop/renderer/src/features/editor/extensions/slashCommand.ts` | 扩展 | s2-slash-framework |
| `apps/desktop/renderer/src/features/editor/SlashCommandPanel.tsx` | UI | s2-slash-framework |
| `apps/desktop/renderer/src/features/editor/slashCommands.ts` | 注册表 | s2-slash-commands |
| `apps/desktop/renderer/src/features/editor/extensions/inlineDiff.ts` | 扩展 | s2-inline-diff |
| `apps/desktop/renderer/src/features/editor/InlineDiffControls.tsx` | UI | s2-inline-diff |
| `apps/desktop/renderer/src/features/editor/keyboardShortcuts.ts` | 工具 | s2-shortcuts |
| `apps/desktop/renderer/src/hooks/useJudgeEnsure.ts` | Hook | s2-judge-hook |
| `apps/desktop/main/src/services/kg/__tests__/entityMatcher.test.ts` | 测试 | s2-entity-matcher |
| 对应各功能的 `.test.tsx` / `.stories.tsx` | 测试 | 各 change |

### Sprint 3（16 新建文件）

| 文件路径 | 类型 | 所属 Change |
|---------|------|------------|
| `apps/desktop/main/src/services/kg/stateExtractor.ts` | 服务 | s3-state-extraction |
| `apps/desktop/main/skills/builtin/synopsis/SKILL.md` | 技能 | s3-synopsis-skill |
| `apps/desktop/main/src/services/context/synopsisStore.ts` | 存储 | s3-synopsis-injection |
| `apps/desktop/main/src/services/context/fetchers/synopsisFetcher.ts` | Fetcher | s3-synopsis-injection |
| `apps/desktop/main/src/services/ai/traceStore.ts` | 存储 | s3-trace-persistence |
| `apps/desktop/main/src/services/embedding/onnxRuntime.ts` | 引擎 | s3-onnx-runtime |
| `apps/desktop/main/src/services/rag/hybridRanker.ts` | 服务 | s3-hybrid-rag |
| `apps/desktop/renderer/src/features/editor/extensions/entityCompletion.ts` | 扩展 | s3-entity-completion |
| `apps/desktop/renderer/src/i18n/index.ts` | i18n | s3-i18n-setup |
| `apps/desktop/renderer/src/i18n/locales/zh-CN.json` | locale | s3-i18n-setup |
| `apps/desktop/renderer/src/i18n/locales/en.json` | locale | s3-i18n-setup |
| `apps/desktop/main/src/services/projects/templateService.ts` | 服务 | s3-project-templates |
| `apps/desktop/main/templates/novel.json` | 模板 | s3-project-templates |
| `apps/desktop/main/templates/short-story.json` | 模板 | s3-project-templates |
| `apps/desktop/main/templates/screenplay.json` | 模板 | s3-project-templates |
| `apps/desktop/main/templates/custom.json` | 模板 | s3-project-templates |
| `scripts/lint-ratchet.ts` | CI 工具 | s3-lint-ratchet |
| `scripts/lint-baseline.json` | CI 数据 | s3-lint-ratchet |

---

## 来源 → Change 交叉索引

| 审计编号 | Change ID | Sprint |
|---------|-----------|--------|
| A1-H-001 | s2-settings-disable | 2 |
| A1-H-002 | s2-type-convergence | 2 |
| A1-H-003 | s2-judge-hook | 2 |
| A1-H-004 | 含在 s2-type-convergence 或后续 | 2 |
| A1-M-001 | s2-demo-params-cleanup | 2 |
| A1-M-002 | s2-demo-params-cleanup | 2 |
| A1-M-003 | s2-dead-code-cleanup | 2 |
| A1-M-004 | s2-dead-code-cleanup | 2 |
| A1-L-001 | s3-p3-backlog-batch | 3 |
| A1-L-002 | s3-p3-backlog-batch | 3 |
| A2-H-001 | s0-context-observe | 0 |
| A2-H-002 | s0-metadata-failfast | 0 |
| A2-H-003 | s0-metadata-failfast | 0 |
| A2-H-004 | s0-skill-loader-error | 0 |
| A2-M-001 | 含在 s2-fetcher-always（同文件） | 2 |
| A2-M-002 | s2-dual-field-migrate | 2 |
| A2-M-003 | s2-dual-field-migrate | 2 |
| A2-M-004 | s2-dead-code-cleanup | 2 |
| A2-L-001 | s3-p3-backlog-batch | 3 |
| A2-L-002 | s3-p3-backlog-batch | 3 |
| A3-C-001 | s0-fake-queued-fix | 0 |
| A3-H-001 | s1-scheduler-error-ctx | 1 |
| A3-H-002 | s2-kg-metrics-split | 2 |
| A3-M-001 | s2-test-timing-fix | 2 |
| A3-M-002 | s2-story-assertions | 2 |
| A3-L-001 | s3-p3-backlog-batch | 3 |
| A4-H-001 | s0-sandbox-enable | 0 |
| A4-H-002 | s1-ipc-acl | 1 |
| A4-M-001 | s2-debug-channel-gate | 2 |
| A4-L-001 | s3-p3-backlog-batch | 3 |
| A4-L-002 | s3-p3-backlog-batch | 3 |
| A5-C-001 | s1-break-context-cycle | 1 |
| A5-H-001 | s1-break-panel-cycle | 1 |
| A5-H-002 | s1-doc-service-extract | 1 |
| A5-H-003 | s1-ai-service-extract | 1 |
| A5-M-001 | s2-service-error-decouple | 2 |
| A5-M-002 | s1-path-alias | 1 |
| A5-L-001 | s3-p3-backlog-batch | 3 |
| A5-L-002 | s3-p3-backlog-batch | 3 |
| A6-H-001 | s0-window-load-catch | 0 |
| A6-H-002 | s0-app-ready-catch | 0 |
| A6-H-003 | s0-kg-async-validate | 0 |
| A6-M-001 | s2-memory-panel-error | 2 |
| A6-M-002 | s2-store-race-fix | 2 |
| A6-M-003 | s2-store-race-fix | 2 |
| A6-M-004 | s1-scheduler-error-ctx | 1 |
| A6-L-001 | s3-p3-backlog-batch | 3 |
| A6-L-002 | s3-p3-backlog-batch | 3 |
| A7-C-001 | s1-doc-service-extract | 1 |
| A7-C-002 | s1-ai-service-extract | 1 |
| A7-C-003 | s1-kg-service-extract | 1 |
| A7-C-004 | s1-context-ipc-split | 1 |
| A7-C-005 | 含在 Sprint 2 Phase 3 功能开发中渐进拆分 | 2 |
| A7-C-006 | 含在 Sprint 2 Phase 3 功能开发中渐进拆分 | 2 |
| A7-H-007 | s1-path-alias | 1 |
| A7-H-008 | s1-path-alias | 1 |
| A7-H-009 | s1-runtime-config | 1 |
| A7-H-010 | s1-runtime-config | 1 |
| A7-H-011 | s1-runtime-config | 1 |
| A7-H-012 | s1-runtime-config | 1 |
| A7-M-013 | 含在 s1-context-ipc-split 扇入治理 | 1 |
| A7-M-014 | 含在 Sprint 2 功能开发中 facade 化 | 2 |
| A7-M-015 | 含在 s2-service-error-decouple | 2 |
| A7-M-016 | 含在 s2-service-error-decouple | 2 |
| A7-L-017 | s3-p3-backlog-batch | 3 |
| A7-L-018 | s3-p3-backlog-batch | 3 |
| A7-L-019 | s3-p3-backlog-batch | 3 |
| A7 模式统计 | s3-lint-ratchet | 3 |
| AR-C8 | s2-kg-context-level | 2 |
| AR-C9 | s2-kg-aliases | 2 |
| AR-C10 | s2-entity-matcher | 2 |
| AR-C11 | s2-fetcher-always | 2 |
| AR-C12 | s2-fetcher-detected | 2 |
| AR-C13 | s2-memory-injection | 2 |
| AR-C14 | s2-writing-skills | 2 |
| AR-C15 | s2-conversation-skills | 2 |
| AR-C16 | s2-write-button | 2 |
| AR-C17 | s2-bubble-ai | 2 |
| AR-C18 | s2-slash-framework | 2 |
| AR-C19 | s2-slash-commands | 2 |
| AR-C20 | s2-inline-diff | 2 |
| AR-C21 | s2-shortcuts | 2 |
| AR-C22 | s3-kg-last-seen | 3 |
| AR-C23 | s3-state-extraction | 3 |
| AR-C24 | s3-synopsis-skill | 3 |
| AR-C25 | s3-synopsis-injection | 3 |
| AR-C26 | s3-trace-persistence | 3 |
| AR-C27 | s3-onnx-runtime | 3 |
| AR-C28 | s3-embedding-service | 3 |
| AR-C29 | s3-hybrid-rag | 3 |
| AR-C30 | s3-entity-completion | 3 |
| AR-C31 | s3-i18n-setup | 3 |
| AR-C32 | s3-i18n-extract | 3 |
| AR-C33 | s3-search-panel | 3 |
| AR-C34 | s3-export | 3 |
| AR-C35 | s3-zen-mode | 3 |
| AR-C36 | s3-project-templates | 3 |

