# V1-18 Arbitrary Value Cleanup — Tasks

> 「堂已成，钉未拔。」——此 change 是前序六波重塑的收尾工程。

## 依赖状态

| 上游                      | 状态    | 备注                              |
| ------------------------- | ------- | --------------------------------- |
| v1-01 Design Token        | ✅ PASS | tokens.css 469行, 14档 typography |
| v1-02 Primitive Evolution | ✅ PASS | 7 组件变体完成, 130 处使用        |
| v1-06 AI Panel Overhaul   | ✅ PASS | 7 子组件拆分, 27 测试文件通过     |
| v1-07 Settings Polish     | ✅ PASS | 0 硬编码 hex, 91 测试通过         |

## R3 基线（2026-03-21 采集）

### Features 层

| 度量                    | R3 值 | AC 目标  | 需清理     |
| ----------------------- | ----- | -------- | ---------- |
| `text-[` prod           | 95    | ≤ 10     | ~85        |
| `text-[` stories        | 34    | N/A      | —          |
| `rounded-[` prod        | 18    | ≤ 5      | ~13        |
| `w-[]/h-[]` prod        | 8     | 尽量归零 | ~8         |
| `p-[]/m-[]/gap-[]` prod | 1     | 0        | 1          |
| `shadow-[` prod         | 7     | ≤ 3      | ~4         |
| 总 arbitrary prod       | 228   | —        | —          |
| v1-02 variant 采用      | 0     | ≥ 15     | 全部需推动 |

### 热点文件（features text-[）

