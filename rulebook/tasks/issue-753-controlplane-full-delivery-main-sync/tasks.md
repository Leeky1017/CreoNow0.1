## 1. Implementation
- [x] 1.1 以 issue #753 建立受治理交付分支并确认基线提交
- [x] 1.2 纳入控制面全部待交付文件（代码、文档、归档目录）
- [x] 1.3 补齐 Rulebook 任务与 RUN_LOG 证据链

## 2. Testing
- [x] 2.1 运行受影响前端单测集合（layout + settings-dialog）
- [x] 2.2 执行 typecheck 与 lint 基线验证

## 3. Delivery
- [ ] 3.1 创建 PR（Closes #753）并开启 auto-merge
- [ ] 3.2 等待 required checks 全绿并完成合并回 main
- [ ] 3.3 控制面同步 main，确认 `local main == origin/main`
