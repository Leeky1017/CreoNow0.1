# A0-23 文档 5MB 限制实施

- **GitHub Issue**: #984
- **所属任务簇**: P0-6（基础输入输出防线）
- **涉及模块**: document-management
- **前端验收**: 否

---

## Why：为什么必须做

### 1. 用户现象

CreoNow 的文档管理规范明确定义了「单文档正文大小上限 5 MB（TipTap JSON 序列化后）」，但保存链路从未实施这一校验。用户若粘贴超大内容——百万字长篇、误贴 Base64 图片数据——系统照单全收，既不拦截也不提示。后续编辑器卡顿、导出超时、SQLite 写入异常，用户只知道「这软件越来越慢」，不知道根因是文档体积失控。

### 2. 根因

`file:document:save` IPC 处理函数（`main/src/ipc/file.ts` L375-L410）直接将 `contentJson` 传入 `documentCoreService.save()`，未对 `contentJson` 的字节长度做任何校验。`documentCoreService.ts` 的 `save()` 函数（L1167）同样无体积检查。规范中定义的 5 MB 上限从未在代码中落地。

### 3. v0.1 威胁

- **数据完整性风险**：超大文档可导致 SQLite 写入超时或事务失败，用户内容可能部分丢失
- **性能退化**：TipTap 编辑器加载超大 JSON 文档会导致渲染进程卡顿，影响所有文档的编辑体验
- **规范可信度**：Spec 写了 5 MB 限制，代码不执行等同废文——审计者会认定规范与实现不一致

### 4. 证据来源

| 文档                                               | 章节                                            | 内容                                                          |
| -------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| `docs/audit/amp/01-master-roadmap.md`              | §4.2                                            | v0.1 必修项：后端边界防御                                     |
| `docs/audit/amp/03-spec-gaps.md`                   | §二                                             | Spec 定义了边界但未实施                                       |
| `docs/audit/amp/08-backend-module-health-audit.md` | §4.1                                            | document-management 模块：5 MB limit defined but not enforced |
| `openspec/specs/document-management/spec.md`       | Requirement: 大文件、编码异常与并发编辑冲突处理 | 「单文档正文大小上限：5 MB（TipTap JSON 序列化后）」          |
| `openspec/specs/document-management/spec.md`       | Non-Functional Requirements / Capacity          | 「单文档大小上限：5 MB」                                      |

---

## What Changes：具体做什么

1. **在 `file:document:save` IPC 处理函数中增加 `contentJson` 字节长度校验**：保存请求到达主进程后、写入数据库之前，计算 `Buffer.byteLength(contentJson, 'utf-8')`，若超过 5 MB（5 × 1024 × 1024 字节），拒绝保存并返回结构化错误
2. **定义错误码 `DOCUMENT_SIZE_EXCEEDED`**：返回 `{ code: "DOCUMENT_SIZE_EXCEEDED", message: "..." }`，携带当前文档大小和上限信息
3. **在 `documentCoreService.save()` 中增加同样的体积校验**：作为防御性第二道关卡，即使 IPC 层被绕过，Service 层也拒绝超限文档
4. **渲染进程保存失败后通过已有错误展示机制告知用户**：状态栏展示保存失败状态，错误信息通过 `getHumanErrorMessage()` 映射为用户友好文案

---

## Scope：涉及范围

- **涉及的 openspec 主规范**: `openspec/specs/document-management/spec.md`
- **涉及的源码文件**:
  - `apps/desktop/main/src/ipc/file.ts`（保存 IPC 处理函数）
  - `apps/desktop/main/src/services/documents/documentCoreService.ts`（文档保存 Service）
  - `apps/desktop/main/src/ipc/contract/ipc-contract.ts`（错误码注册）
- **所属任务簇**: P0-6（基础输入输出防线）
- **前置依赖**: 无
- **下游影响**: A0-02（自动保存失败可见化）将受益——自动保存触发 size exceeded 时，用户可通过 A0-02 建立的失败反馈通道看到提示

---

## Non-Goals：明确不做什么

1. **不实施前端实时体积监控**——不在编辑器输入过程中实时检测文档体积、不在编辑器 UI 上显示当前字节数或进度条
2. **不修改 5 MB 阈值本身**——阈值由 Spec 和 Owner 决策固定，本任务不讨论阈值是否合理
3. **不实施渐进式告警（如 4 MB 黄色警告、4.5 MB 橙色警告）**——v0.1 仅做硬拦截，渐进式告警属于 Phase 1+ 体验增强
4. **不处理导出链路的体积校验**——导出体积上限（20 MB）已在 Spec 中定义，由独立任务负责
5. **不修改 TipTap JSON 序列化格式以减小体积**——序列化格式优化属于编辑器模块改进，不在本任务范围

---

## 依赖与影响

- **上游依赖**: 无
- **被依赖于**: A0-02（自动保存失败可见化）——当自动保存因文档超限失败时，A0-02 的失败反馈机制可展示 `DOCUMENT_SIZE_EXCEEDED` 错误
