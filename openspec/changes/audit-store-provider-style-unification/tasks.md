更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（5 个 .ts store 改 .tsx + JSX, lint 规则防回归）
- [ ] 1.2 审阅并确认错误路径与边界路径（必须覆盖：文件重命名后 import 路径同步、Provider 渲染行为一致性、lint 规则检测 React.createElement 回归）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（store 目录零 React.createElement；tsc --noEmit 通过；Provider 渲染输出不变；lint 规则阻止回归）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：上游依赖 C8 `audit-type-contract-alignment`）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                    | 计划用例名 / 断言块                                                                          |
| ----------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| AUD-C14-S1  | `apps/desktop/renderer/src/__tests__/unit/store-provider-jsx-unification.test.ts`           | `all store files should be .tsx with JSX syntax and zero React.createElement in store dir`    |
| AUD-C14-S2  | `apps/desktop/renderer/src/__tests__/unit/store-rename-import-paths.test.ts`                | `tsc --noEmit should pass with no unresolved module references after .ts to .tsx rename`      |
| AUD-C14-S3  | `apps/desktop/renderer/src/__tests__/unit/store-provider-render-parity.test.ts`             | `store Provider render output should be identical before and after JSX migration`             |
| AUD-C14-S4  | `apps/desktop/renderer/src/__tests__/unit/store-provider-lint-guard.test.ts`                | `lint rule should error on React.createElement in store files and block CI merge`             |

## 3. Red（先写失败测试）

- [ ] 3.1 **全 JSX + 零 createElement**：扫描 `renderer/src/stores/` 目录，断言所有文件为 `.tsx` 扩展名且不含 `React.createElement` 调用（AUD-C14-S1）
- [ ] 3.2 **import 路径无断裂**：`tsc --noEmit`，断言重命名 `.ts → .tsx` 后无 unresolved module 错误（AUD-C14-S2）
- [ ] 3.3 **渲染输出一致**：对每个 store 的 Provider 组件，分别用 JSX 和原 `React.createElement` 渲染，断言 DOM 输出严格相等（AUD-C14-S3）
- [ ] 3.4 **lint 防回归**：在 store 文件中写入 `React.createElement(Provider, ...)`，断言 eslint 报错阻止提交（AUD-C14-S4）

## 4. Green（最小实现通过）

- [ ] 4.1 将 5 个 `.ts` store 文件重命名为 `.tsx`（`kgStore.ts` → `kgStore.tsx`、`memoryStore.ts` → `memoryStore.tsx`、`fileStore.ts` → `fileStore.tsx`、`aiStore.ts` → `aiStore.tsx`、`searchStore.ts` → `searchStore.tsx`）
- [ ] 4.2 将每个文件中的 `React.createElement(XxxProvider, { value: ... }, children)` 替换为 `<XxxProvider value={...}>{children}</XxxProvider>` JSX 语法
- [ ] 4.3 更新所有引用这 5 个文件的 import 路径（如需显式扩展名引用的场景）
- [ ] 4.4 在 `.eslintrc.cjs` 中添加针对 `renderer/src/stores/**` 的规则：禁止 `React.createElement` 模式

## 5. Refactor（保持绿灯）

- [ ] 5.1 检查 `.tsx` 重命名后 Storybook / 测试 / 构建配置是否需要同步更新 glob pattern
- [ ] 5.2 确认 lint 规则范围是仅限 stores 目录还是全 renderer（推荐全 renderer 统一 JSX）
- [ ] 5.3 清理可能因重命名产生的 git 追踪问题（确保 git 识别为 rename 而非 delete+add）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
