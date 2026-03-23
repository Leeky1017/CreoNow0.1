# V1 Visual Overhaul — Execution Order

> 「取法乎上，仅得其中；取法乎中，仅得其下。」——李世民《帝范》
> 本文件是 V1 视觉重塑系列的唯一执行编排主源。A1（能力收口）和 T-MIG（测试迁移）已移出至独立编排文件。

---

## 〇、V1 使命与质量标尺

### 使命

将 CreoNow 的前端视觉从「能用」（6.5/10）提升到「极好」（9.5/10），对标 Cursor / Linear / Notion 级别的设计系统和交互品质。

### 质量标尺（所有 child change 必须遵守）

| 维度       | 标准                                                      | 度量方式          |
| ---------- | --------------------------------------------------------- | ----------------- |
| 组件行数   | 每个组件文件 ≤300 行                                      | `wc -l`           |
| Token 覆盖 | 0 hardcoded color / spacing / font-size                   | ESLint guard      |
| 原生 HTML  | features/ 中 0 个 `<button>/<input>/<select>/<textarea>`  | ESLint guard      |
| 测试行为   | 查询优先级 `getByRole` > `getByLabelText` > `getByTestId` | 测试审计          |
| 无障碍     | WCAG 2.1 AA 对比度 + 键盘导航 100%                        | axe-core CI       |
| i18n       | 0 裸字符串字面量                                          | ESLint guard      |
| 动效       | 所有 hover/focus/open/close 有 transition                 | 视觉审计          |
| 文档       | 每个新/改组件有 Storybook Story                           | `storybook:build` |

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

| 下游距离                 | 刷新深度                                      | 说明                                                                                               |
| ------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **直接下游**（1 hop）    | **全面刷新**：基线 + AC + scope + 依赖 + 回补 | 必须执行，无例外                                                                                   |
| **间接下游**（2+ hop）   | **轻度刷新**：仅更新受影响的基线数字          | 不改 scope/AC，只确保数字不过时                                                                    |
| **偏差 >30% 的间接下游** | **全面刷新**（升级处理）                      | 当上游产出与原始 proposal 偏差超过 30%（如行数目标偏差、scope 大幅增减），间接下游也必须做全面刷新 |

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


## 一、当前真相

### 1.1 完成状态

| 状态 | 数量 | 列表 |
|------|------|------|
| ✅ 已合并 | 16 | v1-01~v1-12, v1-14~v1-16 (不含 v1-13) |
| 🟡 待启动（已解除阻断）| 1 | v1-13 |
| 📋 已拆分为 micro-changes | 12 | v1-06~v1-09, v1-12~v1-13, v1-14, v1-16, v1-18~v1-19, v1-21~v1-22, v1-24~v1-25 |
| 📝 未拆分（直接执行） | 4 | v1-17, v1-20, v1-23, v1-26, v1-27 |

### 1.2 Micro-Change 总览（40 个）

已合并父 change 的残留清理：
| ID | 名称 | 任务数 | 父 change 状态 |
|----|------|--------|---------------|
| v1-06a | AiMessageList 拆分 | — | v1-06 ✅ |
| v1-06b | AI hover/focus | — | v1-06 ✅ |
| v1-07a | Settings 硬编码字号 | 5 | v1-07 ✅ |
| v1-07b | Settings 交互动效 | 7 | v1-07 ✅ |
| v1-08a | FileTree arbitrary 清理 | — | v1-08 ✅ |
| v1-08b | FileTree 动画 | — | v1-08 ✅ |
| v1-09a | Command token 修复 | — | v1-09 ✅ |
| v1-09b | Search arbitrary 清理 | — | v1-09 ✅ |
| v1-09c | Search 交互精修 | — | v1-09 ✅ |
| v1-12a | SkillManager 拆分 | 6 | v1-12 ✅ |
| v1-12b | Transition 铺设 | 10 | v1-12 ✅ |
| v1-12c | Scroll-shadow 铺设 | 9 | v1-12 ✅ |
| v1-13a | ESLint 审计标签 | — | v1-13 🟡 |
| v1-14a | Dialog 残留 | — | v1-14 ✅ |
| v1-16a | PanelHeader 铺设 | — | v1-16 ✅ |
| v1-16b | Quality/RightPanel 清理 | — | v1-16 ✅ |

v1-18 Arbitrary 值清理（10 个）：
| ID | 名称 | 任务数 |
|----|------|--------|
| v1-18a | AI 字号清理 | 7 |
| v1-18b | Character 字号清理 | 11 |
| v1-18c | VersionHistory/Diff 字号 | 10 |
| v1-18d | Quality/Search 字号 | 7 |
| v1-18e | 其他 features 字号 | 11 |
| v1-18f | Components 字号 | 13 |
| v1-18g | Primitives 审计（text） | 14 |
| v1-18h | Primitives 审计（dimension） | 13 |
| v1-18i | Shadow token 简化 | 12 |
| v1-18j | Tracking 清理 | 9 |

