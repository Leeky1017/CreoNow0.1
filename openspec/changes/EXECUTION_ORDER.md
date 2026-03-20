# V1 Visual Overhaul — Execution Order

> 「取法乎上，仅得其中；取法乎中，仅得其下。」——李世民《帝范》
> 本文件是 V1 视觉重塑系列的唯一执行编排主源。A1（能力收口）和 T-MIG（测试迁移）已移出至独立编排文件。

---

## 〇、V1 使命与质量标尺

### 使命

将 CreoNow 的前端视觉从「能用」（6.5/10）提升到「极好」（9.5/10），对标 Cursor / Linear / Notion 级别的设计系统和交互品质。

### 质量标尺（所有 child change 必须遵守）

| 维度 | 标准 | 度量方式 |
|------|------|---------|
| 组件行数 | 每个组件文件 ≤300 行 | `wc -l` |
| Token 覆盖 | 0 hardcoded color / spacing / font-size | ESLint guard |
| 原生 HTML | features/ 中 0 个 `<button>/<input>/<select>/<textarea>` | ESLint guard |
| 测试行为 | 查询优先级 `getByRole` > `getByLabelText` > `getByTestId` | 测试审计 |
| 无障碍 | WCAG 2.1 AA 对比度 + 键盘导航 100% | axe-core CI |
| i18n | 0 裸字符串字面量 | ESLint guard |
| 动效 | 所有 hover/focus/open/close 有 transition | 视觉审计 |
| 文档 | 每个新/改组件有 Storybook Story | `storybook:build` |

### 滚动刷新规则（Cascade Refresh SOP）

> 「流水不腐，户枢不蠹。」——《吕氏春秋》
> proposal 不刷新，就是死文档；下游 agent 拿着陈旧基线干活，就是刻舟求剑。

#### 0. 核心原则

1. **谁完成，谁刷新。** 负责 change N 的 agent 在本体任务合并后，**必须**按依赖图刷新所有直接下游 changes 的 `proposal.md` 和 `tasks.md`。这不是"建议"，是该 change 的 **完成条件（AC）之一**。未完成刷新的 change 不算交付完成。
2. **下游 agent 拿到的必须是"已刷新的、基于实际代码状态的" proposal。** 不能让下游 agent 基于几周前估算的陈旧数字做判断。
3. **刷新是上游的责任，不是下游的义务。** 上游 agent 对自己的产出最了解——哪些做了、哪些漏了、哪些 scope creep 了——只有上游能高效完成刷新。

#### 1. 刷新什么（Checklist）

每次刷新必须逐项检查以下内容。在 commit message 中标注哪些项发生了实际变更。

- [ ] **基线数字**：用实测命令重新采集（`wc -l`、`grep -c`、`find` 等），替换 proposal 中的旧基线。**每个数字必须附带采集命令**，使 reviewer 可一键复现。
- [ ] **AC 目标**：根据实际产出调整。例如上游已将文件从 993→178 行，下游的"缩减到 300 行"目标可能已经达成——此时必须标注 `[AC 已达成 by v1-XX]`，避免下游重复工作。
- [ ] **Scope 调整**：上游 scope creep 或偏差可能导致下游 scope 增减。例如上游额外做了组件拆分，下游的"拆分该组件"任务应移除或缩减。
- [ ] **依赖声明**：确认下游的 `depends_on` 列表是否因上游变化而改变（如上游引入了新的共享组件，下游需要声明依赖）。
- [ ] **回补清单**：如果上游有未完成的遗留项（scope 外溢、AC 未满足），明确归入哪个下游 change，并在该下游的 `tasks.md` 中添加对应 task。

#### 2. 刷新操作步骤

```
Step 1: 采集基线
  └── 在合并后的 main 分支上，运行下游 proposal 中列出的所有度量命令
  └── 记录每个指标的新值

Step 2: 对比偏差
  └── 逐项比较旧基线 vs 新基线
  └── 标注偏差 > 10% 的指标

Step 3: 更新 proposal.md
  └── 替换基线数字（附采集命令）
  └── 调整 AC 目标（标注已达成项）
  └── 调整 scope（增/减/不变，附理由）
  └── 更新依赖声明
  └── 追加回补清单（如有）

Step 4: 更新 tasks.md
  └── 勾选因上游工作已达成的 task
  └── 新增因回补/scope 变化产生的 task
  └── 删除因 scope 缩减而不再需要的 task

Step 5: 提交刷新
  └── 单独 commit（不混入本体代码变更）
  └── commit message 格式见下方
```

