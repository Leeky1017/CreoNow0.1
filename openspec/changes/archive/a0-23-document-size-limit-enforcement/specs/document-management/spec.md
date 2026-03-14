# Delta Spec: document-management — 文档 5MB 限制实施

- **Parent Change**: `a0-23-document-size-limit-enforcement`
- **Base Spec**: `openspec/specs/document-management/spec.md`
- **GitHub Issue**: #984

---

## 变更摘要

在文档保存链路（IPC 层 + Service 层）实施 5 MB 体积硬拦截，拒绝超限文档写入，返回结构化错误码。

---

## 变更 Requirement: 保存链路体积校验（新增）

文档保存链路**必须**在写入数据库之前校验 `contentJson` 的字节长度（UTF-8 编码），若超过 5 MB（5 × 1024 × 1024 = 5,242,880 字节），**必须**拒绝保存并返回结构化错误。

### 校验位置

体积校验**必须**在以下两层同时实施，形成防御纵深：

1. **IPC 层**：`file:document:save` 处理函数在参数校验通过后、调用 `documentCoreService.save()` 之前，计算 `Buffer.byteLength(contentJson, 'utf-8')`
2. **Service 层**：`documentCoreService.save()` 在事务开启前，对传入的 `contentJson` 执行同样的字节长度校验

### 错误码定义

体积超限**必须**返回以下结构化错误：

```typescript
{
  code: "DOCUMENT_SIZE_EXCEEDED",
  message: "文档大小超出限制（当前 ${currentSizeMB} MB，上限 5 MB）"
}
```

- `DOCUMENT_SIZE_EXCEEDED` **必须**注册到 `IpcErrorCode` 联合类型中
- 错误消息中**必须**包含当前文档大小（MB，保留一位小数）和上限值，便于排查
- 人话映射：`getHumanErrorMessage()` **必须**为 `DOCUMENT_SIZE_EXCEEDED` 提供用户友好文案，如「文档内容过大，请精简后重试」

### 阈值常量

体积上限**必须**定义为具名常量 `MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024`，禁止在校验逻辑中硬编码魔法数字。

### 计算方式

体积计算**必须**使用 `Buffer.byteLength(contentJson, 'utf-8')` 而非 `contentJson.length`——JavaScript `string.length` 返回 UTF-16 码元数量，非 UTF-8 字节数，对含多字节字符（中文）的文档会低估体积。

### 自动保存场景

自动保存（`reason: 'autosave'`）触发的保存请求**同样**受体积校验约束——不得因为是自动保存就绕过校验。自动保存被拦截时，渲染进程通过已有的保存失败反馈通道（状态栏/Toast）告知用户。

---

### Scenario: S-SIZE-1 正常体积文档保存成功（回归）

- **假设** 用户编辑的文档 `contentJson` 序列化后字节长度为 2 MB
- **当** 渲染进程通过 `file:document:save` 发起保存请求
- **则** IPC 层体积校验通过，请求正常传递到 `documentCoreService.save()`
- **并且** Service 层体积校验通过，文档写入数据库
- **并且** 返回 `{ ok: true, data: { updatedAt, contentHash } }`

### Scenario: S-SIZE-2 超限文档被 IPC 层拦截

- **假设** 用户粘贴了大量 Base64 图片数据，`contentJson` 序列化后字节长度为 7.3 MB
- **当** 渲染进程通过 `file:document:save` 发起保存请求
- **则** IPC 层计算 `Buffer.byteLength(contentJson, 'utf-8')` 得到 7.3 MB > 5 MB
- **并且** 返回 `{ ok: false, error: { code: "DOCUMENT_SIZE_EXCEEDED", message: "文档大小超出限制（当前 7.3 MB，上限 5 MB）" } }`
- **并且** 不调用 `documentCoreService.save()`，不写入数据库

### Scenario: S-SIZE-3 恰好 5 MB 的文档可以保存

- **假设** 用户编辑的文档 `contentJson` 序列化后字节长度恰好等于 5,242,880 字节（5 MB）
- **当** 渲染进程通过 `file:document:save` 发起保存请求
- **则** 体积校验通过（阈值判断为严格大于，等于时允许保存）
- **并且** 文档正常写入数据库

### Scenario: S-SIZE-4 超限一字节的文档被拦截

- **假设** 用户编辑的文档 `contentJson` 序列化后字节长度为 5,242,881 字节（5 MB + 1 byte）
- **当** 渲染进程通过 `file:document:save` 发起保存请求
- **则** 体积校验失败
- **并且** 返回 `{ ok: false, error: { code: "DOCUMENT_SIZE_EXCEEDED" } }`

### Scenario: S-SIZE-5 自动保存同样受体积校验约束

- **假设** 用户的编辑触发了自动保存（`reason: 'autosave'`），此时文档 `contentJson` 字节长度为 6 MB
- **当** 自动保存链路调用 `file:document:save`
- **则** IPC 层体积校验失败，返回 `{ ok: false, error: { code: "DOCUMENT_SIZE_EXCEEDED" } }`
- **并且** 自动保存不会绕过体积限制静默写入
- **并且** 渲染进程保存失败反馈通道收到错误通知

### Scenario: S-SIZE-6 Service 层作为第二道防线

- **假设** 某调用方直接调用 `documentCoreService.save()` 而非通过 IPC 通道（如内部批量操作）
- **当** 传入的 `contentJson` 字节长度超过 5 MB
- **则** Service 层独立的体积校验捕获超限
- **并且** 返回 Service 级别的错误结果，阻止写入数据库

---

## 约束

1. 体积阈值 5 MB 由 Spec 和 Owner 固定，实现 Agent 不可私自调整
2. 校验使用 `Buffer.byteLength()` 而非 `string.length`，禁止用字符数近似替代字节数
3. 阈值判断条件为 `> MAX_DOCUMENT_SIZE_BYTES`（严格大于），等于时允许保存
4. 错误码 `DOCUMENT_SIZE_EXCEEDED` 必须纳入 `IpcErrorCode` 联合类型，确保 TypeScript 类型安全
