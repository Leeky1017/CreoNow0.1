## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：在根节点增加主题切换过渡策略（background/color/border-color），消除切换闪烁。不改变主题 Token 体系本身。
- [ ] 1.2 审阅并确认错误路径与边界路径：`prefers-reduced-motion: reduce` 启用时必须禁用该过渡。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：切换 dark↔light 时无明显闪烁；过渡时长 ≤200ms；reduced motion 下过渡时长为 0。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：依赖 `fe-reduced-motion-respect`（全局 reduced motion 规则先就位）

### 1.5 预期实现触点

- `apps/desktop/renderer/src/styles/main.css`
  - 新增主题过渡规则：对 `html`（或 `[data-theme]`）添加 `transition: background-color var(--duration-fast), color var(--duration-fast), border-color var(--duration-fast)`
  - 该规则自动被 `fe-reduced-motion-respect` 的全局 `@media (prefers-reduced-motion: reduce)` 覆盖为 0ms
- `apps/desktop/renderer/src/stores/themeStore.tsx`
  - 当前 `setMode()` 直接写 localStorage + 更新 store，无需改动（CSS 过渡由样式层处理）
  - 若需要"切换瞬间临时禁用过渡再恢复"的策略（避免首次加载闪烁），可在 `setMode` 中添加 `document.documentElement.classList.add('no-transition')` → requestAnimationFrame → remove

**为什么是这些触点**：主题切换闪烁是纯 CSS 过渡问题，main.css 一处规则即可解决。themeStore 仅在需要防首次加载 FOUC 时才需改动。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-THEME-S1` | `apps/desktop/renderer/src/styles/__tests__/theme-transition.guard.test.ts` | `it('main.css defines theme transition on root element')` | 读取 main.css，断言包含对 `html` 或 `:root` 的 `transition` 规则且包含 `background-color` 和 `color` | `fs.readFileSync` | `pnpm -C apps/desktop test:run styles/__tests__/theme-transition.guard` |
| `WB-FE-THEME-S2` | 同上 | `it('theme transition uses duration token, not hardcoded ms')` | 断言过渡时长引用 `var(--duration-fast)` 或等价 Token，不含硬编码 `200ms` | `fs.readFileSync` | 同上 |
| `WB-FE-THEME-S3` | 同上 | `it('theme transition is disabled under reduced motion (covered by global rule)')` | 断言 main.css 的全局 reduced-motion 规则存在（由 `fe-reduced-motion-respect` 提供），间接覆盖主题过渡 | `fs.readFileSync` | 同上 |

### 可复用测试范本

- Motion contract 范本：`apps/desktop/renderer/src/components/layout/workbench-motion.contract.test.ts`
- Theme store 测试范本：`apps/desktop/renderer/src/stores/themeStore.test.ts`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-THEME-S1`：读取 `main.css`，断言包含对根元素的 `transition` 规则且覆盖 `background-color` 和 `color`。
  - 期望红灯原因：当前 main.css 无主题过渡规则。
- [ ] 3.2 `WB-FE-THEME-S2`：断言过渡时长引用 `var(--duration-` Token，不含硬编码毫秒值。
  - 期望红灯原因：规则不存在。
- [ ] 3.3 `WB-FE-THEME-S3`：断言 main.css 包含 `@media (prefers-reduced-motion: reduce)` 全局规则。
  - 期望红灯原因：若 `fe-reduced-motion-respect` 未先合并则不存在。若已合并则此测试直接绿灯（属于依赖验证）。
- 运行：`pnpm -C apps/desktop test:run styles/__tests__/theme-transition.guard`

## 4. Green（最小实现通过）

- [ ] 4.1 `main.css`：新增主题过渡规则：
  ```css
  html {
    transition: background-color var(--duration-fast) ease,
                color var(--duration-fast) ease,
                border-color var(--duration-fast) ease;
  }
  ```
  → S1 + S2 转绿
- [ ] 4.2 确认 `fe-reduced-motion-respect` 的全局规则已覆盖 `transition-duration`，无需额外处理 → S3 转绿

## 5. Refactor（保持绿灯）

- [ ] 5.1 若发现首次加载仍有 FOUC（Flash of Unstyled Content），在 themeStore `setMode` 中添加临时 `no-transition` class 策略：切换前 add → requestAnimationFrame → remove。
- [ ] 5.2 确认过渡不影响输入响应（过渡仅作用于 background/color/border，不含 transform/layout 属性）。

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段测试通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check：确认 `fe-reduced-motion-respect` 已合并或同批次先行
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
