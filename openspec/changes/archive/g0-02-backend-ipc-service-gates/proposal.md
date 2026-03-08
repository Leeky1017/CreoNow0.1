# G0-02 后端 IPC 与服务健壮性门禁

- **GitHub Issue**: #1031
- **所属任务簇**: W0-GATE（门禁基础设施）
- **涉及模块**: ci-gates, ipc
- **前端验收**: 否

---

## Why：为什么必须做

### 1. 现状

AMP 审计在后端模块审查（`08-backend-module-health-audit.md`）中反复发现 4 类结构性问题，目前仅有 `cross-module-contract-gate` 检查 IPC 通道/错误码的**注册一致性**，但以下层面**无自动化阻断**：

| 问题 | AMP 命中 | 存量规模 | 当前门禁 |
|------|---------|---------|----------|
| IPC Handler 无 Schema 验证 | 3 轮 | 多数 handler | 无（contract gate 只查注册，不查验证） |
| Service 类桩方法/假实现 | 3 轮 | 13+ stub methods | 无 |
| Skill 输出无边界校验 | 2 轮 | 全部 skill handler | 无 |
| API Key 仅检查非空 | 2 轮 | 单点 | 无 |

### 2. 根因

- **IPC Handler 无 Schema**：`main/src/ipc/*.ts` 中的 handler 函数直接 destructure 参数使用，没有 Zod schema 或类型守卫校验。TypeScript 类型只在编译期生效，运行时渲染进程可以发送任意 payload。
- **Service 桩方法**：`main/src/services/` 中多个 service 类存在 `return []`、`return 'mock'`、`// TODO: implement` 等桩方法——代码在编译和测试中不报错，但 UI 上显示为可用能力（backup、judge、version history 等）。
- **Skill 输出无校验**：Skill handler 接收 LLM 返回结果后直接传递给渲染进程，不检查字数上限、格式合规、潜在注入内容。
- **API Key 弱校验**：仅 `if (!apiKey)` 非空检查，不验证格式/前缀/长度合理性。

### 3. 不做的后果

- A0-24（Skill 输出校验扩展）在实现时缺乏门禁保障——修好了这个 skill，新 skill 又不校验
- A0-08/A0-18（备份/评判决策）做完决策后，新增 service 方法可能再次引入桩实现
- IPC 攻击面在渲染进程被注入时可被利用——无 schema 验证等同"信任一切来自渲染进程的数据"

### 4. 证据来源

| 文档 | 章节 | 内容 |
|------|------|------|
| `docs/audit/amp/08-backend-module-health-audit.md` | §3 | "IPC handlers lack runtime validation" |
| `docs/audit/amp/08-backend-module-health-audit.md` | §4.2 | "13+ stub methods across services" |
| `docs/audit/amp/03-spec-gaps.md` | §二 | "Skill output has no boundary validation" |
| `docs/audit/amp/01-master-roadmap.md` | §4.2 | "后端边界防御必修" |

---

## What：做什么

### Guard 1: `ipc-handler-validation-gate.ts`

**新建 Guard 脚本**，扫描所有 IPC handler 注册点，检查每个 handler 是否包含参数验证：

- 扫描 `apps/desktop/main/src/ipc/*.ts` 中所有 `ipcMain.handle()` / `registerHandler()` 调用
- 对每个 handler 函数体检查：是否包含 schema parse/validate 调用（Zod `.parse()` / `.safeParse()` / 自定义 `validate()` / typeGuard 函数调用）
- 输出：未验证 handler 列表，违规总数，pass/fail 结论
- 基线机制：首次运行记录存量数 → 后续只允许减少不允许增加

### Guard 2: `service-stub-detector-gate.ts`

**新建 Guard 脚本**，扫描所有 Service 类，检测桩方法/假实现：

- 扫描 `apps/desktop/main/src/services/**/*.ts` 中所有 `class` 的公共方法
- 检测模式：
  - 方法体仅包含 `return []` / `return {}` / `return ''` / `return undefined` / `return null`
  - 方法体包含 `// TODO` / `// FIXME` / `// HACK` 注释
  - 方法体包含 `throw new Error('not implemented')`
  - 方法体为空（仅有空 return 或无 return）
- 输出：桩方法列表（文件:行号:方法名），违规总数，pass/fail 结论
- 基线机制：同上

### 扩展 3: 强化 `cross-module-contract-gate`

**扩展现有 gate** 增加以下维度：

- 检查 Skill handler 的输出是否有 schema/validation（类似 Guard 1 但针对 skill 输出端）
- 检查 API key 配置的校验函数是否包含格式检查（而非仅非空）

### CI 集成

- 新增 `pnpm gate:ipc-validation` 和 `pnpm gate:service-stubs` 命令
- 在 `ci.yml` 中新增对应 job，条件为 `if code_changed`
- 纳入 `ci` meta-job 的 prerequisite 列表

---

## Non-Goals：不做什么

1. **不修复存量桩方法**——存量修复由 A0-08、A0-17、A0-18 等决策类 change 负责
2. **不给所有 handler 补 Zod schema**——仅建门禁检测"是否有验证"，具体 schema 实现由各模块负责
3. **不拦截 CI**——以 baseline + ratchet 模式运行，存量允许，增量阻断
4. **不修改 IPC 契约类型定义**——`ipc-contract.ts` 的类型由 contract-generate 负责

---

## 依赖与影响

- **上游依赖**: 无
- **下游受益**: A0-24（Skill 输出校验）、A0-08/A0-17/A0-18（假服务决策）——门禁确保修复后不退化
- **与现有 gate 的关系**: 扩展 `cross-module-contract-gate`，复用 baseline/ratchet 模式

---

## 28-Pattern 覆盖声明

| Pattern # | 名称 | 门禁类型 | 级别 |
|-----------|------|---------|------|
| #7 | Skill 输出无边界校验 | Guard `cross-module-contract-gate` 扩展 | baseline ratchet |
| #9 | IPC Handler 无 Schema 验证 | Guard `ipc-handler-validation-gate` | baseline ratchet |
| #14 | Service 桩方法/假实现 | Guard `service-stub-detector-gate` | baseline ratchet |
| #19 | API Key 仅检查非空 | Guard `cross-module-contract-gate` 扩展 | baseline ratchet |