#### 3. 基线采集命令示例

以下是常用的基线采集命令，proposal 中的每个数字都必须附带类似命令：

```bash
# 文件行数
wc -l apps/desktop/renderer/src/components/AppShell.tsx

# features/ 下的 eslint-disable 总数
grep -r 'eslint-disable' apps/desktop/renderer/src/features/ | wc -l

# 原生 HTML 元素计数（features/ 下的 <button>）
grep -rn '<button' apps/desktop/renderer/src/features/ --include='*.tsx' | wc -l

# arbitrary 字号使用量
grep -rn 'text-\[' apps/desktop/renderer/src/ --include='*.tsx' | wc -l

# arbitrary spacing 使用量
grep -rn '\(p\|m\|gap\)-\[' apps/desktop/renderer/src/ --include='*.tsx' | wc -l

# hardcoded hex 色值
grep -rn '#[0-9a-fA-F]\{3,8\}' apps/desktop/renderer/src/ --include='*.tsx' | wc -l

# inline style 对象
grep -rn 'style={{' apps/desktop/renderer/src/ --include='*.tsx' | wc -l

# v1-02 变体在 features 层的使用次数
grep -rn 'variant=.\(pill\|bento\|compact\)' apps/desktop/renderer/src/features/ --include='*.tsx' | wc -l

# Storybook play function 覆盖
grep -rn 'play:' apps/desktop/renderer/src/ --include='*.stories.tsx' | wc -l
```

#### 4. 提交与审计规范

- **commit message 格式**：`chore(v1-XX): cascade-refresh downstream v1-YY/v1-ZZ after v1-XX completion`
- **刷新内容必须在 change 的 PR 中作为单独 commit 提交**，不混入本体代码变更。这使审计 agent 可以清晰区分"做了什么"和"刷新了什么"。
- 如果下游 change 的 AC 因刷新而变为"已达成"，必须在 commit message 和 proposal 中明确标注：`[AC-03 已达成 by v1-XX: Export 993→178，目标 ≤300 已满足]`
- 审计 agent 在审计刷新 commit 时，应验证：(a) 基线数字可复现，(b) AC 调整逻辑合理，(c) scope 变更有据可依。

#### 5. 刷新触发图（按 Phase）

以下列出每个 Phase 完成后必须刷新的下游 changes。**直接下游**（1 hop）为必须刷新项，用 `→` 标注。

##### Phase 0 完成（v1-01 Token + v1-02 Primitive）后：

```
v1-01 → v1-17 (font-bundling, token 依赖)
       → v1-23 (color-system, token 依赖)
       → v1-25 (density-system, token 依赖)
v1-02 → v1-03, v1-04, v1-05 (Phase 1 全部)
       → v1-12 (原生替换目标 = v1-02 Primitive)
       → v1-14 (dialog-entry, Primitive 依赖)
       → v1-24 (component-library, Primitive 依赖)
       → v1-18 (variant-adoption, v1-02 变体推广)
```

##### Phase 1 完成（v1-03/04/05）后：

```
v1-05 → v1-12 (AppShell 解耦基线来自 v1-05 的编辑器拆分成果)
全局 → Phase 2 (v1-06/07) 基线刷新（features/ 行数、组件结构变化）
```

##### Phase 2 完成（v1-06/07）后：

```
v1-06 → v1-12 (SkillManagerDialog 回补)
       → v1-15 (ai-overlay, AI Panel 依赖)
v1-07 → v1-14 (dialog-entry, Settings 共享组件)
全局 → Phase 3 (v1-08/09) 基线刷新
```

##### Phase 3 完成（v1-08/09）后：

```
v1-08 → v1-12 (FileTree 4 项 AC 回补)
全局 → Phase 4 (v1-10/11/16) 基线刷新
```

##### Phase 4 完成（v1-10/11/16）后：

```
v1-10 → v1-12 (面板文件冲突, OutlinePanel 回补)
v1-11 → v1-15 (ai-overlay, 状态组件依赖)
       → v1-16 (已完成, 回顾性记录)
v1-16 → v1-12 (DiffView 回补)
全局 → Phase 5 (v1-12/13) 基线刷新
```

