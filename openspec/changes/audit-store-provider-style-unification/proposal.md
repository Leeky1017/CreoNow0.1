# 提案：audit-store-provider-style-unification

更新时间：2026-02-25 23:50

## 背景

审计报告（十-10.4、十三-13.1）发现 Store Provider 模式存在风格不一致：5 个 `.ts` store 文件使用 `React.createElement()` 创建 Provider，2 个 `.tsx` store 文件使用 JSX 语法。两种范式混用增加了代码阅读与维护的认知负担，且缺乏 lint 规则防止新代码继续引入不一致模式。

## 变更内容

- 将 5 个使用 `React.createElement()` 的 `.ts` store 文件统一改为 `.tsx` + JSX 范式
- 更新相关 import 路径（`.ts` → `.tsx` 文件扩展名变更）
- 添加 lint/检查规则，禁止在 store 文件中使用 `React.createElement()` 创建 Provider，防止风格回归

## 受影响模块

- workbench — 5 个 .ts store 文件改为 .tsx + JSX

## 不做什么

- 不重构 store 的业务逻辑或状态管理模式
- 不处理 `IpcInvoke` 类型重复定义问题（属于 C8 范围）
- 不修改 store 的 zustand 配置或中间件
- 不改变 store 的对外 API 契约

## 依赖关系

- 上游依赖：C8（`audit-type-contract-alignment`）— 类型契约对齐完成后再做风格统一，避免文件重命名与类型修改冲突
- 下游依赖：无

## 来源映射

| 来源 | 提炼结论 | 落地位置 |
| --- | --- | --- |
| 审计报告 十-10.4 | 5 个 .ts store 用 React.createElement，2 个 .tsx 用 JSX，应统一 | `specs/workbench/spec.md` |
| 审计报告 十三-13.1 | 多贡献者导致 JSX vs React.createElement 不一致，需规范化 | `specs/workbench/spec.md` |

## 审阅状态

- Owner 审阅：`PENDING`