新特性 micro-changes（14 个）：
| ID | 名称 | 任务数 |
|----|------|--------|
| v1-19a | ARIA 补缺 | — |
| v1-19b | 键盘导航 | — |
| v1-21a | 渐进加载 | — |
| v1-22a | Onboarding 动画 | — |
| v1-24a | Table primitive | 4 |
| v1-24b | Separator primitive | 4 |
| v1-24c | Alert primitive | 5 |
| v1-24d | SegmentedControl | 4 |
| v1-24e | Progress primitive | 4 |
| v1-24f | Input prefix/suffix | 3 |
| v1-24g | Integration export | 5 |
| v1-25a | Component tokens | — |
| v1-25b | DensityProvider | — |
| v1-25c | Primitive token 迁移 | — |
| v1-25d | Density stories | — |

---

## 二、执行波次（6 Wave）

> 「善战者，求之于势，不责于人。」——《孙子兵法》
> 每波 ≤8 并行。上一波全部合并后启动下一波。单个 micro-change = 1 Issue + 1 PR。

### Wave 1：核心清理（8 并行）

**目标**：消灭 text-[Npx] 硬编码主体 + 最高优先级结构回补

| # | Micro-Change | 内容 | 依赖 |
|---|-------------|------|------|
| 1 | v1-18a | features/ai/ 字号 → token（7 tasks） | 无 |
| 2 | v1-18b | features/character/ 字号 → token（11 tasks） | 无 |
| 3 | v1-18c | features/vhistory+diff/ 字号 → token（10 tasks） | 无 |
| 4 | v1-18d | features/quality+search/ 字号 → token（7 tasks） | 无 |
| 5 | v1-18e | 其他 features/ 字号 → token（11 tasks） | 无 |
| 6 | v1-18f | components/ 字号 → token（13 tasks） | 无 |
| 7 | v1-12a | SkillManager 624行 → 拆分为 types+utils（6 tasks） | 无 |
| 8 | v1-13a | ESLint disable 逐条审计标签 | 无 |

**完成标准**：`grep -rn 'text-\[[0-9]' SRC/features/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` < 50

### Wave 2：深度清理 + 基础设施（8 并行）

**目标**：完成 arbitrary 值清零 + 启动基础设施 change

| # | Micro-Change | 内容 | 依赖 |
|---|-------------|------|------|
| 1 | v1-18g | Primitives text 审计（14 tasks） | 无 |
| 2 | v1-18h | Primitives dimension 审计（13 tasks） | 无 |
| 3 | v1-18i | shadow-[var(--shadow-*)] → shadow-sm/md/lg/xl（12 tasks） | 无 |
| 4 | v1-18j | tracking-[0.1em] → token（9 tasks） | 无 |
| 5 | v1-07a | Settings 字号清理（5 tasks） | 无 |
| 6 | v1-09a | Command token 修复 | 无 |
| 7 | v1-17 | Font bundling + visual regression（父 change 直接执行） | 无 |
| 8 | v1-23 | Color system upgrade（父 change 直接执行） | 无 |

**完成标准**：
- `grep -rn 'text-\[[0-9]' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 0
- `grep -rn 'shadow-\[var(--shadow' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 0
- `grep -rn 'tracking-\[' SRC/ --include='*.tsx' | grep -v test | grep -v stories | grep -v 'tracking-\[var' | wc -l` → 0

### Wave 3：交互精修 + 动效铺设（8 并行）

**目标**：补全 hover/focus/transition + 结构优化

| # | Micro-Change | 内容 | 依赖 |
|---|-------------|------|------|
| 1 | v1-06a | AiMessageList 拆分 | 无 |
| 2 | v1-06b | AI hover/focus 精修 | 无 |
| 3 | v1-07b | Settings 交互动效（7 tasks） | 无 |
| 4 | v1-08a | FileTree arbitrary 清理 | 无 |
| 5 | v1-08b | FileTree 动画 | 无 |
| 6 | v1-09b | Search arbitrary 清理 | 无 |
| 7 | v1-09c | Search 交互精修 | 无 |
| 8 | v1-12b | Transition class 铺设（10 tasks） | 无 |

### Wave 4：结构补全 + 无障碍（8 并行）

**目标**：PanelHeader 统一 + scroll-shadow + 无障碍 + Storybook

| # | Micro-Change | 内容 | 依赖 |
|---|-------------|------|------|
| 1 | v1-12c | Scroll-shadow 铺设（9 tasks） | 无 |
| 2 | v1-14a | Dialog 残留修复 | 无 |
| 3 | v1-16a | PanelHeader 铺设 | 无 |
| 4 | v1-16b | Quality/RightPanel 清理 | 无 |
| 5 | v1-19a | ARIA 补缺 | 无 |
| 6 | v1-19b | 键盘导航 | 无 |
| 7 | v1-20 | Storybook excellence（父 change 直接执行） | 无 |
| 8 | v1-21a | 渐进加载 | 无 |

