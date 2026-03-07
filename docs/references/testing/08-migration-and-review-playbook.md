# 弱测试迁移与评审手册

更新时间：2026-03-07 11:40

## 目标

这份手册不讨论“理想中的测试”，只回答两个现实问题：

1. 旧测试怎么改，不至于越改越乱？
2. review 时怎么识别“看起来有测试，实际上没护栏”的代码？

## 三类优先整改对象

### 1. 脚本式测试

典型表现：

- 顶层 `async main()`
- 手工退出码
- 不走 `describe/it`
- 不进入标准 vitest 报告

优先样本：

- `apps/desktop/tests/unit/projectService.ai-assist.test.ts`

整改方向：

- 迁移到 vitest
- 每个行为拆成独立用例
- 用断言替代 `console.log`

### 2. Guard / Contract 裸块测试

典型表现：

- 顶层裸代码块
- 一次性检查多个无关约束
- 失败后很难定位是哪个规则坏了

优先样本：

- `scripts/tests/lint-ratchet-regression.test.ts`
- `apps/desktop/tests/unit/document-ipc-contract.test.ts`

整改方向：

- 使用 `describe/it`
- 明确每个规则的失败消息
- 将“静态规则”与“契约行为”分开组织

### 3. 前端查询反模式

典型表现：

- 全靠硬编码文案查询
- 只看元素存在，不驱动交互
- 没有错误态或空态

优先样本：

- `apps/desktop/renderer/src/features/onboarding/OnboardingPage.test.tsx`

整改方向：

- 优先 role / label / testid
- 从用户操作开始，而不是从内部状态开始
- 增补空态 / 错误态 / 加载态

## 正例样本池

| 文件                                                              | 可学习点                                           |
| ----------------------------------------------------------------- | -------------------------------------------------- |
| `apps/desktop/renderer/src/stores/onboardingStore.test.tsx`       | store 行为、provider 边界、持久化断言清晰          |
| `apps/desktop/renderer/src/features/export/ExportDialog.test.tsx` | RTL + `userEvent` 驱动真实交互，覆盖成功与失败路径 |
| `apps/desktop/tests/e2e/command-palette.spec.ts`                  | 关键路径 E2E、隔离 `userDataDir`、平台差异显式处理 |

## 弱例样本池

| 文件                                                       | 当前问题                            | 迁移方向                       |
| ---------------------------------------------------------- | ----------------------------------- | ------------------------------ |
| `apps/desktop/tests/unit/projectService.ai-assist.test.ts` | 脚本式 `main()`，不进入标准测试报告 | 迁移为 vitest 的行为用例       |
| `scripts/tests/lint-ratchet-regression.test.ts`            | 顶层裸块、多个规则揉在一起          | 拆为 `describe/it`，按行为命名 |
| `apps/desktop/tests/unit/document-ipc-contract.test.ts`    | 契约断言分散、可读性差              | 建立统一 contract test 模板    |

## 迁移前后应比较什么

| 维度         | 迁移前                   | 迁移后                 |
| ------------ | ------------------------ | ---------------------- |
| 发现方式     | 手工脚本或顶层裸块       | 标准 vitest 发现与报告 |
| 行为粒度     | 一大段脚本逻辑           | 一个行为一个用例       |
| 失败可定位性 | 只知道“脚本失败了”       | 直接知道哪条规格回归   |
| 查询 / 断言  | 依赖硬编码文案或浅层断言 | 语义化查询与具体断言   |
| 维护成本     | 重构时脆弱、误报多       | 可读、可扩展、可复用   |

## 本轮试点整改

### 1. `apps/desktop/tests/unit/projectService.ai-assist.test.ts`

- 迁移前：顶层 `async main()` + `assert`，靠进程退出码表达失败，不进入标准 vitest 报告。
- 迁移后：改为 `describe/it` 结构，并把资源创建/清理抽成 helper。
- 收益：
  - 由“脚本成败”变成“具体行为成败”
  - 新增 blank prompt / screenplay 分类断言
  - 自动进入 unit vitest bucket

### 2. `apps/desktop/tests/unit/document-ipc-contract.test.ts`

- 迁移前：六段顶层契约断言块 + `console.log` 收尾。
- 迁移后：拆为六个具名 `it`，抽出 `hasField()` 复用 helper。
- 收益：
  - 契约回归定位粒度从“整文件失败”下降到“具体场景失败”
  - 可直接扩展新的 request / response 字段断言
  - 不再依赖脚本式输出作为成功信号

### 3. `apps/desktop/renderer/src/features/onboarding/OnboardingPage.test.tsx`

- 迁移前：依赖硬编码欢迎文案，更多在测“显示了某句话”。
- 迁移后：改用 `data-testid` + `userEvent`，验证初始壳层、语言选择、副作用与步骤切换。
- 收益：
  - 降低对 i18n 文案漂移的脆弱依赖
  - 让 smoke test 更贴近真实交互
  - 与 `Onboarding.wizard.test.tsx`、`Onboarding.open-folder.test.tsx` 的职责边界更清楚

## 迁移步骤

1. 先识别该测试到底想守护什么行为。
2. 把一个“大脚本”拆成若干行为用例。
3. 先写出失败测试，确认它真的能抓住当前缺口。
4. 再重写实现或测试基座，让用例独立、可读、可定位。
5. 最后补上 review 说明：这次迁移到底减少了什么风险。

## Review 清单

- 这个测试失败时，能看出是哪条行为坏了吗？
- 查询方式是否稳定、语义化？
- 是否覆盖了 edge / error，而不只有 happy path？
- mock 是否只隔离边界，而不是吞掉了业务逻辑？
- 若是 Guard，ESLint 真的做不到吗？
- 若是 E2E，它真的在守关键路径吗？

## 迁移产物要求

每次整改都应留下三样东西：

1. 新测试代码
2. 迁移原因说明
3. 可复用模板或约定总结

否则这次整改只是“还债”，不是“建桥”。

## 何时不该迁移

以下情况不要贸然大改：

- 该测试正在守住一个你还没理解清楚的历史 bug
- 你打算一边迁移测试，一边重写整片业务逻辑
- 没有准备好等价行为断言，只是想把代码“改漂亮”

迁移的目标是让护栏更稳，不是顺手做一轮美学清扫。
