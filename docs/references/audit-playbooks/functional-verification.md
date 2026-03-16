# 功能性验证审计 Playbook

> 「纸上得来终觉浅，绝知此事要躬行。」——陆游《冬夜读书示子聿》
> 代码 diff 再干净、测试再齐全，不代表功能真的生效了。功能性验证的核心是：**亲手验证行为**。

> 适用条件：所有涉及行为变更的 PR（`new-feature` / `bug-fix` / 行为性 `refactor`）
> 审计层级：Tier S 及以上必做；Tier L 在 WHAT ≠ `docs-only` / `style-only` 时也应做

---

## 设计理念

功能性验证回答一个核心问题：**用户得到的行为，是否与 spec 定义的行为一致？**

这不是测试覆盖率（CI 已验证），也不是代码风格（lint 已验证），而是：
1. 新功能是否真的可用？
2. 修复的 bug 是否真的修复了？
3. 优化是否真的生效了？
4. 重构后行为是否保持一致？

---

## 验证方法论

功能性验证有三种手段，审计 Agent 应至少使用一种：

### 方法 A：Spec Scenario 行为对照

最常用。将 `openspec/specs/<module>/spec.md` 中的 Scenario 逐条与实现对照。

步骤：
1. 列出 PR 关联 spec 中的所有 Scenario
2. 对每个 Scenario：
   - 找到实现该 Scenario 的代码路径（从入口到输出）
   - 找到验证该 Scenario 的测试
   - 确认测试断言的是**用户可观察的行为**（输出值、状态变化、UI 表现），而非实现细节
3. 标注 ✅（已覆盖）/ ❌（未覆盖）/ ⚠️（覆盖不充分）

### 方法 B：运行时验证

当 Spec Scenario 对照不足以确认功能生效时，亲手运行验证。

- **后端功能**：在测试中模拟完整调用链，检查输出是否符合预期
  ```bash
  # 用 vitest 跑目标测试，检查测试输出
  pnpm -C apps/desktop vitest run <pattern> --reporter=verbose
  ```
- **前端功能**：构建 Storybook 并检查组件渲染
  ```bash
  pnpm -C apps/desktop storybook:build
  # 检查 storybook-static/ 中对应组件的 Story 是否正确
  ```
- **IPC 功能**：检查三层调用链完整性
  ```bash
  # 验证 contract → handler → preload → renderer 全链路类型一致
  pnpm -C apps/desktop tsx ../../scripts/ipc-acceptance-gate.ts
  ```

### 方法 C：回归验证

确认变更没有破坏已有功能。

- 运行受影响模块的全量测试
- 检查 `git diff` 中被修改的文件，其调用方是否有对应测试
- 如果 PR 修改了被多处使用的公共函数/组件，跑全量测试

---

## 必查项

### 1. Spec-行为映射完整性
- [ ] PR 关联的 spec 中每个 Scenario 是否都有对应的实现代码？
- [ ] 每个 Scenario 是否都有对应的测试验证？
- [ ] 测试是否验证的是**用户可观察行为**（输出值、状态变化），而非实现细节（mock 调用次数、内部状态）？

### 2. 新功能可达性验证
- [ ] 新功能的入口点（UI 按钮 / IPC 通道 / API 方法）是否存在且可到达？
- [ ] 用户操作路径（点击→调用→处理→反馈）是否完整连通？
- [ ] 是否有「代码写了但实际上死路径」的情况（函数定义了但没有调用方、组件渲染了但没有入口）？

### 3. Bug 修复有效性验证（仅 `bug-fix` PR）
- [ ] PR 是否包含能精确复现原 bug 的测试？
- [ ] 该测试在修复前是否确实会失败？（Red → Green 证据）
- [ ] 修复是否治本（root cause）而非治标（workaround）？
- [ ] 修复是否引入了新的 edge case？

### 4. 行为一致性验证（仅 `refactor` PR）
- [ ] 重构前后的行为是否完全一致？（输入相同 → 输出相同）
- [ ] 是否有调用方因重构而收到不同的返回值/错误类型？
- [ ] 性能特征是否保持（无 O(n) → O(n²) 退化）？

### 5. 优化效果验证（仅性能优化 PR）
- [ ] 是否有 before/after 性能对比数据？
- [ ] 优化是否有测试保护（防止未来退化）？
- [ ] 优化是否牺牲了正确性？

### 6. 端到端路径完整性
- [ ] 涉及 IPC 的变更：main → preload → renderer 全链路是否测试覆盖？
- [ ] 涉及数据持久化的变更：写入 → 读取 → 验证是否有完整测试？
- [ ] 涉及 AI Service 的变更：mock LLM 后的完整调用链是否测试覆盖？

---

## 审计报告中的功能性验证输出格式

审计评论中，功能性验证应以独立章节呈现：

```markdown
### 功能性验证

**验证方法**：Spec Scenario 对照 + 运行时测试

| Spec Scenario | 实现状态 | 测试覆盖 | 行为验证 |
|--------------|---------|---------|---------|
| S1: 用户创建新文档时... | ✅ 已实现 | ✅ `createDocument.test.ts` | ✅ 测试验证了返回的文档对象包含正确的默认值 |
| S2: 用户保存文档失败时... | ✅ 已实现 | ⚠️ 有测试但只测了 happy path | ❌ BLOCKER：缺少 error path 的行为测试 |

**运行时验证命令与结果**：
（附命令输出）

**结论**：S2 的 error path 行为未验证 → BLOCKER
```

---

## 与其他 Playbook 的关系

功能性验证 Playbook 是**横切关注点**，不替代而是**补充**各变更层的专项 Playbook：

- `backend-service.md` 检查代码质量和结构 → 功能性验证检查**行为是否正确**
- `frontend-component.md` 检查 Token/i18n/a11y → 功能性验证检查**用户交互是否达到预期**
- `ipc-channel.md` 检查类型一致性 → 功能性验证检查**跨进程调用是否真的走通**

审计 Agent 应先跑专项 Playbook，再跑功能性验证——后者是质量守护的最后一道防线。