### Wave 5：新组件 + 品牌（8 并行）

**目标**：组件库扩展 + 品牌精修

| # | Micro-Change | 内容 | 依赖 |
|---|-------------|------|------|
| 1 | v1-22a | Onboarding 动画 | **v1-17**（Wave 2） |
| 2 | v1-24a | Table primitive（4 tasks） | 无 |
| 3 | v1-24b | Separator primitive（4 tasks） | 无 |
| 4 | v1-24c | Alert primitive（5 tasks） | 无 |
| 5 | v1-24d | SegmentedControl（4 tasks） | 无 |
| 6 | v1-24e | Progress primitive（4 tasks） | 无 |
| 7 | v1-24f | Input prefix/suffix（3 tasks） | 无 |
| 8 | v1-24g | Integration export（5 tasks） | v1-24a~f 全部 |

**注意**：v1-24g 需等 v1-24a~f 全部完成后才能执行（集成导出依赖所有新组件）。前 7 个可并行，v1-24g 串行在最后。

### Wave 6：终端节点（6 并行）

**目标**：密度系统 + 虚拟化 + 图标系统

| # | Micro-Change | 内容 | 依赖 |
|---|-------------|------|------|
| 1 | v1-25a | Component tokens | **v1-24**（Wave 5） |
| 2 | v1-25b | DensityProvider | **v1-24**（Wave 5） |
| 3 | v1-25c | Primitive token 迁移 | v1-25a |
| 4 | v1-25d | Density stories | v1-25a + v1-25b |
| 5 | v1-26 | Virtualization（父 change 直接执行） | **v1-21**（Wave 4） |
| 6 | v1-27 | Icon system（父 change 直接执行） | **v1-22**（Wave 5） |

**注意**：v1-25c/d 需等 v1-25a/b 完成。执行顺序：v1-25a + v1-25b 并行 → v1-25c + v1-25d 并行。v1-26/v1-27 可与 v1-25 系列并行。

---

## 三、依赖图（跨 Wave 阻断关系）

```
Wave 1 ─── 无外部阻断 ──────────────────────────────────────→ 全部可立即开始
Wave 2 ─── 无外部阻断 ──────────────────────────────────────→ 全部可立即开始
Wave 3 ─── 无外部阻断 ──────────────────────────────────────→ 全部可立即开始
Wave 4 ─── 无外部阻断 ──────────────────────────────────────→ 全部可立即开始
Wave 5 ─── v1-22a 需 v1-17 (Wave 2) ─── v1-24g 需 v1-24a~f ─→ 部分阻断
Wave 6 ─── v1-25 需 v1-24 (Wave 5) ─── v1-26 需 v1-21 (Wave 4) ─── v1-27 需 v1-22 (Wave 5)
```

**关键路径**：v1-17 (W2) → v1-22a (W5) → v1-27 (W6)
**最宽并行**：Wave 1~4 理论上可同时启动（32 micro-changes），但建议按 Wave 顺序分批启动以控制质量。

---

## 四、执行规则

1. **每个 micro-change = 1 Issue + 1 Branch + 1 PR**。命名：`task/<N>-<slug>`。
2. **每个 PR 不超过 300 行代码变更**（不含测试/锁文件）。超过则继续拆分。
3. **Wave 内可跳序**：Wave 1 中 v1-18a 和 v1-12a 无依赖关系，谁先完成谁先合并。
4. **Wave 间建议顺序执行**：Wave 2 在 Wave 1 大部分合并后启动。但 Wave 1~4 无硬依赖，紧急时可并行。
5. **每个 micro-change 完成后不触发级联刷新**——级联刷新仅在父 change 的所有 micro-changes 全部合并后执行。
6. **父 change 闭环标准**：所有子 micro-change 已合并 → 父 tasks.md 标记全部 `[x]` → 执行级联刷新 → 归档到 `archive/`。

---

## 五、分数路线图

| 阶段 | 预期分 | 增量来源 |
|------|--------|---------|
| 当前（P0~P6 已合并） | **7.5** | Token + 组件拆分 + 动效收口 + AppShell 解耦 |
| + Wave 1~2（清理） | **8.0** | 265 处 arbitrary 清零 + shadow/tracking token 化 |
| + Wave 3（交互） | **8.5** | hover/focus/transition 全覆盖 |
| + Wave 4（无障碍+Storybook） | **9.0** | WCAG AA + Storybook 100% + scroll-shadow |
| + Wave 5（新组件+品牌） | **9.5** | 组件库扩展 + 品牌 polish |
| + Wave 6（密度+性能） | **10.0** | 密度系统 + 虚拟化 + 图标系统 |

---

## 六、A1 / T-MIG 暂存区

> A1（能力收口）和 T-MIG（测试迁移）已移出本 EO。它们仍然是活跃 change，但不在 V1 执行编排中。

- a1-capability-closure-program（#1122）及其 15 个 child changes
- t-mig-test-structure-migration
