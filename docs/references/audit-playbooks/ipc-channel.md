# IPC 通道审计 Playbook

> 适用条件：变更层 WHERE=`preload`（`apps/desktop/preload/**`）或变更涉及 IPC 通道
> 审计层级：Tier S 及以上（IPC 变更通常自动升至 Tier D）

---

## 必查项（Tier S）

### 1. 三层类型一致性

- [ ] `main` handler 的参数 / 返回类型是否与 `packages/shared/` 中的 IPC contract 定义一致？
- [ ] `preload` bridge 是否正确转发——接口签名是否与 contract 匹配？
- [ ] `renderer` 调用端（`window.api.*`）的类型是否与 preload 暴露的接口一致？
- [ ] 如果变更了 contract，三层是否全部同步更新？

### 2. Preload 暴露面最小化

- [ ] `contextBridge.exposeInMainWorld` 是否只暴露了必要的 API？
- [ ] 是否有新增的暴露函数？新增暴露是否有对应的 spec / Issue 授权？
- [ ] 是否有暴露了 Node.js API（`fs`、`child_process`、`path`）的危险操作？

### 3. 输入验证（main handler 端）

- [ ] main handler 是否验证了来自 renderer 的输入参数？
- [ ] 文件路径参数是否做了路径遍历检查（防止 `../../etc/passwd`）？
- [ ] 字符串参数是否有长度限制或格式验证？

### 4. 错误传播

- [ ] Service 错误是否正确序列化跨进程？（`Error` 对象不能直接通过 IPC 传递）
- [ ] renderer 端是否正确处理了 IPC 调用失败的情况？
- [ ] 是否有超时机制防止 IPC 调用永远挂起？

### 5. 测试覆盖

- [ ] IPC handler 是否有对应的单元测试（mock `event` 对象）？
- [ ] 是否有 contract 测试验证三层类型一致？
- [ ] 错误路径（参数无效、Service 失败）是否有测试？

---

## 追加项（Tier D 必查）

### 6. 安全审查

- [ ] 新增 IPC 通道是否可能被恶意渲染进程利用？
- [ ] 是否有 IPC 通道暴露了文件系统写入能力？
- [ ] 是否有 IPC 通道暴露了 shell 执行能力？

### 7. 性能

- [ ] 大数据量传输（如文档内容、知识图谱）是否有流式 / 分页处理？
- [ ] 高频 IPC 调用（如编辑器内容同步）是否有节流 / 防抖？

### 8. 向后兼容

- [ ] 修改已有 IPC 通道的签名是否会破坏已有调用方？
- [ ] 是否需要版本化或渐进迁移？