| 文件                              | text-[ 数 |
| --------------------------------- | --------- |
| AiDialogs/SystemDialogContent.tsx | 15        |
| AiDialogs/AiDiffContent.tsx       | 11        |
| AiDialogs/AiDiffSummary.tsx       | 10        |
| AiDialogs/AiErrorDetails.tsx      | 9         |
| KnowledgeGraph/GraphToolbar.tsx   | 8         |
| AiDialogs/AiDiffModal.tsx         | 7         |
| KnowledgeGraph/NodeDetailCard.tsx | 6         |
| AiDialogs/AiInlineConfirm.tsx     | 6         |
| KnowledgeGraph/NodeEditDialog.tsx | 5         |
| AiDialogs/AiInlinePreview.tsx     | 5         |

---

## Phase 0: 准备

### T0-01: 阅读引用文件

- [ ] 读 `openspec/specs/design-system/spec.md`（Design Token 定义）
- [ ] 读 `design/DESIGN_DECISIONS.md`（设计决策）
- [ ] 读 `docs/references/design-ui-architecture.md`（UI 架构）
- [ ] 读 `apps/desktop/renderer/src/styles/tokens.css`（token 实际定义）

### T0-02: 建立 Arbitrary → Token 映射表

- [ ] 从 `tokens.css` 提取 typography scale（14 档）
- [ ] 建立 `text-[Npx]` → `text-<token>` 映射
- [ ] 建立 `rounded-[Npx]` → `rounded-<scale>` 映射
- [ ] 建立 `shadow-[...]` → `shadow-<token>` 映射
- [ ] 建立 `w-[N]/h-[N]` → Tailwind spacing scale 映射
- [ ] 建立 `p-[N]/m-[N]/gap-[N]` → Tailwind spacing scale 映射
- [ ] 将映射表记录在本文件附录或独立文档中

**映射参考**（基于 v1-01 token 系统）：

| Arbitrary        | Token / Utility                   | 依据                         |
| ---------------- | --------------------------------- | ---------------------------- |
| `text-[10px]`    | `text-label`                      | --text-label-size: 10px      |
| `text-[11px]`    | `text-caption`                    | --text-caption-size: 11px    |
| `text-[12px]`    | `text-caption`                    | 就近映射                     |
| `text-[13px]`    | `text-body` / `text-tree`         | --text-body-size: 13px       |
| `text-[14px]`    | `text-subtitle`                   | --text-subtitle-size: 14px   |
| `text-[16px]`    | `text-card-title` / `text-editor` | --text-card-title-size: 16px |
| `text-[24px]`    | `text-heading`                    | --text-heading-size: 24px    |
| `text-[48px]`    | `text-display`                    | --text-display-size: 48px    |
| `rounded-[4px]`  | `rounded-sm`                      | Tailwind default             |
| `rounded-[8px]`  | `rounded-md`                      | Tailwind default             |
| `rounded-[12px]` | `rounded-lg`                      | Tailwind default             |
| `rounded-[16px]` | `rounded-xl`                      | Tailwind default             |
| `rounded-[24px]` | `rounded-2xl`                     | Tailwind default             |
| `p-[4px]`        | `p-1`                             | 4px = 1 × 4px                |
| `p-[8px]`        | `p-2`                             | 8px = 2 × 4px                |
| `p-[16px]`       | `p-4`                             | 16px = 4 × 4px               |
| `gap-[4px]`      | `gap-1`                           | 4px spacing                  |
| `gap-[8px]`      | `gap-2`                           | 8px spacing                  |
| `w-[48px]`       | `w-12`                            | 48px = 12 × 4px              |
| `h-[32px]`       | `h-8`                             | 32px = 8 × 4px               |

### T0-03: ESLint 规则确认

- [ ] 确认 `creonow/no-arbitrary-values` 规则是否存在
- [ ] 如不存在，评估是否在 v1-18 中新建（或用 Guard 测试替代）
- [ ] 确认现有规则级别（warn/error/off）

---

## Phase 1: Red（测试先行）

### T1-01: 守卫测试 — Arbitrary Value 上限

- [ ] 创建守卫测试，断言 features/ 下各类 arbitrary value 数量 ≤ AC 目标：
  - `text-[` prod ≤ 10
  - `rounded-[` prod ≤ 5
  - `p-[]/m-[]/gap-[]` prod = 0
  - `shadow-[` prod ≤ 3
- [ ] 运行测试确认 Red（当前 95/18/1/7 均超标）

### T1-02: 守卫测试 — Variant 采用下限

- [ ] 创建守卫测试，断言 features/ 下 v1-02 variant 使用量 ≥ 15
- [ ] 运行测试确认 Red（当前 0）

---

## Phase 2: Green（批量替换）

### T2-01: AiDialogs 模块清理（最大热点，6 文件 ~54 处 text-[）

- [ ] SystemDialogContent.tsx（15 处）
- [ ] AiDiffContent.tsx（11 处）
- [ ] AiDiffSummary.tsx（10 处）
- [ ] AiErrorDetails.tsx（9 处）
- [ ] AiDiffModal.tsx（7 处）
- [ ] AiInlineConfirm.tsx（6 处）
- [ ] AiInlinePreview.tsx（5 处）
- [ ] 每文件：替换 text-[ → token，替换 rounded-[/shadow-[ 如有
- [ ] 运行 `pnpm typecheck && pnpm lint` 验证

### T2-02: KnowledgeGraph 模块清理（3 文件 ~19 处 text-[）

- [ ] GraphToolbar.tsx（8 处）
- [ ] NodeDetailCard.tsx（6 处）
- [ ] NodeEditDialog.tsx（5 处）
- [ ] 运行验证

### T2-03: 剩余 features 文件清理

- [ ] 扫描 features/ 下其余残留文件
- [ ] 逐文件替换 arbitrary → token/utility
- [ ] 运行验证

### T2-04: rounded-[ 专项清理（18 处）

- [ ] 扫描所有 features/ 下 rounded-[ 文件
- [ ] 替换为 rounded-sm/md/lg/xl/2xl
- [ ] 运行验证

### T2-05: spacing 专项清理（p-[]/m-[]/gap-[] 1 处）

- [ ] 定位并替换最后 1 处间距 arbitrary
- [ ] 确认归零

### T2-06: shadow-[ 专项清理（7 处）

- [ ] 扫描 features/ 下 shadow-[ 文件
- [ ] 替换为 shadow token（`--shadow-*` Design Token）
- [ ] 运行验证

### T2-07: w-[]/h-[] 尺寸清理（8 处）

- [ ] 识别可映射到 spacing scale 的值并替换
- [ ] 保留组件特有定尺寸（如面板最小宽度），标注为合理 arbitrary
- [ ] 运行验证

---

## Phase 3: Variant 推广

### T3-01: 识别 v1-02 变体推广位点

- [ ] 扫描 features/ 中可替换为 pill/bento/compact/underline/category 变体的位置
- [ ] 列出候选替换清单（目标 ≥ 15 处）

### T3-02: 执行变体替换

- [ ] Dashboard 大圆角卡片 → `<Card variant="bento">`
- [ ] Dashboard 统计卡片 → `<Card variant="compact">`
- [ ] AI 面板 tab → `<Tabs variant="underline">`
- [ ] 分类标签 → `<Badge variant="pill">`
- [ ] 设置中的 pill 按钮 → `<Button variant="pill">`
- [ ] icon 按钮 → `<Button size="icon">`
- [ ] 确认采用量 ≥ 15
- [ ] 运行 `pnpm typecheck && pnpm lint` 验证

---

## Phase 4: 验证

### T4-01: 守卫测试全绿

- [ ] 运行 Phase 1 创建的守卫测试，确认全部 Green
- [ ] `pnpm -C apps/desktop vitest run` 全量测试通过

### T4-02: AC 验收命令

```bash
# AC1: text-[ features prod ≤ 10
grep -rn 'text-\[' apps/desktop/renderer/src/components/features/ --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l

# AC2: rounded-[ features prod ≤ 5
grep -rn 'rounded-\[' apps/desktop/renderer/src/components/features/ --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l

# AC3: p-[]/m-[]/gap-[] features prod = 0
grep -rnE '(p|m|gap)-\[' apps/desktop/renderer/src/components/features/ --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l

# AC4: v1-02 variant ≥ 15
grep -rn 'variant="pill"\|variant="bento"\|variant="compact"\|variant="underline"\|variant="category"\|size="icon"' apps/desktop/renderer/src/components/features/ | wc -l

# AC5: shadow-[ features prod ≤ 3
grep -rn 'shadow-\[' apps/desktop/renderer/src/components/features/ --include='*.tsx' | grep -v '.stories.' | grep -v '.test.' | wc -l

# AC6: typecheck
pnpm typecheck

# AC7: Storybook build
pnpm -C apps/desktop storybook:build
```

### T4-03: CI 门禁

- [ ] `pnpm typecheck` 通过
- [ ] `pnpm lint` 通过
- [ ] `pnpm -C apps/desktop storybook:build` 通过
- [ ] 视觉回归 CI 通过（v1-17）

---

## 工作量预估（R3 调整）

原始预估基于 930 处 arbitrary，当前 features 层仅剩 228 处（-75%）。

| Phase            | 原始预估 | R3 调整 | 理由                           |
| ---------------- | -------- | ------- | ------------------------------ |
| Phase 0 准备     | 0.5d     | 0.3d    | 映射表可复用 proposal 中的参考 |
| Phase 2 批量替换 | 2-3d     | 0.8-1d  | 从 930→228，热点集中在 2 模块  |
| Phase 3 变体推广 | 0.5d     | 0.5d    | 不变，仍需全量推广             |
| Phase 4 验证     | 0.5d     | 0.3d    | 文件数减少，验证更快           |
| **合计**         | **~4d**  | **~2d** | 上游已消化 75% 工作量          |

---

## R6 级联刷新记录（2026-03-22）

v1-12 已于 2026-03-22 合并（PR #1213）。按 features 层生产文件口径重采样，proposal 追踪的四大 arbitrary 类别当前合计为 198（相较原始 930 已下降 79%），但 `text-[Npx]` 仍有 166 处、目标变体采用量仍为 0。

R6 的结论是“工作量缩窄，但任务未自动完成”。详细基线、剩余热点与 AC 说明见 `proposal.md` 的 R6 级联刷新记录。