##### Phase 5 完成（v1-12/13）后：

```
v1-12 → v1-13 (eslint-disable 基线需 v1-12 后重算)
       → v1-14 (SOFT 依赖, AppShell 解耦影响布局容器)
       → v1-15 (SOFT 依赖, 同上)
       → v1-18 (arbitrary-cleanup, 需 v1-12 后基线)
       → v1-19 (a11y, 需 v1-12 后键盘导航基线)
       → v1-21 (performance, 需 v1-12 后动效基线)
v1-13 → v1-18 (eslint-disable 收口后, arbitrary 基线可能变化)
```

##### Phase 6 完成（v1-14/15）后：

```
v1-14 → v1-20 (Storybook, 新对话框需 Story)
v1-15 → v1-20 (Storybook, AI overlay 需 Story)
全局 → Phase 7 (v1-17/18) 基线刷新
```

##### Phase 7 完成（v1-17/18）后：

```
v1-17 → v1-22 (brand-identity, 字体打包基础)
v1-18 → Phase 8 全部（arbitrary 收口影响所有视觉指标）
全局 → Phase 8 (v1-19~23) 基线刷新
```

##### Phase 8 完成（v1-19~23）后：

```
v1-19 → v1-25 (density, a11y 约束影响密度设计)
v1-21 → v1-26 (virtualization, 微交互基础)
v1-22 → v1-27 (icon-system, 品牌资产基础)
v1-23 → v1-25 (density, 色彩系统影响 component token)
v1-24 → v1-25 (density, 新组件需密度支持)
全局 → Phase 9 (v1-24~27) 基线刷新
```

#### 6. 刷新深度规则

| 下游距离 | 刷新深度 | 说明 |
|---------|---------|------|
| **直接下游**（1 hop） | **全面刷新**：基线 + AC + scope + 依赖 + 回补 | 必须执行，无例外 |
| **间接下游**（2+ hop） | **轻度刷新**：仅更新受影响的基线数字 | 不改 scope/AC，只确保数字不过时 |
| **偏差 >30% 的间接下游** | **全面刷新**（升级处理） | 当上游产出与原始 proposal 偏差超过 30%（如行数目标偏差、scope 大幅增减），间接下游也必须做全面刷新 |

**偏差计算方式**：`|实际值 - 原计划值| / 原计划值 × 100%`

示例：v1-05 原计划将 EditorArea 从 1550→500 行，实际做到 1550→232 行，偏差 = |232-500|/500 = 53.6% > 30%，间接下游（如 v1-18 的 arbitrary spacing 计数）需全面刷新。

#### 7. 刷新验证 Checklist（审计 agent 使用）

审计 agent 在审核包含刷新 commit 的 PR 时，必须验证：

- [ ] 刷新 commit 与本体代码 commit 分离
- [ ] commit message 符合 `chore(v1-XX): cascade-refresh ...` 格式
- [ ] 每个基线数字附带可执行的采集命令
- [ ] 随机抽查 ≥2 个基线数字，实际运行采集命令确认一致
- [ ] 已达成的 AC 有明确标注和证据
- [ ] scope 变更有合理理由
- [ ] 回补清单完整（对照上游 PR 中的遗留项）
- [ ] 触发图中列出的所有直接下游均已刷新（无遗漏）

---

## 一、当前真相（实测）

### 1.1 完成状态

| 状态 | Change 数 | 列表 | 级联状态 |
|------|----------|------|---------|
| ✅ 已合并 | 12 | v1-01 ~ v1-11, v1-16 | 🔄 待级联刷新 |
| ❌ 未开始 | 4 | v1-12 ~ v1-15 | ⏳ 等待上游刷新 |
| 📋 待创建 | 11 | v1-17 ~ v1-27 | ⏳ 等待上游刷新 |
| **总计** | **27** | | |

### 1.2 关键基线数字

