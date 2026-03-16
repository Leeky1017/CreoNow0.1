# 性能审计 Playbook

> 适用条件：Tier D 追加，涉及性能敏感变更
> 加载时机：变更涉及核心编辑器 / 大数据量处理 / 渲染性能 / 内存管理

---

## 后端性能（`apps/desktop/main/`）

### 1. 算法复杂度

- [ ] 是否引入了 O(n²) 或更差的算法？（需要强理由或数据量上限保证）
- [ ] 嵌套循环中是否有数据库查询（N+1 问题）？
- [ ] 字符串拼接是否在循环中使用（应改用 Array.join 或 StringBuilder 模式）？

### 2. I/O 效率

- [ ] 是否有不必要的同步 I/O（`readFileSync`、`execSync`）？
- [ ] 大文件读写是否使用流式处理（`createReadStream` / `createWriteStream`）？
- [ ] 数据库查询是否有索引支撑？频繁查询的字段是否已建索引？

### 3. 内存管理

- [ ] 是否有数据结构无限增长的风险（如缓存无上限、日志无清理）？
- [ ] 大对象（文档内容、知识图谱）是否在使用后释放引用？
- [ ] 事件监听器是否在组件 / Service 销毁时移除？

### 4. 批量操作

- [ ] 多条数据库操作是否使用事务包裹（减少 WAL 刷新次数）？
- [ ] 批量 IPC 调用是否可以合并为单次调用？

---

## 前端性能（`apps/desktop/renderer/`）

### 5. 渲染性能

- [ ] 是否有不必要的 re-render？（检查 Zustand selector、React.memo 使用）
- [ ] 大列表是否使用虚拟化（`react-window` / `react-virtuoso`）？
- [ ] 频繁更新的组件是否隔离在独立子树中？

### 6. 动画性能

- [ ] CSS 动画是否使用 GPU 加速属性（`transform`、`opacity`）？
- [ ] 是否有 layout-triggering 属性在动画中使用（`top`、`left`、`width`、`height`）？
- [ ] 是否有 `requestAnimationFrame` 替代 `setInterval` 用于动画？

### 7. 资源加载

- [ ] 图片 / 图标是否有懒加载？
- [ ] 大型依赖是否有代码分割（`React.lazy` / dynamic import）？
- [ ] 是否有不必要的大型依赖引入？

### 8. 内存泄漏

- [ ] `useEffect` 的 cleanup 是否正确清理了定时器、事件监听、订阅？
- [ ] `addEventListener` 是否有对应的 `removeEventListener`？
- [ ] 闭包中是否持有了不必要的大对象引用？

---

## 跨进程性能

### 9. IPC 吞吐

- [ ] 高频 IPC 调用是否有防抖 / 节流？
- [ ] 大数据量传输是否有序列化开销问题？（考虑 structured clone 限制）
- [ ] 是否可以将频繁读取的数据缓存在渲染进程侧？

---

## 审计证据要求

性能相关发现须包含：

1. 具体文件路径 + 行号
2. 性能风险类型（CPU / 内存 / I/O / 渲染）
3. 预估影响场景（如「10K 字文档编辑时可能卡顿」）
4. 修复建议
5. 阻断级别：核心路径性能退化 = SIGNIFICANT，极端场景 = MINOR
