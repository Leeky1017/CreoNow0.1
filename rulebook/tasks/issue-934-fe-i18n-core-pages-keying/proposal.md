# fe-i18n-core-pages-keying — Proposal

更新时间：2026-03-03 16:00

## Summary

核心页面（Dashboard / Onboarding / SearchPanel / AiPanel）硬编码可见字符串全部迁移为 `t()` i18n key。修复日期/相对时间本地化（不硬编码 `en-US`）。

## Why

用户切换语言后，核心页面仍有大量中英文混杂，严重影响体验。日期格式化硬编码 `en-US` 使得中文用户看到英文月份。

## What Changes

- DashboardPage.tsx: 所有硬编码中英文 → `t()` key
- SearchPanel.tsx: 所有硬编码中英文 → `t()` key
- AiPanel.tsx: 残余硬编码中文 → `t()` key
- OnboardingPage.tsx: `isEn ? ... : ...` 三元表达式 → `t()` key
- locales/zh-CN.json + en.json: 补齐全部新增 key
- formatDate/formatRelativeTime: locale 参数化

## Impact

- Affected specs: `openspec/specs/workbench/spec.md` (i18n scenarios)
- Affected code: 4 core pages + locale files + date utilities
