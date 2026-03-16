# Tasks: A0-11 数据安全边界声明

- **GitHub Issue**: #1001
- **分支**: `task/1001-data-safety-boundary-statement`
- **Delta Spec**: `specs/workbench/spec.md`
- **前置依赖**: 无硬前置

---

## 所属任务簇

P0-4: 发布边界与数据诚实

---

## 验收标准

| ID   | 标准                                                                   | 对应 Scenario |
| ---- | ---------------------------------------------------------------------- | ------------- |
| AC-1 | `docs/release/v0.1-data-safety-boundary.md` 文件存在且包含七个必需章节 | S-DATA-1      |
| AC-2 | 数据存储总表覆盖项目文件、KG、Memory、敏感凭证、临时缓存五种数据类型   | S-DATA-1      |
| AC-3 | 每种数据类型包含「存储位置」「存储格式」「加密状态」「访问控制」四列   | S-DATA-1      |
| AC-4 | API Key 标记为 🔐 并引用 `SecretStorageAdapter` / `safeStorage` 证据   | S-DATA-2      |
| AC-5 | 创作内容（项目文件/KG/Memory）全部标记为 📄 明文存储                   | S-DATA-2      |
| AC-6 | 三个"不"章节完整：不加密创作内容、不远程同步、不提供应用级备份         | S-DATA-2      |
| AC-7 | 数据存储总表可被 A0-06 事实表直接引用                                  | S-DATA-3      |

---

## Phase 1: 证据收集

### Task 1.1: 项目文件存储核查

**映射验收标准**: AC-2, AC-3, AC-5

- [x] 搜索项目文件存储路径和格式
  - 命令：`grep -rn "projectPath\|savePath\|documentPath\|\.json\|\.md" apps/desktop/main/src/services/document*`
- [x] 确认项目文件是 JSON/Markdown 明文（无加密封装）
- [x] 确认存储目录由用户选择（非系统级保护目录）
- [x] 记录关键代码路径和文件行号

### Task 1.2: KG 与 Memory 存储核查

**映射验收标准**: AC-2, AC-3, AC-5

- [x] 搜索 KG 数据存储路径和格式
  - 命令：`grep -rn "kg.*path\|knowledge.*path\|entity.*store\|relation.*store" apps/desktop/main/src/`
- [x] 搜索 Memory 向量数据存储路径和格式
  - 命令：`grep -rn "memory.*path\|vector.*path\|embedding.*store\|sqlite-vec" apps/desktop/main/src/`
- [x] 核查 `08` §五中关于 KG / Memory 存储方式的审计结论
  - 确认：本地文件、无加密
- [x] 记录关键代码路径和文件行号

### Task 1.3: 敏感凭证存储核查

**映射验收标准**: AC-4

- [x] 搜索 `safeStorage` / `SecretStorageAdapter` 的实现
  - 命令：`grep -rn "safeStorage\|SecretStorageAdapter\|safeStorage\.encrypt\|safeStorage\.decrypt" apps/desktop/main/src/`
- [x] 确认 API Key 确实通过 `safeStorage` 加密存储
- [x] 确认加密范围仅限 API Key 等凭证，创作内容不在加密范围内
- [x] 记录 `SecretStorageAdapter` 具体实现的文件路径和行号

### Task 1.4: 临时缓存核查

**映射验收标准**: AC-2, AC-3

- [x] 搜索编辑器临时缓存路径
  - 命令：`grep -rn "vite-temp\|cache.*path\|temp.*dir" apps/desktop/`
- [x] 确认临时缓存是否明文、是否会包含创作内容片段
- [x] 记录缓存清理机制（如有）

### Task 1.5: 审计文档交叉验证

**映射验收标准**: AC-5

- [x] 核对 `06` §五存储格式总表的每一行与代码现场是否一致
- [x] 核对 `08` §五-§六中 KG / Memory / SecretStorage 的结论
- [x] 记录任何审计报告与代码现场不一致的条目

---

## Phase 2: 文档编写

### Task 2.1: 创建文档骨架

**映射验收标准**: AC-1

- [x] 创建 `docs/release/v0.1-data-safety-boundary.md`
- [x] 写入七个章节标题：声明目标、数据存储总表、三个明确"不"、安全边界依赖、已实现的安全措施、方向性演进计划、用户建议
- [x] 在声明目标章节填入文档目的说明

