# Workbench Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-store-provider-style-unification

### Requirement: Store Provider 必须统一为 .tsx + JSX 范式 [ADDED]

所有 store 文件的 Provider 创建**必须**使用 `.tsx` 文件 + JSX 语法，禁止使用 `React.createElement()` 方式。当前 5 个 `.ts` store 使用 `React.createElement()`，2 个 `.tsx` store 使用 JSX，**必须**统一到 JSX 范式。

#### Scenario: AUD-C14-S1 所有 store Provider 使用 JSX 语法 [ADDED]

- **假设** 代码库中存在 5 个 `.ts` store 文件使用 `React.createElement()` 创建 Provider
- **当** 执行本次变更的范式统一
- **则** 所有 store 文件均为 `.tsx` 扩展名，Provider 创建使用 JSX 语法
- **并且** 在 store 目录中搜索 `React.createElement` 结果为零

#### Scenario: AUD-C14-S2 文件扩展名变更后 import 路径正确 [ADDED]

- **假设** 5 个 store 文件从 `.ts` 重命名为 `.tsx`
- **当** TypeScript 编译器执行编译
- **则** `tsc --noEmit` 通过，无未解析的模块引用错误
- **并且** 所有引用这些 store 的文件的 import 路径已同步更新

#### Scenario: AUD-C14-S3 Store Provider 渲染行为不变 [ADDED]

- **假设** store Provider 已从 `React.createElement()` 改为 JSX
- **当** 应用启动并渲染 store Provider 组件树
- **则** Provider 的渲染输出与变更前完全一致
- **并且** 所有依赖 store 的组件功能行为不变

### Requirement: lint 规则必须防止 Store Provider 风格回归 [ADDED]

**必须**添加 lint 或静态检查规则，禁止在 store 文件中使用 `React.createElement()` 创建 Provider，防止新代码引入不一致模式。

#### Scenario: AUD-C14-S4 lint 规则检测 React.createElement 回归 [ADDED]

- **假设** 开发者在 store 文件中新增使用 `React.createElement()` 的 Provider 代码
- **当** 代码提交触发 lint 检查
- **则** lint 规则报错，指出应使用 JSX 语法替代 `React.createElement()`
- **并且** CI 流水线因 lint 失败而阻止合并
