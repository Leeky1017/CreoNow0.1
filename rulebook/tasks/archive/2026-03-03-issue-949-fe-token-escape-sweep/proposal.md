# Proposal: fe-token-escape-sweep
更新时间：2026-03-04 03:00

## Why

前端 Feature 层仍存在 37 处硬编码 hex/rgba 色值、10 处数字 z-index（`z-10`/`z-20`/`z-50`）、24 处 `transition-all` 滥用。这些 Token 逃逸绕过了 `tokens.css` 设计系统，导致主题切换不一致、视觉回归难以追溯、GPU 合成开销增大。本次清扫目标是将所有逃逸归零，并建立 guard 测试防止回潮。

## What

1. 创建 4 个 guard 测试（S1-S4）扫描 `features/**/*.tsx`，检测 hex/rgba、数字 z-index、`transition-all`、`h/w-screen` 逃逸
2. 将 37 处硬编码色值替换为 `var(--color-*)` token
3. 将 10 处数字 z-index 替换为 `var(--z-*)` 语义 token（`tokens.css` 已有定义）
4. 将 24 处 `transition-all` 替换为具体属性（`transition-colors`/`transition-opacity`/`transition-transform`）
5. 建立白名单机制覆盖合理例外（颜色选择器数据、第三方 API 约束等）

## Scope

- **In scope**: All `.tsx` files under `features/` (excluding `__tests__`, `.test.`, `.stories.`)
- **Out of scope**: `components/`, `stores/`, `styles/` (separate sweep if needed)

## Approach

1. Create 4 guard tests (S1-S4) using regex pattern scanning
2. Fix all violations via token substitution (TDD Green)
3. Whitelist files with legitimate non-token usage (color picker data, diff semantics, third-party API constraints)

## Risks

- Near-identical colors mapped to same token may drift in future redesigns (mitigated: document mapping decisions)
- tippy.js zIndex requires number type (mitigated: whitelist + inline comment)
