# Proposal: fe-token-escape-sweep

## Summary

Sweep all `features/**/*.tsx` files to replace hardcoded design escapes (hex/rgba colors, numeric z-index, `transition-all`, `h/w-screen`) with CSS custom property tokens defined in `tokens.css`.

## Motivation

Raw color values, magic z-index numbers, and `transition-all` in Tailwind classes bypass the design token system, making theme changes fragile and visual consistency hard to maintain. Guard tests will prevent future regressions.

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