| 指标 | 当前值 | 目标 |
|------|--------|------|
| eslint-disable（features/） | 145 | ≤ 20 |
| no-native-html-element disable | 121 | ≤ 10 |
| 原生 button in features/ | 137 | 0 |
| text-[Npx] arbitrary 字号 | 667 | 0 |
| arbitrary spacing (p-[]/m-[]/gap-[]) | 28 | 0 |
| hardcoded hex 色值 | 12 | 0 |
| inline style 对象 | 180 | ≤ 30 |
| AppShell.tsx 行数 | 1,267 | ≤ 250 |
| SkillManagerDialog.tsx 行数 | 624 | ≤ 300 |
| woff2 字体文件数 | 0 | ≥ 6 |
| axe-core 测试覆盖 | 0 | ≥ 10 关键页面 |
| Storybook play function | 45 | ≥ 80 |
| v1-02 变体在 features 层使用 (pill/bento/compact) | 0 | ≥ 30 |

### 1.3 已完成 Changes 质量排名

| 排名 | Change | 评级 | 备注 |
|------|--------|------|------|
| 🥇 | v1-02 Primitive | ⭐⭐⭐⭐⭐ | 7/7 AC，专属行为测试，标杆 |
| 🥇 | v1-05 Editor 拆分 | ⭐⭐⭐⭐⭐ | 85%↓，教科书级解体 |
| 🥇 | v1-11 状态组件 | ⭐⭐⭐⭐⭐ | 53 处集成，行为测试典范 |
| 🥈 | v1-04 编辑器排版 | ⭐⭐⭐⭐ | CSS 层约束正确，CJK 精妙 |
| 🥈 | v1-01 Token | ⭐⭐⭐⭐ | 完整体系，26 处 pixel 残留 |
| 🥈 | v1-03 Dashboard | ⭐⭐⭐⭐ | 71%↓，guard 测试好 |
| 🥈 | v1-07 Settings | ⭐⭐⭐⭐ | hex 清零 |
| 🥈 | v1-09 CommandPalette | ⭐⭐⭐⭐ | 双组件达标 |
| 🥈 | v1-10 侧面板 | ⭐⭐⭐⭐ | PanelHeader 7 处统一 |
| 🥉 | v1-06 AI Panel | ⭐⭐⭐ | **SkillManagerDialog 624行必须拆** |
| 🥉 | v1-16 Quality/Misc | ⭐⭐⭐ | pixel 残留 + DiffView 超标 |
| 🥉 | v1-08 FileTree | ⭐⭐⭐ | **4/8 AC 未满足** |

### 1.4 测试体系评分：6.5/10

| 优势 | 短板 |
|------|------|
| 314 文件、2589 通过、0 失败 | 查询优先级倒挂（getByTestId:getByRole = 5.45:1） |
| pattern-states 测试标杆级 | className 断言 264 处泛滥 |
| 83 Stories，54% 有 play function | axe-core **零覆盖** |
| 交互测试丰富（804 event） | readFileSync 源码断言在 contract test 中滥用 |

---

## 二、V1 完整编排（27 个 Changes · 10 个 Phase）

### Phase 0：总控与地基（🔄 已合并 · 待优化）

> v1-00 需重写设计愿景/质量标尺；v1-01 有 26 处 pixel 残留；v1-02 变体使用率为零。

| 顺位 | Change | 状态 | 说明 |
|------|--------|------|------|
| 0 | v1-00-visual-overhaul-program | ✅ | 总控文档 — **需重写**：补设计愿景、质量标尺、度量体系<br>→ 🔄 刷新: 所有下游 change 的质量标尺引用 |
| 1 | v1-01-design-token-completion | ✅ | Token 三层体系 — 26 处 pixel 残留归 v1-18 清理<br>→ 🔄 刷新: v1-02, v1-17, v1-23, v1-25 |
| 2 | v1-02-primitive-visual-evolution | ✅ | 组件变体 — **pill/bento/compact 使用率为零**，归 v1-18 推广<br>→ 🔄 刷新: v1-03~v1-09, v1-12, v1-14, v1-24 |

### Phase 1：核心页面（🔄 已合并 · 待级联刷新）

> 代码已合并，但需要在 P0 优化后重新审视 scope。

| 顺位 | Change | 状态 | 说明 |
|------|--------|------|------|
| 3 | v1-03-dashboard-visual-rewrite | ✅ | 929→268 行<br>→ 🔄 刷新: v1-18（DashboardEmptyState 回补确认） |
| 4 | v1-04-editor-typography-and-layout | ✅ | 760px/48px/CJK<br>→ 🔄 无直接下游需刷新 |
| 5 | v1-05-editor-decomposition | ✅ | 1550→232 行<br>→ 🔄 无直接下游需刷新 |

