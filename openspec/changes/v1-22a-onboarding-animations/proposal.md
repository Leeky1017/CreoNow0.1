# v1-22a: 补齐 Onboarding 品牌动画

> 属于 v1-22-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境

v1-22 已完成渐变 token（16 条）、插画系统（6 SVG）、品牌色阶（accent-50~900）、品牌 Spinner。
唯一未完成 AC：OnboardingSteps 步骤切换动画 + 品牌渐变背景 + 完成庆祝。

## 当前状态

- `grep -rn 'step-slide\|confetti' SRC/features/onboarding/ --include='*.css' --include='*.tsx'` → 0
- `ls SRC/features/onboarding/` → 无 onboarding.css
- OnboardingSteps.tsx 仅有 `transition-colors`，无 keyframe 动画
- OnboardingPage.tsx 已有 `bg-[image:var(--gradient-surface)]` + brand-spinner

## 目标状态

- `onboarding.css` 包含 step-slide-in/out + confetti-burst keyframes
- OnboardingSteps 步骤切换有 slide+fade 过渡
- 完成步骤后有庆祝动画
- 动效尊重 prefers-reduced-motion

## 不做什么

- 不修改渐变 token（已完成）
- 不修改 SVG 插画（已完成）
- 不引入 JS 动画库

## 完成验证

1. `grep -rn 'step-slide' SRC/features/onboarding/ | wc -l` → ≥ 3
2. `grep -rn 'confetti' SRC/features/onboarding/ | wc -l` → ≥ 2
3. `pnpm typecheck` → 0 errors
4. `pnpm -C apps/desktop exec vitest run onboarding` → all pass
