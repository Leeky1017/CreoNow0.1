# 好测试与反模式


## 什么是好测试

一个好测试至少满足五条标准：

1. **独立**：不依赖执行顺序，不共享可变状态。
2. **确定**：固定输入、固定时序、固定外部依赖，重复运行结果一致。
3. **行为导向**：断言用户可观察的结果，而不是内部实现细枝末节。
4. **失败可定位**：红灯亮起时，能看出是哪个行为回归，而不是只见一团雾。
5. **读起来像 spec**：测试名能说清“在什么前提下，系统应该如何表现”。

## TDD 不是口号

CreoNow 采用 `Red -> Green -> Refactor`：

1. 先写一个最小失败测试，确认它因为“行为尚未实现”而失败。
2. 再写最小实现，让这个测试变绿。
3. 最后清理命名、提炼辅助函数，但不顺手扩需求。

若测试一写就绿，不算完成 Red；若修完代码不回头跑测试，不算完成 Green。

## 反模式清单

### 反模式 1：只验证“文件里出现了某个字符串”

- 症状：`readFileSync(...)` + 正则或字符串匹配，检查源码“包含某段字面量”。
- 风险：测到的是代码外形，不是行为本身；一旦重构，测试要么误报，要么静默漏报。
- 只在 Guard / Lint 无法覆盖的跨文件约束下，才允许做静态扫描。

### 反模式 2：只验存在，不验结果

- 症状：大量 `toBeTruthy()`、`toBeDefined()`，却不验证内容、顺序或错误码。
- 风险：测试通过并不能证明行为正确，只能证明“某物曾经存在”。
- 优先使用具体断言：`toEqual`、`toStrictEqual`、`toMatchObject`、`toHaveTextContent`。

### 反模式 3：过度 mock，最后只测到了 mock 自己

- 症状：被测对象的所有依赖都被替成无行为桩，最后只剩 `expect(mock).toHaveBeenCalledTimes(1)`。
- 风险：测试无法证明真实输入输出是否成立。
- 只 mock 边界，不 mock 核心行为；mock 的目的是隔离外部依赖，不是让业务逻辑消失。

### 反模式 4：只有 happy path，没有 edge / error

- 症状：只验证成功渲染、成功返回、成功保存。
- 风险：最容易回归的错误路径无人看守。
- 每个核心行为至少要想清三条路：happy、edge、error。

### 反模式 5：测试名不表达意图

- 症状：`test1`、`should work`、`returns true`。
- 风险：失败时无法知道规格到底是什么。
- 推荐格式：`it('should <expected behavior> when <condition>')`

## 仓库中的正例
> **自动化守门**：`describe()` 结构要求现由 ESLint 规则 `creonow/require-describe-in-tests` 自动拦截。新测试文件缺少 `describe()` 将直接阻断 CI；存量目录暂以 warn 过渡，随 T-MIG 批次迁移逐步收紧为 error。
这些文件值得当作“如何写”的样板：

- `apps/desktop/renderer/src/stores/onboardingStore.test.tsx`
  - Store 测试结构清晰，依赖隔离明确，覆盖正常路径与 Provider 缺失边界。
- `apps/desktop/renderer/src/features/export/ExportDialog.test.tsx`
  - 用 RTL + `userEvent` 驱动真实交互，覆盖成功、进度、失败多条路径。
- `apps/desktop/tests/e2e/command-palette.spec.ts`
  - 用 `data-testid` 和用户视角验证关键路径，清理动作清楚，平台差异有明确注释。
- `apps/desktop/renderer/src/stores/__tests__/searchStore.race.test.ts`
  - 通过 deferred 控制异步竞态，验证“过时结果不得覆盖新结果”这一真实行为。

## 仓库中的反例

这些文件体现了当前要主动避免的写法：

- `scripts/tests/lint-ratchet-regression.test.ts`
  - 顶层裸块替代 `describe/it`，难以定位单个行为。
- `apps/desktop/tests/unit/s2-test-timing-fix.guard.test.ts`
  - Guard 测试仍以脚本式静态扫描为主，失败粒度偏粗。
- `apps/desktop/main/src/services/memory/episodic-memory-helpers-extract.test.ts`
  - 断言覆盖偏窄，边界与错误路径表达不足。

已完成迁移的试点样本与整改收益，见 `08-migration-and-review-playbook.md`。

## 什么时候拆测试，什么时候合测试

- 一个 `it` 只验证一个行为。
- 多个用例共享同一 Arrange 且语义相近时，用 `describe` + `beforeEach`。
- 不同用户流、不同错误语义，不要强行塞进一个 `describe`。
- 读测试时如果常常需要“脑内切换场景”，就说明拆得还不够。

## 最后一道判断

在提交前，问自己三个问题：

1. 如果这个测试失败，我能否立刻知道哪条行为回归了？
2. 如果我明天重构实现，这个测试还能继续保护行为吗？
3. 如果删掉这个测试，是否真的会失去一块用户价值的护栏？

若三问不能自洽，这个测试多半还没有写到位。