### Phase 2：AI + 设置（🔄 已合并 · 待级联刷新）

> 代码已合并，但需要在 P0/P1 级联刷新后重新审视 scope。v1-06 有 SkillManagerDialog 624 行遗留。

| 顺位 | Change | 状态 | 说明 |
|------|--------|------|------|
| 6 | v1-06-ai-panel-overhaul | ✅ | 2100→281 行 — **SkillManagerDialog 624行遗留归 v1-12 回补**<br>→ 🔄 刷新: v1-12（SkillManagerDialog 回补）, v1-15, v1-18 |
| 7 | v1-07-settings-visual-polish | ✅ | hex 清零<br>→ 🔄 刷新: v1-14 |

### Phase 3：布局精度（🔄 已合并 · 待级联刷新）

> v1-08 有 4 项 AC 未满足（icon bar/handle/chevron/colors），需在级联刷新中确认归属。

| 顺位 | Change | 状态 | 说明 |
|------|--------|------|------|
| 8 | v1-08-file-tree-precision | ✅ | 1320→126 — **4 项 AC 未满足，归 v1-12 回补**<br>→ 🔄 刷新: v1-12（FileTree AC 回补） |
| 9 | v1-09-command-palette-and-search | ✅ | 283/294 行<br>→ 🔄 无直接下游需刷新 |

### Phase 4：侧面板 + 标准化（🔄 已合并 · 待级联刷新）

> OutlinePanel 326 行超标 26 行，需在级联刷新中确认归属。

| 顺位 | Change | 状态 | 说明 |
|------|--------|------|------|
| 10 | v1-10-side-panels-visual-coherence | ✅ | PanelHeader 统一 — OutlinePanel 326 超标 26 行<br>→ 🔄 刷新: v1-12（OutlinePanel 回补）, v1-16 |
| 11 | v1-11-empty-loading-error-states | ✅ | 三状态组件，53 处集成<br>→ 🔄 刷新: v1-10, v1-15, v1-16 |
| 16 | v1-16-quality-rightpanel-and-misc | ✅ | 提前完成（与 v1-12 无实质依赖）<br>→ 🔄 刷新: v1-12（DiffView 回补） |

### 二.1 级联优化路径

V1 采用"逐层级联"策略——不是一次性重做所有 change，而是：

1. **P0 再优化**：重写 v1-00（补设计愿景）、审视 v1-01/v1-02 遗留项
   → P0 agent 完成后，按依赖图刷新 P1 的 v1-03/04/05 的 proposal/tasks
2. **P1 审计**：v1-03/04/05 按刷新后的 proposal 审视是否需要补充实现
   → P1 agent 完成后，刷新 P2 的 v1-06/07
3. **P2 审计**：v1-06/07 审视 + SkillManagerDialog 回补确认归属
   → P2 agent 完成后，刷新 P3
4. **P3 审计**：v1-08/09 审视 + FileTree 4 项 AC 回补确认归属
   → P3 agent 完成后，刷新 P4
5. **P4 审计**：v1-10/11/16 审视 + OutlinePanel 超标回补确认归属
   → P4 agent 完成后，刷新 P5
6. **P5 实施**：v1-12（彻底重写 proposal 后）+ v1-13
   → P5 agent 完成后，刷新 P6/P7
7. **P6~P9**：逐步实施新 changes

关键约束：
- 每个 Phase 的 agent **不得跳过级联刷新步骤**
- 审计 agent 对"级联刷新"的质量与对代码变更的质量要求相同
- 如果级联刷新发现某个已合并 change 的实现偏差 >30%，必须上报 Owner 决定是否需要补充 PR

---

### Phase 5：交互收口 + 审计（🔴 当前阻塞）

> **v1-12 是整个 V1 的最大瓶颈。** 它是唯一未动工的巨型结构 change，AppShell 1,267 行巨石 + 121 处 native HTML + 零 transition utility。
> ⏳ 需等待 P0~P4 级联刷新完成后再启动。

