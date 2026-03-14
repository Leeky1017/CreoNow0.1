# Tasks: G0.5-06 前端视觉回归测试基础设施

- **GitHub Issue**: 待创建
- **分支**: 待创建
- **Delta Spec**: `specs/visual-regression/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

W0.5-GATE: 审计补丁 — 视觉回归测试

## 问题根因

当前 Storybook CI gate 仅验证「能否构建」，不验证「组件长什么样」。视觉回归测试基础设施为**零**：

- 无 Chromatic / Percy 云端视觉对比
- 无 Playwright visual comparison
- 现有 `storySnapshotHarness.tsx` 只做 HTML 文本快照，不做像素级视觉对比
- 60 个 Story 文件已存在，但没有一个被视觉回归测试覆盖

Phase 0 期间，没有任何前端组件 PR 真正验证过组件的视觉表现。Storybook gate「未经实战检验」。

> 「纸上谈兵自古非难事，难在一招一式见真章。」

---

## 技术选型

### 方案：Playwright + Storybook 视觉回归（推荐）

**理由**：

1. Playwright 1.58.1 已安装（用于 E2E），复用基础设施
2. Storybook 8.6.15 已配置，60 个 Story 已就位
3. 无需第三方云服务（Chromatic 按快照收费），本地 + CI 即可
4. Playwright 原生支持 `toHaveScreenshot()` 视觉对比
5. 支持 Dark/Light 双主题 + 中英文双语言的排列组合

### 架构设计

```
apps/desktop/
├── .storybook/                        ← 现有配置
├── tests/
│   └── visual/
│       ├── playwright.visual.config.ts ← 视觉测试专用 Playwright 配置
│       ├── visual.setup.ts            ← Storybook 服务启动 fixture
│       ├── primitives.visual.spec.ts  ← 原语组件视觉测试
│       ├── layout.visual.spec.ts      ← 布局组件视觉测试
│       ├── features.visual.spec.ts    ← 功能组件视觉测试
│       └── __screenshots__/           ← baseline 截图（Git 追踪）
│           ├── dark/                  ← 暗色主题 baseline
│           └── light/                 ← 亮色主题 baseline
```

### 覆盖矩阵

每个测试的 Story 在以下维度排列：

| 维度 | 值                                          |
| ---- | ------------------------------------------- |
| 主题 | `dark`, `light`                             |
| 语言 | `zh-CN`, `en`（若组件含文本）               |
| 视口 | `1280×720`（桌面标准），`1920×1080`（可选） |

---

## 验收标准

| ID    | 标准                                                                 |
| ----- | -------------------------------------------------------------------- |
| AC-1  | `tests/visual/playwright.visual.config.ts` 存在，配置有效            |
| AC-2  | `pnpm test:visual` 命令可执行                                        |
| AC-3  | 原语组件（≥20 个 Story）有 dark + light 主题的 baseline 截图         |
| AC-4  | 布局组件（≥5 个 Story）有 dark + light 主题的 baseline 截图          |
| AC-5  | 功能组件（优先级前 10 个 Story）有 baseline 截图                     |
| AC-6  | CI 新增 `visual-regression` job，纳入 `ci` meta-job `needs`          |
| AC-7  | 组件样式变更导致截图不匹配时 CI 失败                                 |
| AC-8  | `pnpm test:visual --update-snapshots` 可更新 baseline                |
| AC-9  | 缺失 Story 的原语组件（ContextMenu、DropdownMenu、ScrollArea）已补齐 |
| AC-10 | 同步更新 `docs/references/testing/` 相关文档                         |
| AC-11 | 同步更新 `docs/references/design-ui-architecture.md` 视觉测试章节    |

---

## Phase 1: Red（测试先行）

### Task 1.1: Playwright 视觉测试配置

**映射验收标准**: AC-1, AC-2

- [x] 创建 `tests/visual/playwright.visual.config.ts`：
  - 使用 `@playwright/test` 的 `toHaveScreenshot()` API
  - 配置 Storybook dev server 为 `webServer`
  - 设置 `snapshotDir` 指向 `__screenshots__/`
  - 配置容差 `maxDiffPixelRatio: 0.01`
- [x] 在 `package.json` 中注册 `test:visual` 命令

### Task 1.2: Storybook 服务 Fixture

**映射验收标准**: AC-1

- [x] 创建 `visual.setup.ts`：启动 Storybook 静态服务或复用 `storybook:build` 产物
- [x] 支持 CI 环境（无头浏览器）

---

## Phase 2: Green（实现）

### Task 2.1: 原语组件视觉测试

**映射验收标准**: AC-3

- [x] 创建 `primitives.visual.spec.ts`
- [x] 遍历所有原语 Story（Button、Input、Card、Dialog 等 ≥20 个）
- [x] 每个 Story 在 dark + light 两个主题下截图对比
- [x] 生成初始 baseline 截图

### Task 2.2: 布局组件视觉测试

**映射验收标准**: AC-4

- [x] 创建 `layout.visual.spec.ts`
- [x] 覆盖 AppShell、IconBar、Layout、Sidebar、StatusBar 等 ≥5 个
- [x] dark + light 双主题

### Task 2.3: 功能组件视觉测试（优先级前 10）

**映射验收标准**: AC-5

- [x] 创建 `features.visual.spec.ts`
- [x] 优先覆盖：DashboardPage、EditorPane、AiPanel、SettingsDialog、ExportDialog、CommandPalette、FileTreePanel、OutlinePanel、VersionHistoryPanel、SearchPanel
- [x] dark + light 双主题

### Task 2.4: 补齐缺失 Story

**映射验收标准**: AC-9

- [x] 创建 `ContextMenu.stories.tsx`
- [x] 创建 `DropdownMenu.stories.tsx`
- [x] 创建 `ScrollArea.stories.tsx`

### Task 2.5: CI 集成

**映射验收标准**: AC-6, AC-7, AC-8

- [x] 在 `.github/workflows/ci.yml` 新增 `visual-regression` job：
  ```yaml
  visual-regression:
    runs-on: ubuntu-latest
    needs: [changes, storybook-build]
    if: needs.changes.outputs.desktop_changed == 'true'
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-node-pnpm
      - name: Install Playwright browsers
        run: pnpm exec playwright install chromium --with-deps
      - name: Build Storybook
        run: pnpm -C apps/desktop storybook:build
      - name: Run visual regression tests
        run: pnpm test:visual
      - name: Upload diff artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-diff
          path: apps/desktop/tests/visual/test-results/
  ```
- [x] 将 `visual-regression` 加入 `ci` meta-job 的 `needs` 列表

### Task 2.6: 文档同步

**映射验收标准**: AC-10, AC-11

- [x] 在 `docs/references/testing/` 新增视觉测试指南或在现有文档中补充章节
- [x] 更新 `design-ui-architecture.md` 视觉测试说明
- [x] 更新 `07-test-command-and-ci-map.md` 添加 `test:visual` 命令

---

## Baseline 管理策略

- `__screenshots__/` 目录 **Git 追踪**，作为 baseline 真实来源
- 更新 baseline 命令：`pnpm test:visual --update-snapshots`
- PR 中包含截图变更时，审计 Agent 必须人工确认视觉变化是否符合预期
- `.gitattributes` 标记截图为 binary：`*.png binary`
