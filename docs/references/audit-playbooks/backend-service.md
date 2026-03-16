# 后端 Service 审计 Playbook

> 适用条件：变更层 WHERE=`backend`（`apps/desktop/main/**`）
> 审计层级：Tier S 及以上

---

## 必查项（Tier S）

### 1. ServiceResult 模式

- [ ] 所有 Service 公开方法是否返回 `ServiceResult<T>`？
- [ ] 错误路径是否返回 `ServiceResult.fail()` 而非抛出异常？
- [ ] 调用方是否正确处理了 `success === false` 的情况？

### 2. 错误处理

- [ ] 关键路径是否有 try-catch？
- [ ] 是否使用结构化错误（Error 子类或错误码），而非裸字符串？
- [ ] 是否存在 silent failure（catch 块为空或仅 `console.log`）？
- [ ] 异步操作是否有超时处理？

### 3. 日志

- [ ] 关键业务路径是否有 structured logging（非 `console.log`）？
- [ ] 日志是否包含上下文信息（操作类型、关键参数、耗时）？
- [ ] 敏感信息（用户数据、密钥）是否被过滤？

### 4. 测试覆盖

- [ ] 新增的每个 public 方法是否有对应测试？
- [ ] 是否覆盖了 happy path + error path？
- [ ] 边界条件是否有测试（null / undefined / 空数组 / 超长输入）？

### 5. 测试质量

- [ ] 测试是否验证行为（observable output），而非实现（mock 调用次数）？
- [ ] mock 是否仅用于边界依赖（数据库、文件系统、LLM），而非内部模块？
- [ ] 测试名称是否说明前置条件和预期行为？

### 6. TypeScript 严格性

- [ ] 是否有 `any` 类型？（禁止）
- [ ] 是否有 `as unknown as`、`@ts-ignore`、`@ts-expect-error`？（需要强理由）
- [ ] 新增函数参数和返回值是否有明确类型？

### 7. 数据库操作

- [ ] SQL 查询是否使用参数化（`?` 占位符），而非字符串拼接？
- [ ] 事务操作是否正确（begin → commit / rollback）？
- [ ] 数据库 schema 变更是否有迁移脚本？

---

## 追加项（Tier D / 跨模块时必查）

### 8. 依赖注入

- [ ] 新增 Service 是否通过工厂模式 / DI 注册？
- [ ] 是否避免了循环依赖？

### 9. 并发安全

- [ ] 共享状态（单例 Service 的内部状态）是否有竞态风险？
- [ ] 文件系统操作是否有锁或排队机制？

### 10. IPC 暴露

- [ ] 如果 Service 通过 IPC 暴露给渲染进程，输入验证是否充分？
- [ ] IPC handler 的类型是否与 `packages/shared/` 中的 contract 一致？

### 11. 性能

- [ ] 是否引入了 O(n²) 或更差的算法复杂度？
- [ ] 大数据量场景（1000+ 条记录、10K+ 字文档）是否考虑分页或流式处理？
- [ ] 是否有不必要的同步 I/O（`readFileSync`、`execSync`）？
