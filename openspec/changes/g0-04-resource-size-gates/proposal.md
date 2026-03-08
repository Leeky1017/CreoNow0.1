# G0-04 资源大小与性能预算门禁

- **GitHub Issue**: #1033
- **所属任务簇**: W0-GATE（门禁基础设施）
- **涉及模块**: ci-gates, document-management
- **前端验收**: 否

---

## Why：为什么必须做

### 1. 现状

CreoNow 作为 Electron 桌面应用，资源大小直接影响性能体验，但目前**完全没有资源预算机制**：

| 问题 | AMP 命中 | 现状 | 当前门禁 |
|------|---------|------|----------|
| 文档大小无限制 | 3 轮 | Spec 写了 5MB 限制但代码未实施 | 无 |
| Bundle 大小无预算 | 2 轮 | 前端 bundle 无大小追踪 | 无 |

### 2. 根因

- **文档大小**：`openspec/specs/document-management/spec.md` 明确定义"单文档正文大小上限 5 MB"，但保存链路未校验。A0-23 计划在代码层面实施限制，但即使 A0-23 完成，也没有**门禁**确保未来新的文件操作路径不会绕过限制。本 gate 检查"所有文件写入操作是否包含大小校验代码"——是防退化门禁，不是实现本身。
- **Bundle 大小**：Electron renderer 的 bundle 大小直接影响首屏加载速度。目前没有 CI 检查 bundle 大小变化，新增依赖或大模块可能大幅增加 bundle 而无人感知。

### 3. 不做的后果

- A0-23 完成后，若新增文件操作路径（如导入、模板加载）不走统一校验，大小限制被绕过
- Bundle 持续增长，首屏加载越来越慢，Electron 进程内存占用越来越高
- 这些退化是渐进式的——每次增加一点点，积少成多，到发现时已积重难返

### 4. 证据来源

| 文档 | 章节 | 内容 |
|------|------|------|
| `openspec/specs/document-management/spec.md` | Capacity | "单文档大小上限 5 MB" |
| `docs/audit/amp/08-backend-module-health-audit.md` | §4.1 | "5 MB limit defined but not enforced" |
| `docs/audit/amp/01-master-roadmap.md` | §4.2 | "后端边界防御必修" |

---

## What：做什么

### Guard 1: `resource-size-gate.ts`

**新建 Guard 脚本**，检查文件写入/保存操作是否包含大小校验：

- 扫描 `main/src/ipc/*.ts` 和 `main/src/services/**/*.ts` 中所有文件写入操作
- 检测符合以下模式之一的调用：`fs.writeFile`, `fs.writeFileSync`, `db.run(INSERT/UPDATE)` 涉及 content/body 字段
- 检查调用前是否有 `Buffer.byteLength` / `content.length` / 大小比较逻辑
- 输出：未校验的写入操作列表
- baseline ratchet 机制

### Guard 2: `bundle-size-budget.ts`

**新建 Guard 脚本**，检查前端 bundle 大小变化：

- 运行 `electron-vite build` 后分析 output 目录下的 `.js` 文件大小
- 记录 baseline（初始各 chunk 大小）
- 若总大小超过 baseline + 容许增长（如 5%），则报警
- PR 中输出 bundle 大小变化报告

### CI 集成

- 新增 `pnpm gate:resource-size` 和 `pnpm gate:bundle-budget` 命令
- `ci.yml` 新增对应 job
- bundle-budget 仅在 PR 中运行（需要 build 产物）

---

## Non-Goals：不做什么

1. **不在代码中实施 5MB 限制**——那是 A0-23 的职责；本 gate 只检查"限制代码是否存在"
2. **不限制单个 npm 包大小**——仅检查最终 bundle 产物
3. **不做运行时内存监控**——仅做静态/构建时检查
4. **不阻断 CI**——初始以报告模式运行，稳定后升级为阻断

---

## 依赖与影响

- **上游依赖**: 无（bundle-budget 需要 build 产物，但 build 命令已存在）
- **下游受益**: A0-23（文档大小限制）——实现后门禁确保不退化
- **与现有 gate 的关系**: 全新 gate，不修改现有 gate

---

## 28-Pattern 覆盖声明

| Pattern # | 名称 | 门禁类型 | 级别 |
|-----------|------|---------|------|
| #6 | 文档大小无限制 | Guard `resource-size-gate` | baseline ratchet |
| — | Bundle 大小无预算（AMP 补充识别，未编入 28-Pattern 正式序号） | Guard `bundle-size-budget` | 报告模式 → 稳定后升级为 required |
