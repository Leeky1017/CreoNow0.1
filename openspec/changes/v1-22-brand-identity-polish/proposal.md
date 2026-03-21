# V1-22 品牌标识与视觉精修

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 8 品牌收尾
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: renderer/styles、renderer/assets、Features 层（空状态/Onboarding）
- **前端验收**: 需要（品牌元素视觉验收 + Storybook 构建通过）

---

## Why：为什么必须做

### 1. 用户现象

经过 v1-01 至 v1-21 的系统重塑，CreoNow 已拥有完整的 Design Token、精致的组件变体、流畅的交互动效——但缺少一个关键要素：**独特的品牌视觉标识**。

当前状态：

- **SVG / 插画资源**：0 个（`find renderer/src -name "*.svg" -o -name "*.png"` → 空）
- **空状态**：v1-11 定义了标准 `<EmptyState>` 组件，但 icon 使用通用的 Lucide 图标——无品牌个性
- **Onboarding**：`OnboardingSteps.tsx` 存在但无品牌化的欢迎动画或引导插画
- **色彩系统**：`--color-accent` 定义了品牌色，但无渐变系统、无品牌色延伸色板
- **Loading 动画**：使用通用 spinner，无品牌化的 loading 标志

CreoNow 定位为「创作者的 Cursor」，但视觉上更像"换了主题色的通用编辑器"——「玉在璞中，人不知其美。」品牌视觉是让用户"一眼认出 CreoNow"的关键。

### 2. 根因

- v1 系列聚焦"设计稿还原 + 系统化"，品牌视觉属于"锦上添花"而非"雪中送炭"
- 插画和品牌动画需要设计师输出——工程侧只能定义接入机制，不能代替设计创作
- 渐变系统和延伸色板需要品牌策略指导——不能由 Agent 随意定义

### 3. 威胁

- **品牌记忆为零**：用户无法形成"这是 CreoNow"的视觉印象——关闭应用后，界面不会在记忆中留下独特形象
- **空状态丧失引导机会**：空状态是新用户最先看到的界面——通用 icon + 文字 vs 品牌插画 + 引导文案，后者的转化率差异可达 2-3 倍
- **竞品差距**：Notion 的空状态插画、Linear 的品牌渐变、Cursor 的极简 AI 标识——都是让用户"记住产品"的视觉锚点

### 4. 证据来源

| 数据点          | 值          | 来源                                         |
| --------------- | ----------- | -------------------------------------------- |
| SVG/PNG 资源数  | 0           | `find renderer/src -name "*.svg" -o "*.png"` |
| EmptyState icon | Lucide 通用 | EmptyState.tsx 代码检查                      |
| Onboarding 插画 | 无          | OnboardingSteps.tsx 代码检查                 |
| 渐变 CSS 定义   | 0           | `grep "gradient" renderer/src/styles/`       |
| 品牌色延伸色板  | 仅 accent   | `01-tokens.css`                              |

---

## What：做什么

### Phase 1：品牌渐变系统

在 `design/system/01-tokens.css` 中定义品牌渐变 token：

```css
:root[data-theme="dark"] {
  --gradient-brand: linear-gradient(
    135deg,
    var(--color-accent) 0%,
    #7c3aed 100%
  );
  --gradient-surface: linear-gradient(
    180deg,
    var(--color-bg-surface) 0%,
    var(--color-bg-base) 100%
  );
  --gradient-hero: radial-gradient(
    ellipse at top,
    rgba(var(--color-accent-rgb), 0.15) 0%,
    transparent 60%
  );
  --gradient-shimmer: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 50%,
    transparent 100%
  );
}
```

应用场景：

- Dashboard hero 区域背景 → `--gradient-hero`
- Onboarding 页面背景 → `--gradient-brand`（低透明度叠加）
- Skeleton shimmer 动画 → `--gradient-shimmer`

### Phase 2：空状态插画系统

为 `<EmptyState>` 组件建立品牌化 icon/插画接入机制：

1. 在 `renderer/src/assets/illustrations/` 创建目录
2. 定义插画风格规范（建议线性插画 + accent 色点缀，SVG 格式，≤ 5KB/个）
3. 为核心空状态创建 SVG 插画（需设计师输出，本 change 先创建占位 + 接入框架）：
   - `empty-project.svg`：空项目列表
   - `empty-search.svg`：搜索无结果
   - `empty-ai.svg`：AI 对话起始
   - `empty-outline.svg`：空大纲
   - `empty-memory.svg`：空记忆库
   - `empty-character.svg`：空角色列表

4. 修改 `<EmptyState>` 组件支持 `illustration` prop（ReactNode），优先于 `icon`

### Phase 3：Onboarding 品牌化

增强 `OnboardingSteps.tsx` 的视觉表现：

- 步骤切换动画：步骤间 slide + fade 过渡
- 背景效果：微弱的品牌渐变 + 粒子/光点装饰（CSS-only）
- 完成庆祝：最后一步显示 confetti 或 checkmark 动画（CSS animation）

### Phase 4：品牌色延伸色板

在 token 系统中从 `--color-accent` 延伸出完整的品牌色阶：