| 顺位 | Change | 状态 | 依赖 | 说明 |
|------|--------|------|------|------|
| 12 | v1-12-interaction-motion-and-native-cleanup | ❌ **必须重写 proposal** | v1-10 | 拆为三部分：A 动效标准 + B 原生替换+SkillMgr回补 + C AppShell 解耦<br>→ 🔄 刷新: v1-13, v1-14, v1-15, v1-18, v1-19, v1-21 |
| 13 | v1-13-eslint-disable-audit | ❌ **必须等 v1-12** | v1-12 | 基线 145→需 v1-12 后重新计算<br>→ 🔄 无直接下游需刷新 |

### Phase 6：对话框与 AI Overlay（可与 Phase 5 部分并行）

> v1-14/15 的真实前置是 v1-02 + v1-06/v1-11（均已完成），对 v1-13 仅为 SOFT 依赖。
> ⚠️ v1-12 Part C（AppShell 解耦）可能影响 v1-14/15 的布局容器，建议 v1-12 完成后做一次轻度 proposal 刷新再启动。
> ⏳ 需等待 P5 级联刷新完成后再启动。

| 顺位 | Change | 状态 | 真实依赖 | 说明 |
|------|--------|------|---------|------|
| 14 | v1-14-dialog-and-entry-pages | ❌ 需刷新 | v1-02 + v1-07 (SOFT: v1-12) | **文件已在前序 change 中大幅缩减**（Export 993→178, Create 732→139），scope 可能已大幅缩小<br>→ 🔄 刷新: v1-20 |
| 15 | v1-15-ai-overlay-components | ❌ 需刷新 | v1-06 + v1-11 (SOFT: v1-12) | SystemDialog 638→340, AiInlineConfirm 398→295<br>→ 🔄 刷新: v1-20 |

### Phase 7：补全到 9.0（新增 changes）

> 从「结构化收口」到「专业级设计系统」。
> ⏳ 需等待 P5/P6 级联刷新完成后再启动。

| 顺位 | Change | 依赖 | 说明 |
|------|--------|------|------|
| 17 | v1-17-font-bundling-and-visual-regression | v1-01 | woff2 字体打包（Inter/Lora/JetBrains）+ 视觉回归测试基础设施 + shadow token xs/2xl<br>→ 🔄 刷新: v1-22 |
| 18 | v1-18-arbitrary-value-cleanup-and-variant-adoption | v1-12 | 667 处 text-[Npx]→token + 28 处 spacing→token + v1-02 变体推广 + pixel 硬编码清理<br>→ 🔄 无直接下游需刷新 |

### Phase 8：补全到 9.5（新增 changes，可高度并行）

> ⏳ 需等待 P7 级联刷新完成后再启动。

| 顺位 | Change | 依赖 | 说明 |
|------|--------|------|------|
| 19 | v1-19-accessibility-and-keyboard-navigation | v1-12 | WCAG AA 对比度修复 + 键盘导航 100% + axe-core CI + 高对比模式 + skip navigation<br>→ 🔄 无直接下游需刷新 |
| 20 | v1-20-storybook-excellence | v1-14, v1-15 | 100% Story 覆盖 + play function + Props 文档 + usage guidelines + Token playground<br>→ 🔄 无直接下游需刷新 |
| 21 | v1-21-performance-and-microinteractions | v1-12 | 虚拟化长列表 + page skeleton + CSS micro-interaction + spring 物理动画 + exit animation<br>→ 🔄 刷新: v1-26 |
| 22 | v1-22-brand-identity-and-polish | v1-17 | 品牌色渐变系统 + illustration 框架 + motion signature + micro-copy tone<br>→ 🔄 刷新: v1-27 |
| 23 | v1-23-color-system-upgrade | v1-01 | HSL 色阶系统生成 + 对比度修复 + 功能色 hover/active 补全 + 高对比模式<br>→ 🔄 无直接下游需刷新 |

### Phase 9：极致打磨（冲刺 10.0）

> ⏳ 需等待 P8 级联刷新完成后再启动。

| 顺位 | Change | 依赖 | 说明 |
|------|--------|------|------|
| 24 | v1-24-component-library-expansion | v1-02 | Table + Separator + Alert + SegmentedControl + Progress + Input prefix/suffix slot<br>→ 🔄 刷新: v1-25 |
| 25 | v1-25-density-system-and-component-tokens | v1-01, v1-24 | compact/comfortable 双密度 + component-level token 层 + DensityProvider<br>→ 🔄 无直接下游需刷新（终端节点） |
| 26 | v1-26-virtualization-and-perceived-performance | v1-21 | @tanstack/virtual 集成 + CSS containment + optimistic UI + code splitting<br>→ 🔄 无直接下游需刷新（终端节点） |
| 27 | v1-27-icon-system-and-custom-assets | v1-22 | Icon wrapper + size token 映射 + stroke-width 统一 + 品牌自定义图标<br>→ 🔄 无直接下游需刷新（终端节点） |

