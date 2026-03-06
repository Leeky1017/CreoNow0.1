# Proposal: a0-05-skill-router-negation-guard

## Why

当前 skill router 使用 `input.includes(keyword)` 做关键词命中，这会把否定表达误判为正向意图：

- `不要续写` 仍会命中 `builtin:continue`
- `别写下去` 仍会命中 `builtin:continue`
- `不要改写` 在选中文本场景下仍可能命中 `builtin:rewrite`

对用户而言，这不是“智能不够”，而是系统听反了话。Phase 0 必须先把这种明显误触收口。

## What Changes

本 change 将为 skill routing 增加最小可靠的否定语境守卫：

- 当关键词处在常见否定表达中时，不得命中对应 skill
- rewrite 的短指令启发式同样需要绕开否定表达
- 否定命中被抑制后，应继续走后续规则；若仍无匹配，则回退到 `builtin:chat`

## Scope

涉及模块：

- `openspec/specs/skill-system/spec.md`
- `apps/desktop/main/src/services/skills/skillRouter.ts`
- `apps/desktop/main/src/services/skills/__tests__/skillRouter.test.ts`

## Non-Goals

- 不引入 LLM 级语义路由
- 不解决无关键词 skill 的发现性问题
- 不改变现有正向关键词表