```css
--color-accent-50: /* 最浅 */;
--color-accent-100: ;
--color-accent-200: ;
--color-accent-300: ;
--color-accent-400: ;
--color-accent-500: var(--color-accent); /* 主色 */
--color-accent-600: ;
--color-accent-700: ;
--color-accent-800: ;
--color-accent-900: /* 最深 */;
```

用途：渐变起止色、hover 态深浅变化、图表配色等。

### Phase 5：品牌化 Loading

替换通用 spinner 为品牌化 loading 标志：

- 设计一个 CreoNow 品牌 loading 动画（建议：品牌首字母 "C" 或笔尖 icon 的旋转/脉冲动画）
- CSS animation 实现，不依赖 Lottie 或 GIF
- 在 `<LoadingState variant="spinner">` 中替换默认 spinner

---

## Non-Goals：不做什么

1. **不做完整品牌手册**——品牌手册（logo 使用规范、字体搭配、摄影风格等）不在工程范畴
2. **不做产品 logo 设计**——logo 设计由品牌设计师完成，本 change 仅接入和展示
3. **不做动态 3D 效果**——保持 CSS-only 动效策略，不引入 Three.js / WebGL
4. **不做 illustration 原创设计**——插画由设计师提供，本 change 建立框架 + 占位图
5. **不修改已有色彩 token 的值**——仅追加品牌色延伸色板，不改变 `--color-accent` 的定义值

---

## AC：验收标准

| #   | 验收条件                                                                      | 验证方式                 |
| --- | ----------------------------------------------------------------------------- | ------------------------ |
| 1   | `01-tokens.css` 包含 ≥ 3 个 `--gradient-*` token                              | grep 验证                |
| 2   | `renderer/src/assets/illustrations/` 目录存在且包含 ≥ 6 个 SVG 文件（或占位） | 文件计数                 |
| 3   | `<EmptyState>` 组件支持 `illustration` prop                                   | 代码检查 + Story         |
| 4   | OnboardingSteps 有步骤切换动画                                                | 视觉验收                 |
| 5   | `01-tokens.css` 包含 `--color-accent-50` 到 `--color-accent-900` 色阶         | grep 验证                |
| 6   | Loading 动画已替换为品牌化版本                                                | 视觉验收                 |
| 7   | 所有新增动效 CSS-only（无新 JS 动画库依赖）                                   | `package.json` diff 检查 |
| 8   | Storybook 构建通过                                                            | CI gate                  |
| 9   | 暗/浅双主题下品牌元素均正常渲染                                               | Storybook 双主题验证     |

---

## 依赖与影响

- **上游依赖**: v1-01（token 体系）—— 渐变和色板扩展在 token 层追加；v1-11（EmptyState 组件）—— 插画接入需在 EmptyState 中扩展 prop；v1-21（Skeleton shimmer）—— shimmer 渐变在 v1-21 的 Skeleton 动效中使用
- **被依赖于**: 无直接下游——本 change 是 V1 系列的收尾锦上添花
- **并行安全**: token 追加和资源文件新增不影响现有代码；EmptyState prop 扩展为非破坏性变更
- **风险**:
  - 品牌色延伸色板需要设计决策——色阶的具体值不应由 Agent 随意生成，需 Owner 确认
  - 插画风格一致性——如果多个插画由不同来源提供，风格可能不统一
  - 过度品牌化可能降低专业感——需要克制，"Less is more"
- **预估工作量**: 约 v1-05 的 **0.5 倍**——大部分工作是 CSS token 追加和框架搭建，不涉及复杂业务逻辑。但插画资源需设计师配合，可能有等待时间。Phase 1 渐变约 0.5d，Phase 2 插画框架约 1d（不含设计师出图），Phase 3 Onboarding 约 1d，Phase 4 色板约 0.5d，Phase 5 Loading 约 0.5d

---

## 整合建议

> **关于原提案 v1-19 至 v1-22 的整合意见：**
>
> 建议保持 6 个独立 change，**不建议合并**。理由：
>
> 1. **v1-17（字体 + 视觉回归）** 和 **v1-18（arbitrary 收口）** 有清晰的依赖关系（v1-18 依赖 v1-17 的视觉回归 CI），且各自 scope 明确——一个是基础设施，一个是收口工程
> 2. **v1-19（无障碍）** 是横切关注点，涉及全部组件但修改性质一致（ARIA 标记 + 键盘），与视觉/性能无关——独立 change 使审计聚焦
> 3. **v1-20（Storybook）** 虽然可以合并到 v1-17（都是"质量保障"），但 Story 拆分 + 文档的工作量独立可交付，且依赖 v1-16 完成后才能做全覆盖
> 4. **v1-21（性能 + 微交互）** 原提案将两者合并是合理的——虚拟化和微交互都是"感知体验优化"，且微交互中的列表动画与虚拟化的行为天然关联
> 5. **v1-22（品牌）** 依赖设计师输出，工程侧只建框架——独立 change 允许设计师异步配合
>
> **执行顺序建议**：
>
> ```
> Wave 6: v1-17 → v1-18（串行，v1-18 依赖 v1-17 的视觉回归 CI）
> Wave 7: v1-19 ∥ v1-20 ∥ v1-21（可并行，互不依赖）
> Wave 8: v1-22（收尾，可与 Wave 7 部分并行）
> ```