---

## 三、真实依赖图

### 3.1 依赖矩阵（仅 HARD 依赖）

```
Phase 0 ─── v1-01 (Tokens) → v1-02 (Primitives)
              │
Phase 1 ─── v1-03 ║ v1-04 ║ v1-05          （3 并行，均依赖 v1-02）
              │
Phase 2 ─── v1-06 ║ v1-07                    （2 并行）
              │
Phase 3 ─── v1-08 ║ v1-09                    （2 并行）
              │
Phase 4 ─── v1-11 → v1-10 → v1-16           （v1-11 先行，v1-10 需状态组件）
              │
Phase 5 ─── v1-12 (需 v1-10) → v1-13 (需 v1-12)   ← 🔴 当前阻塞点
              │
Phase 6 ─── v1-14 (需 v1-02)  ║ v1-15 (需 v1-06 + v1-11)  ← SOFT 依赖 v1-12
              │
Phase 7 ─── v1-17 (需 v1-01)  ║ v1-18 (需 v1-12)
              │
Phase 8 ─── v1-19 ║ v1-20 ║ v1-21 ║ v1-22 ║ v1-23    （5 并行）
              │
Phase 9 ─── v1-24 → v1-25  ║ v1-26 (需 v1-21) ║ v1-27 (需 v1-22)
```

### 3.2 关键路径（最长链）

```
v1-01 → v1-02 → v1-11 → v1-10 → v1-12 → v1-13 → v1-18 → Phase 8
  P0      P0      P4      P4      P5      P5      P7      P8
```

---

## 四、分数路线图

| Phase 完成 | 预期综合分 | 增量来源 |
|-----------|-----------|---------|
| Phase 0-4 (已完成) | **6.5** | Token 体系、组件拆分、状态标准化 |
| + Phase 5 (v1-12/13) | **7.5** | 动效铺开、原生 HTML 收口、AppShell 解耦 |
| + Phase 6 (v1-14/15) | **8.0** | 100% 用户路径视觉覆盖 |
| + Phase 7 (v1-17/18) | **8.5** | 字体打包、arbitrary 收口、变体推广 |
| + Phase 8 (v1-19~23) | **9.0-9.5** | 无障碍、Storybook、微交互、品牌、色彩系统 |
| + Phase 9 (v1-24~27) | **9.5-10** | 组件库扩展、密度系统、虚拟化、图标系统 |

---

## 五、已完成 Changes 回补清单

> 以下是已合并 changes 中发现的遗留问题，应在后续 change 中回补，不再重开原 change。

| 遗留项 | 原 Change | 归入 | 优先级 |
|--------|----------|------|--------|
| SkillManagerDialog 624 行拆分 | v1-06 | **v1-12** | 🔴 P0 |
| FileTree 4 项 AC 未满足（icon bar/handle/chevron/colors） | v1-08 | **v1-12** | 🟡 P1 |
| OutlinePanel 326→≤300 | v1-10 | **v1-12** | 🟢 P2 |
| DiffView 345→≤300 | v1-16 | **v1-12** | 🟢 P2 |
| DashboardEmptyState/AiEmptyState 迁移到标准组件 | v1-03/v1-06 | **v1-18** | 🟢 P2 |
| 26 处 pixel 硬编码（v1-01/07/16 共性） | v1-01 | **v1-18** | 🟡 P1 |
| v1-02 变体推广（pill/bento/compact 使用率=0） | v1-02 | **v1-18** | 🟡 P1 |

---

## 六、新增 Changes 概要（v1-17 ~ v1-27）

### v1-17: Font Bundling & Visual Regression Testing
- Inter/Lora/JetBrains Mono woff2 本地打包 + @font-face
- 视觉回归测试基础设施激活
- shadow token xs/2xl 补全
- **预估工作量**：0.4x v1-02

