# 测试规范主源


> “工欲善其事，必先利其器。”
> 对 CreoNow 而言，测试不是交差的器物，而是把行为、边界与证据钉在地上的木楔。

本目录是 CreoNow 测试规范的唯一主源（SSOT）。

## 阅读顺序

1. `01-philosophy-and-anti-patterns.md`
2. `02-test-type-decision-guide.md`
3. 按任务类型继续阅读：
   - 前端：`03-frontend-testing-patterns.md`
   - 后端 / 服务 / IPC：`04-backend-testing-patterns.md`
   - E2E：`05-e2e-testing-patterns.md`
   - Guard / Lint：`06-guard-and-lint-policy.md`
4. 需要执行命令或核对 CI 时：`07-test-command-and-ci-map.md`
5. 需要整改历史弱测试或做 review 时：`08-migration-and-review-playbook.md`

## 三条总原则

### 1. 测试行为，不测实现

- 优先断言用户能观察到的输入、输出、状态变化、错误路径。
- 谨慎断言内部调用次数、私有函数结构或 mock 自身行为。

### 2. 测试是兜底，不是仪式

- 每个测试都要回答“它在防什么回归”。
- 没有失败信息价值、没有行为信号、没有边界判断的测试，宁缺毋滥。

### 3. 静态约束归 Lint，运行时行为归 Test

- 能由 ESLint 可靠表达的规则，不写 Guard 测试。
- 需要跨文件、跨层、跨工序验证的约束，才考虑 Guard 或契约测试。

## 与仓库规则的关系

- Agent 行为约束：`AGENTS.md`、`CLAUDE.md`
- 项目概览：`openspec/project.md`
- 交付主源：`docs/delivery-skill.md`
- 设计与视觉验收：`docs/references/design-ui-architecture.md`

## 何时必须回到这里

- 写任何新测试之前
- 修复 bug 并补回归测试时
- 审查 “这个规则该写测试、写 ESLint，还是写 Guard” 时
- 发现 CI 命令、PR 模板、脚本入口与文档说法不一致时

## 本目录回答的问题

| 文档                                  | 回答的问题                                          |
| ------------------------------------- | --------------------------------------------------- |
| `01-philosophy-and-anti-patterns.md`  | 什么是好测试？什么是空壳测试？                      |
| `02-test-type-decision-guide.md`      | 这次该写单元、集成、E2E、Guard 还是 Contract？      |
| `03-frontend-testing-patterns.md`     | 前端组件、Store、Hook、i18n、Storybook 应该怎么测？ |
| `04-backend-testing-patterns.md`      | Service、IPC、DB、AI/LLM、确定性裁剪应该怎么测？    |
| `05-e2e-testing-patterns.md`          | Electron + Playwright 的端到端约定是什么？          |
| `06-guard-and-lint-policy.md`         | Guard 与 ESLint 的边界在哪里？                      |
| `07-test-command-and-ci-map.md`       | 本地命令、CI job、coverage、storybook 如何对应？    |
| `08-migration-and-review-playbook.md` | 历史弱测试如何迁移？review 时看什么？               |

---

## 否定测试（Negative Testing）

> 覆盖 Tier 2 Pattern #15（假 UI 无否定测试）、#16（Export 虚假声称）

**何时需要否定测试**：组件/功能被标记为"占位"、"假 UI"、"未实现"时，必须有明确的否定测试证明该组件**不提供**声称的能力。

**约定**：

1. 假 UI / 占位组件必须有 `describe('should NOT ...')` 测试块，至少包含一个 `it()` 断言该组件不提供编辑/保存/导出等能力
2. 能力声明必须有真实性验证测试——如果 spec 声称"支持 Markdown 导出"，必须有测试调用导出函数并检查输出
3. 异步操作的拒绝路径必须有测试覆盖——包括超时、权限不足、资源不存在等场景

**示例**：

```tsx
// ❌ 错误：看起来有编辑功能但没有否定测试
describe('ZenMode', () => {
  it('renders', () => { ... });
});

// ✅ 正确：明确断言不可编辑
describe('ZenMode (readonly placeholder)', () => {
  describe('should NOT provide editing', () => {
    it('should NOT render editable textarea', () => {
      render(<ZenMode />);
      expect(screen.queryByRole('textbox')).toBeNull();
    });
    it('should NOT respond to keyboard input', () => { ... });
  });
});
```

---

## Guard 测试要求

> 覆盖 Tier 2 Pattern #23（Guard 测试浅层化）

**约定**：

1. 每个 gate 的测试必须包含 **≥1 PASS fixture** 和 **≥1 FAIL fixture**
2. PASS fixture：构造符合规范的代码/结构 → gate 不报告违规
3. FAIL fixture：构造违规代码/结构 → gate 正确检出并报告违规
4. FAIL fixture 必须覆盖该 gate 的**关键违规模式**，不能只测最简单的情况
5. CJK / 多语言场景作为推荐测试维度——如果 gate 检测文本/i18n 相关问题，应包含 CJK 测试用例

**示例**：

```ts
// PASS fixture: 有 size 检查的 writeFile
{
  const root = setupTestDir();
  writeFileSync(path.join(root, 'safe.ts'), `
    if (Buffer.byteLength(data) > MAX_SIZE) throw new Error("Too large");
    fs.writeFileSync(path, data);
  `);
  const violations = scanViolations(root);
  assert.equal(violations.length, 0, "Size-checked write should PASS");
}

// FAIL fixture: 无 size 检查的 writeFile
{
  const root = setupTestDir();
  writeFileSync(path.join(root, 'unsafe.ts'), `
    fs.writeFileSync(path, data);
  `);
  const violations = scanViolations(root);
  assert.equal(violations.length, 1, "Unchecked write should FAIL");
}
```
