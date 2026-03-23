# Tasks: v1-22a 补齐 Onboarding 品牌动画

- **父 change**: v1-22-\*
- **状态**: 📋 待实施
- **任务数**: 5

---

## 文件组 1：动画 CSS

- [ ] `onboarding.css` 创建步骤切换与庆祝 keyframes
      实例（新文件）:
      :新建 `features/onboarding/onboarding.css`
      :定义 `@keyframes step-slide-in`（opacity 0→1 + translateX 20px→0，duration: var(--duration-normal)）
      :定义 `@keyframes step-slide-out`（opacity 1→0 + translateX 0→-20px）
      :定义 `@keyframes confetti-burst`（完成庆祝粒子/checkmark 动画）
      :尊重 prefers-reduced-motion（duration: 0ms）
      验证: `grep '@keyframes' SRC/features/onboarding/onboarding.css | wc -l` → ≥ 3

## 文件组 2：步骤动画集成

- [ ] `OnboardingSteps.tsx` 集成步骤切换动画 + 品牌渐变背景
      实例（3 处）:
      :44 步骤按钮的 `transition-colors` 增强为 step-slide-in/out
      :根容器添加 `background: var(--gradient-hero)` 叠加
      :新增 CSS-only 光点装饰（pseudo-element，利用 --gradient-brand 低透明度）
      :引入 `import './onboarding.css'`
      验证: `grep 'step-slide\|gradient-hero' SRC/features/onboarding/OnboardingSteps.tsx | wc -l` → ≥ 2

- [ ] `OnboardingSteps.tsx` 添加完成庆祝动画
      实例（1 处）:
      :最后一步（OpenFolderStep）完成后触发 confetti-burst CSS animation
      :通过 `animation-play-state` 或 className toggle 控制
      验证: `grep 'confetti' SRC/features/onboarding/OnboardingSteps.tsx | wc -l` → ≥ 1

## 文件组 3：Story 与测试

- [ ] `OnboardingPage.stories.tsx` 更新 Story
      实例（1 处）:
      :更新 Default / DarkTheme Story 确保动画可预览
      :新增 `StepTransition` Story 展示步骤切换动画效果
      验证: `pnpm -C apps/desktop storybook:build` → 通过

- [ ] `OnboardingSteps.test.tsx` 添加动画行为测试
      实例（新文件或扩展）:
      :验证步骤切换时正确应用 step-slide CSS class
      :验证完成步骤后庆祝动画元素出现
      :验证动效 CSS-only（无 JS 定时器依赖）
      验证: `pnpm -C apps/desktop exec vitest run onboarding` → all pass

---

## 整体验证

```bash
grep -rn 'step-slide' SRC/features/onboarding/ | wc -l  # → ≥ 3
grep -rn 'confetti' SRC/features/onboarding/ | wc -l  # → ≥ 2
pnpm typecheck  # → 0 errors
pnpm -C apps/desktop exec vitest run onboarding  # → all pass
pnpm -C apps/desktop storybook:build  # → 通过
```