### v1-18: Arbitrary Value Cleanup & Variant Adoption
- 667 处 text-[Npx] → token 替换
- 28 处 arbitrary spacing 收口
- v1-02 变体在 features 层推广（当前使用=0）
- pixel 硬编码清理（26 处跨模块）
- **预估工作量**：0.8x v1-02

### v1-19: Accessibility & Keyboard Navigation
- WCAG AA 对比度修复（--color-fg-subtle 3.49:1→≥4.5:1）
- 键盘导航 100% 覆盖 + skip navigation
- axe-core CI 集成
- 高对比模式 prefers-contrast: more
- ARIA live region 系统化
- **预估工作量**：1.5x v1-02

### v1-20: Storybook Excellence & Component Documentation
- Story 覆盖 71%→100%
- play function 覆盖关键交互
- Props 文档化 + usage guidelines
- Token playground Story
- **预估工作量**：0.6x v1-05

### v1-21: Performance Perception & Micro-interactions
- @tanstack/virtual 虚拟化（文件树/搜索/KG）
- page skeleton 全面铺开
- CSS micro-interaction（button scale/toggle bounce/drag inertia）
- spring 物理动画引入
- exit animation 系统
- **预估工作量**：1.2x v1-02

### v1-22: Brand Identity & Polish
- 品牌色渐变系统（不再纯黑/纯白）
- illustration 框架（空状态品牌插画）
- motion signature（独特的动画风格）
- micro-copy tone guide
- **预估工作量**：0.5x v1-05

### v1-23: Color System Upgrade
- HSL 色阶系统生成（类 Radix Colors 10-step）
- 功能色 hover/active 状态补全
- 系统性色彩派生能力
- **预估工作量**：0.8x v1-02

### v1-24: Component Library Expansion
- Table/DataTable + Separator + Alert/Banner + SegmentedControl
- Progress (determinate) + Input prefix/suffix slot
- compound pattern 重构
- **预估工作量**：1.5x v1-02

### v1-25: Density System & Component Tokens
- DensityProvider (compact/comfortable)
- component-level token 层（--button-bg, --input-border-radius）
- 面板区 compact / 编辑区 comfortable 双模式
- **预估工作量**：0.6x v1-02

### v1-26: Virtualization & Perceived Performance
- @tanstack/virtual 深度集成
- CSS containment + content-visibility
- optimistic UI（AI 交互乐观更新）
- panel code splitting
- **预估工作量**：0.8x v1-02

### v1-27: Icon System & Custom Assets
- Icon wrapper 组件 + size token 映射
- stroke-width 全局统一
- 品牌自定义图标
- **预估工作量**：0.3x v1-02

---

## 七、文档刷新协议

### 已完成 Changes (v1-01~v1-11, v1-16)

所有已完成 change 的 tasks.md **全部未勾选**（0% 文档更新率）。需要：
1. 批量勾选已达成的 AC
2. 更新基线数字为实际值
3. 标注实现方式与原始设计的偏差
4. 标注 scope creep（做了但不在原 AC 中的工作）

### 未完成 Changes (v1-12~v1-15)

| Change | 需要 | 原因 |
|--------|------|------|
| v1-12 | 🔴 **彻底重写** | 基线过时 + scope 需吸收 v1-06/08/10/16 回补项 |
| v1-13 | 🔴 **彻底重写** | 基线依赖 v1-12 产出，当前假设全部失效 |
| v1-14 | 🟡 **轻度更新** | 文件已被前序大幅缩减（Export 993→178），可能已达标 |
| v1-15 | 🟡 **轻度更新** | SystemDialog 638→340，子组件已提前创建 |

### 新 Changes (v1-17~v1-27)

在 Phase 7 启动前创建 proposal/tasks。每个 proposal 必须包含：
1. 当日实测的基线数字
2. 精确的 AC（含数字目标）
3. 依赖声明
4. 回补清单（来自上游 change 的遗留项）

---

## 八、A1 / T-MIG 暂存区

> 以下 changes 已从本 EO 移出。它们仍然是活跃 change，但不在 V1 执行编排中。待 V1 Phase 5 完成后（或根据优先级需要）再单独编排。

- a1-capability-closure-program（#1122）及其 15 个 child changes
- t-mig-test-structure-migration

这些 change 的原始编排内容已归档至 EXECUTION_ORDER_A1.md（待创建）。