### Task 2.2: 编写数据存储总表

**映射验收标准**: AC-2, AC-3, AC-4, AC-5

- [x] 按数据类型逐行填写四列信息：
  - 项目文件：用户指定目录 / JSON·Markdown 明文 / 📄 明文存储 / OS 文件权限
  - KG 数据：应用数据目录 / 本地文件 / 📄 明文存储 / OS 文件权限
  - Memory 向量数据：应用数据目录 / 嵌入文件 / 📄 明文存储 / OS 文件权限
  - 敏感凭证（API Key）：系统凭证存储 / `safeStorage` 加密 / 🔐 已加密 / OS + Electron safeStorage
  - 临时缓存：临时目录 / 临时文件 / 📄 明文存储 / OS 文件权限
- [x] 每行附 Phase 1 收集的代码证据

### Task 2.3: 编写三个"不"

**映射验收标准**: AC-6

- [x] **不加密创作内容**：创作内容（手稿、KG、Memory）以明文形式存储在本地文件系统，无应用级加密
- [x] **不远程同步**：所有数据仅存在于本地，不传输到任何远程服务器（API 调用除外）
- [x] **不提供应用级备份**：数据持久性依赖用户自行文件备份。引用 A0-08 结论（如已产出）或 `06` §4.1 审计结论

### Task 2.4: 编写安全边界依赖与已实现措施

- [x] 安全边界依赖：安全性取决于 OS 级保护——Windows BitLocker 磁盘加密、NTFS 文件权限、用户账户隔离
- [x] 已实现的安全措施：`safeStorage` 加密 API Key，附代码路径引用

### Task 2.5: 编写演进计划与用户建议

- [x] 方向性演进计划：v0.2 评估 SQLCipher / 加密 FS 对 KG + Memory 的可行性；v0.3 用户可选工作区加密——仅方向标注，不承诺版本
- [x] 用户建议：启用 BitLocker、定期手动备份项目目录、避免在共享账户电脑上存储敏感手稿

---

## Phase 3: 校验与收尾

### Task 3.1: 交叉验证

**映射验收标准**: AC-4, AC-5, AC-6

- [x] 逐数据类型核对：加密状态标记是否与代码证据一致
- [x] 确认 API Key 以外的数据类型无"已加密"误标
- [x] 确认三个"不"是否与代码现场一致（搜索是否有远程同步 / 加密 / 备份的真实实现）
  - 命令：`grep -rn "encrypt\|remote.*sync\|cloud.*backup" apps/desktop/main/src/ | grep -v safeStorage | grep -v node_modules`
- [x] 确认文档未修改任何代码

### Task 3.2: 事实表可消费性确认

**映射验收标准**: AC-7

- [x] 模拟 A0-06 执行 Agent 视角：凭本文档可直接填写事实表「数据安全边界」章节
- [x] 确认数据存储总表格式与事实表结构兼容
- [x] 确认三个"不"可直接用作事实表的安全边界声明文本

---

## 验收标准 → 任务映射

| 验收标准                   | 对应任务          | 验证方式            | 状态 |
| -------------------------- | ----------------- | ------------------- | ---- |
| AC-1: 文档存在且含七章节   | Task 2.1          | 文件存在 + 结构审查 | [x]  |
| AC-2: 五种数据类型覆盖     | Task 1.1-1.4, 2.2 | 文档审查            | [x]  |
| AC-3: 每类型含四列         | Task 2.2          | 表格完整性          | [x]  |
| AC-4: API Key 标 🔐 并引证 | Task 1.3, 2.2     | 证据链审查          | [x]  |
| AC-5: 创作内容标 📄        | Task 1.1-1.2, 2.2 | 标记一致性          | [x]  |
| AC-6: 三个"不"完整         | Task 2.3          | 文档审查            | [x]  |
| AC-7: 可被事实表引用       | Task 3.2          | A0-06 视角模拟      | [x]  |

---

## TDD 规范引用

> 本任务为文档/决策类，不涉及代码实现。验收方式为输出物审查，而非自动化测试。
> 若决策结论导致后续实现任务，该实现任务必须遵循 `docs/references/testing/` 中的完整 TDD 规范。
