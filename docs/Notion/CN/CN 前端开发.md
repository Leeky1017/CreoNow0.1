# CN 前端开发

> Source: Notion local DB page `730fd6b3-fe7b-4de1-9f58-723cbb977570`

> 📍

Solo 开发者 ≠ 不需要分支策略。 分支策略的核心价值不是"多人协作"，而是隔离风险——让你可以大胆重构而不怕搞坏 main。

## 推荐模型：Trunk-Based + Feature Flag

> 💡

不用 Git Flow。 Git Flow 是为大型团队设计的，对 solo 开发者来说 develop / release / hotfix 分支是纯粹的仪式负担。

### 为什么不用 Git Flow

| 模型 | 适合 | CN 适用？ | 理由 |
| --- | --- | --- | --- |
| Git Flow | 大团队、定期发版 | ❌ | develop/release/hotfix 分支对 solo 开发者是纯仪式 |
| GitHub Flow | 小团队、持续部署 | ⚠️ 接近 | 简单但缺少"重构隔离"概念 |
| Trunk-Based + Feature Flag | Solo / 小团队、质量优先 | ✅ 最优 | main 始终可发布，重构在短命分支上做，完成后快速合回 |

### 分支结构

```
graph LR
    A["main"] -->|"always deployable"| B["Release"]
    A -->|"branch off"| C["feat/token-cleanup"]
    A -->|"branch off"| D["refactor/appshell-split"]
    A -->|"branch off"| E["fix/z-index-bleed"]
    C -->|"PR + squash merge"| A
    D -->|"PR + squash merge"| A
    E -->|"PR + squash merge"| A
```

### 分支命名规范

| 前缀 | 用途 | 示例 | 生命周期 |
| --- | --- | --- | --- |
| feat/ | 新功能 | feat/ai-panel-streaming | 1-5 天 |
| refactor/ | 重构（不改行为） | refactor/appshell-split | 1-5 天 |
| fix/ | Bug 修复 | fix/z-index-bleed | 小时级 |
| cleanup/ | Token 清扫、代码卫生 | cleanup/hardcoded-colors | 1-2 天 |
| experiment/ | 试验性改动（可能丢弃） | experiment/framer-motion | 不限 |

规则：

- 分支名全小写，用 - 分隔单词

- 分支生命周期不超过 5 天——超过说明拆分粒度不够

- experiment/ 分支允许长期存在但不合入 main

---

## Commit 规范

采用 Conventional Commits：

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

Type 清单：

| Type | 含义 | 示例 |
| --- | --- | --- |
| feat | 新功能 | feat(ai): add streaming buffer for AI panel output |
| fix | Bug 修复 | fix(sidebar): resolve z-index bleed on file tree |
| refactor | 重构（不改行为） | refactor(shell): split AppShell into 3 components |
| style | 视觉/样式改动 | style(tokens): replace hardcoded colors in SearchPanel |
| perf | 性能优化 | perf(editor): reduce TipTap re-renders with selector |
| test | 测试 | test(button): add Storybook interaction tests |
| chore | 构建/工具链 | chore(eslint): add no-literal-string rule |
| docs | 文档 | docs: update README with dev setup |

Scope 对应模块：shell / editor / sidebar / ai / tokens / kg / ipc 等

---

## 合并策略

- Squash Merge 为默认——保持 main 历史干净

- 每个 PR 合并后自动删除源分支

- main 上的每个 commit 都应该是可独立理解的逻辑单元

---

## 与前端重构路线图的协同

| Phase | 分支策略 | 说明 |
| --- | --- | --- |
| Phase 1 止血 | 多个并行 cleanup/ 分支 | 每个文件或一组文件一个分支，逐个合入 |
| Phase 2 拆弹 | 单个 refactor/appshell-split 分支 | 大型重构，完成后一次性合入，中途频繁 rebase main |
| Phase 3 提质 | 多个并行 feat/ 分支 | 每个 Primitive 的动画增强独立分支 |
| Phase 4 精磨 | style/ 分支 + experiment/ 分支 | 视觉微调可以小步快跑，试验性改动用 experiment 隔离 |

---

## 目标清单

- [ ] 设置 main 分支保护（禁止直接 push，必须 PR）

- [ ] 安装 commitlint + husky 自动校验 commit message

- [ ] 配置 squash merge 为默认合并方式

- [ ] 创建分支模板（feat/ / refactor/ / fix/ / cleanup/）

> 📍

CI 不是“团队工具”，是“个人安全网”。 对 solo 开发者来说，CI 的核心价值是：每次 push 后自动检查你有没有无意中破坏东西。

## CI Pipeline 设计

### 触发条件

- Push to main → 全量检查

- Push to feat/* / refactor/\* → 快速检查

- PR to main → 全量检查 + 构建测试

### Pipeline 阶段

```
graph LR
    A["Lint"] --> B["Type Check"]
    B --> C["Unit Test"]
    C --> D["Build"]
    D --> E["Bundle Size Check"]
    E --> F["E2E Smoke"]
```

| 阶段 | 工具 | 耗时目标 | 失败策略 |
| --- | --- | --- | --- |
| 1. Lint | ESLint + Prettier | < 30s | 阻断合并 |
| 2. Type Check | tsc --noEmit | < 60s | 阻断合并 |
| 3. Unit Test | Vitest | < 90s | 阻断合并 |
| 4. Build | electron-vite build | < 120s | 阻断合并 |
| 5. Bundle Size | bundlesize / 自定义脚本 | < 10s | 警告（不阻断） |
| 6. E2E Smoke | Playwright + Electron | < 180s | 仅 PR to main 时阻断 |

总耗时目标：< 5 分钟（超过就会开始糖弄 CI）

---

## GitHub Actions 配置示例

```
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, 'feat/**', 'refactor/**']
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm tsc --noEmit
      - run: pnpm test --run
      - run: pnpm build

  bundle-size:
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Check bundle size
        run: |
          RENDERER_SIZE=$(du -sk dist/renderer | cut -f1)
          echo "Renderer bundle: ${RENDERER_SIZE}KB"
          if [ $RENDERER_SIZE -gt 3000 ]; then
            echo "::warning::Renderer bundle exceeds 3MB target"
          fi
```

---

## 自定义质量门禁

除了标准 lint/test 外，加入 CN 专属的质量检查：

| 检查项 | 工具 | 规则 | 严重级 |
| --- | --- | --- | --- |
| 硬编码颜色 | ESLint 自定义规则 | 禁止 text-blue-*、bg-red-* 等原始 Tailwind 颜色 | error |
| 硬编码 z-index | ESLint 自定义规则 | 禁止 z-[\d+]，必须用 Token | error |
| transition-all | ESLint 自定义规则 | 禁止使用 transition-all | error |
| 视口越权 | ESLint 自定义规则 | 非 Shell 组件禁止 h-screen / w-screen | error |
| 直接 IPC 调用 | ESLint import 规则 | 禁止从非 service 层 import ipcRenderer | error |
| Bundle 体积 | 自定义脚本 | Renderer < 3MB，Main < 1MB | warning |
| 中文硬编码 | eslint-plugin-i18next | JSX 中禁止中文字面量 | warning |

---

## CD（持续交付）

### Electron 打包与发布

```
graph LR
    A["Tag v1.x.x"] --> B["CI Build"]
    B --> C["electron-builder"]
    C --> D["macOS .dmg"]
    C --> E["Windows .exe"]
    C --> F["Linux .AppImage"]
    D --> G["GitHub Release"]
    E --> G
    F --> G
```

打包工具： electron-builder（成熟、文档完善）

触发条件： 手动打 tag（v1.0.0）触发构建 + 发布

自动更新： 使用 electron-updater 支持应用内自动更新

---

## 本地 Git Hooks（pre-commit）

```
// package.json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

```
# .husky/pre-commit
pnpm lint-staged
```

```
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.css": ["prettier --write"]
  }
}
```

---

## 目标清单

- [ ] 配置 GitHub Actions CI workflow

- [ ] 加入 6 项自定义质量门禁 ESLint 规则

- [ ] 配置 husky + lint-staged 本地 pre-commit

- [ ] 配置 commitlint 校验 Conventional Commits

- [ ] 配置 electron-builder 多平台打包

- [ ] Tag 触发自动发布到 GitHub Releases

- [ ] CI 总耗时控制在 5 分钟内

> 📍

没有交付物管理，设计决策就会变成“口头约定”。 一个月后你会忘记为什么当时选了这个方案，然后重新踩同一个坑。

## 交付物清单

### 已有交付物

| 交付物 | 形式 | 位置 | 状态 |
| --- | --- | --- | --- |
| Design Token 规范 | tokens.css  • Notion 文档 | 代码库 + 本知识库 | ✅ 已建立 |
| Primitive 组件 API | TSX 代码 + Storybook | 代码库 | ✅ 已有 25 个 |
| 视觉审计报告 | Notion 文档 | 本知识库 | ✅ 已建立 |
| 动画编排表 | Notion 文档 | 本知识库 | ✅ 已建立 |
| 竞品分析 | Notion 文档 | 本知识库 | ✅ 已建立 |

### 缺失交付物

| 交付物 | 为什么需要 | 建议形式 | 优先级 |
| --- | --- | --- | --- |
| UI 截图基线库 | 每次重构前后对比，确认没有视觉回归 | 文件夹 screenshots/baseline/  • 日期标记 | P0 |
| 设计决策日志（ADR） | 记录“为什么选这个方案”，避免未来重复讨论 | Notion 数据库（编号 + 标题 + 状态） | P0 |
| 组件目录图 | 查看所有组件的全景图、状态、关系 | Storybook 部署（本地 or Chromatic） | P1 |
| Token 可视化页 | 一页看到所有颜色/字号/间距/阴影的实际渲染 | Storybook 专属 Story 或独立页面 | P1 |

---

## 设计决策日志（Architecture Decision Records）

> 📜

ADR 是 Solo 开发者最被低估的工具。 你以为你会记住——你不会。一个月后你会问“当时为什么这么做”，ADR 就是回答。

### ADR 模板

```
# ADR-{NNN}: {title}

## 状态
[Proposed / Accepted / Deprecated / Superseded by ADR-XXX]

## 上下文
当时面临什么问题？

## 决策
最终选了什么方案？

## 备选方案
考虑过哪些其他方案，为什么没选？

## 后果
这个决策带来了什么好处和什么代价？
```

### CN 已经做出的关键决策（应补录 ADR）

| 编号 | 决策 | 状态 |
| --- | --- | --- |
| ADR-001 | 采用 Zustand 而非 Redux 做状态管理 | Accepted |
| ADR-002 | AppShell 拆分为 LayoutShell + NavController + PanelOrchestrator | Proposed |
| ADR-003 | 配置型任务用 Dialog，并排比对用可停靠 Panel | Accepted |
| ADR-004 | AI 面板采用 Prompt-Response Panel 而非 Chat Bubble | Accepted |
| ADR-005 | IPC 调用收敛到 Service 层 | Proposed |
| ADR-006 | 采用 react-i18next 做国际化预埋 | Proposed |
| ADR-007 | Trunk-Based + Feature Flag 分支策略 | Proposed |

---

## UI 截图基线库

### 流程

1. 重构前：截图当前 UI 状态，存入 screenshots/baseline/{date}/

1. 重构后：截图同一界面，存入 screenshots/after/{date}/

1. 对比：并排查看，确认无视觉回归

### 截图清单（每次重構必截）

| 界面 | 状态 | 主题 |
| --- | --- | --- |
| Dashboard 首页 | 空项目 / 有项目 | 亮色 + 暗色 |
| 编辑器（正常写作） | 边栏展开 / 收起 | 亮色 + 暗色 |
| 编辑器（Zen Mode） | 全屏 | 亮色 + 暗色 |
| AI 面板 | 空 / 流式输出中 / 完成 | 亮色 + 暗色 |
| KG 面板 | 有节点 / 空 | 亮色 + 暗色 |
| CommandPalette | 打开 | 亮色 + 暗色 |
| 设置弹窗 | 打开 | 亮色 + 暗色 |

### 自动化（未来）

Playwright 可以自动截图，集成到 CI 中做视觉回归测试：

```
// e2e/visual-regression.spec.ts
test('dashboard light', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveScreenshot('dashboard-light.png', {
    maxDiffPixelRatio: 0.01,
  })
})
```

---

## Storybook 作为组件目录图

CN 已有 .stories.tsx 文件（AiPanel、CharacterPanel、DashboardPage），但覆盖率不足。

目标：

- 所有 25 个 Primitives 必须有 Story

- 所有 12 个 Composites 必须有 Story

- 每个 Story 覆盖所有 variant + state（default / hover / focus / disabled / loading / error）

- 建立 Token 可视化专页（颜色、字号、间距、阴影的实际渲染）

---

## 目标清单

- [ ] 建立 screenshots/baseline/ 目录，截图当前 UI 状态

- [ ] 创建 ADR 模板，补录已有 7 个关键决策

- [ ] Primitives Storybook 覆盖率提升到 100%

- [ ] 建立 Token 可视化 Story（颜色/字号/间距/阴影）

- [ ] Playwright 视觉回归测试集成到 CI

> 📍

CN 是中文优先的写作 IDE，但国际化架构应从第一天就预埋。 后补 i18n 的成本是前置的 10 倍——因为硬编码字符串散落在数百个文件中，逐个替换极其痛苦。

## 当前现状

- UI 字符串全部硬编码在 TSX 中（中文）

- 无任何 i18n 框架或字符串提取机制

- 日期/数字格式化未使用 Intl API

- 编辑器内容（用户写作）本身不需要 i18n，但 UI 外壳需要

---

## 策略：渐进式预埋，而非立即全量翻译

> 💡

不需要现在就翻译成英文。 只需要把架构搭好，让未来翻译成为"替换 JSON 文件"而不是"改 500 个 TSX"。

### Phase 1：基础设施（0.5 天）

选型：react-i18next

```
// i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhCN from './locales/zh-CN.json'

i18n.use(initReactI18next).init({
  resources: { 'zh-CN': { translation: zhCN } },
  lng: 'zh-CN',
  fallbackLng: 'zh-CN',
  interpolation: { escapeValue: false },
})
```

选择 react-i18next 的理由：

| 方案 | 优点 | 缺点 | 适合 CN？ |
| --- | --- | --- | --- |
| react-i18next | 生态最大、Hooks 友好、支持 namespace 分割 | 包体略大（~8KB gzip） | ✅ 最优解 |
| react-intl | ICU MessageFormat 标准 | API 繁琐、学习成本高 | ❌ 过重 |
| 自建 t() 函数 | 零依赖 | 缺少复数/日期/上下文等能力 | ❌ 未来扩展性差 |

### Phase 2：字符串提取规范（持续）

命名空间划分：

```
locales/
├── zh-CN.json          # 中文（主语言）
└── en-US.json          # 英文（未来）

# 或按模块分割：
locales/
├── zh-CN/
│   ├── common.json     # 通用（确定、取消、保存…）
│   ├── editor.json     # 编辑器相关
│   ├── sidebar.json    # 侧边栏
│   ├── ai.json         # AI 面板
│   └── settings.json   # 设置
```

字符串 Key 命名规范：

```
{
  "common.save": "保存",
  "common.cancel": "取消",
  "common.confirm": "确定",
  "editor.untitled": "无标题文档",
  "editor.wordCount": "count 字",
  "ai.generating": "AI 正在生成…",
  "ai.retry": "重试",
  "sidebar.fileTree.empty": "暂无文件"
}
```

规则：

- Key 使用 namespace.context.action 三段式

- 包含变量时使用 variable 插值

- 复数使用 i18next 内置规则：key_one / key_other

### Phase 3：格式化（0.5 天）

```
// 日期格式化——统一使用 Intl API
const formatDate = (date: Date, locale = 'zh-CN') =>
  new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)

// 数字格式化
const formatNumber = (num: number, locale = 'zh-CN') =>
  new Intl.NumberFormat(locale).format(num)

// 相对时间
const formatRelative = (date: Date, locale = 'zh-CN') =>
  new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
```

---

## l10n（本地化）注意事项

| 维度 | 中文特殊性 | 预埋措施 |
| --- | --- | --- |
| 文字方向 | LTR，与英文一致 | 无需特殊处理，但 CSS 用 margin-inline-start 替代 margin-left |
| 字符宽度 | 中文字符宽度约为英文 2 倍 | UI 布局不能依赖固定字符数，用 min-width  • flex 弹性布局 |
| 字体回退 | 需要中文字体栈 | font-family: system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif |
| 排版密度 | 中文排版通常更紧凑 | Typography Token 中预留 --line-height-cjk 变量 |
| 日期格式 | YYYY年MM月DD日 | 统一使用 Intl.DateTimeFormat，不硬编码格式 |
| 输入法 | IME 输入需要 compositionstart/end 处理 | TipTap/ProseMirror 已内置 IME 支持 ✅ |

---

## ESLint 守护

```
// eslint 自定义规则：禁止 JSX 中出现中文硬编码字符串
// 推荐使用 eslint-plugin-i18next
{
  'i18next/no-literal-string': ['warn', {
    markupOnly: true,
    ignoreAttribute: ['className', 'styleName', 'type', 'id'],
  }]
}
```

---

## 目标清单

- [ ] 安装 react-i18next + 初始化配置

- [ ] 创建 locales/zh-CN/ 目录结构

- [ ] 提取 common 命名空间的通用字符串（约 20-30 个）

- [ ] 日期/数字格式化统一到 Intl API

- [ ] 添加 eslint-plugin-i18next 规则（warn 级别）

- [ ] Typography Token 补充 --line-height-cjk

> ⚡

判定结果：路径 B — 渐进式重构，不推倒重来。

地基和框架全部正确（React 18 + Vite + TipTap/ProseMirror + Zustand + Tailwind 4 + Token）。问题全部出在“施工纪律”层面——有规范但没严格执行，有组件但没全部用上。

---

## 核心矛盾

> 产品定位是「IDE（创作工作台）」，但前端实现却采用「普通 Web App（网页）」的心智模型。

这种错位导致：

- 焦点频繁被阻断 — 大量全屏模态框和居中浮层切断用户上下文记忆

- 空间隐喻混乱 — 子模块自行接管视口（h-screen / w-screen），而不是由 Shell 统一分配

- 视觉噪音过载 — 过度依赖边框和阴影区分层级，屏幕布满无意义的线条

---

## 技术现状一览

| 维度 | 现状 | 评估 |
| --- | --- | --- |
| 框架 | React 18.3 + Vite 7.3 + Electron 40.1 | ✅ 最优解，不需要换 |
| 编辑器 | TipTap 2.26 / ProseMirror | ✅ 与 Notion 同源技术栈 |
| 状态管理 | Zustand 5.0，12 个分域 Store | ⚠️ 方案对，AppShell 耦合过重 |
| 样式 | Tailwind 4 + CSS Variables Token（72 个 color） | ⚠️ Token 覆盖率 ~70%，业务层大量逃逸 |
| 组件库 | 25 Primitives + 69 Features = 118 文件 | ⚠️ 基础完备，但业务层散写原生元素 |
| 耦合度 | 22% 文件直接读 Store，13 个文件直调 IPC | ⚠️ 可控但需治理 |

---

## 三大技术债务

1. AppShell 过重 — 承担了过多跨域编排与状态拼接，同时读多个 Store，是单点故障

1. Token 体系局部漂移 — ~24 个文件硬编码颜色/阴影，Z-Index 层级系统完全击穿，194 处独立滚动声明

1. 交互状态未收敛 — 大量文件直接写原生 <button> / <input>，hover/focus/disabled 行为分散

---

## 演进路线图

| 阶段 | 目标 | 关键动作 | 预估 |
| --- | --- | --- | --- |
| Phase 1 止血 | Token 清扫 + 原生元素替换 | 把硬编码拉回 Token；散写的 button/input 替换为 Primitives；统一 Z-Index | 1-2 天 |
| Phase 2 拆弹 | AppShell 瘦身 + Workbench Shell | 拆为 LayoutShell + NavigationController + PanelOrchestrator；IPC 收敛到 service 层；业务组件禁用 h-screen/w-screen | 3-5 天 |
| Phase 3 提质 | 微交互 + 动画 + 滚动统一 | Primitives 层加入统一 transition；封装 ScrollArea；建立 Typography Token | 2-3 天 |
| Phase 4 精磨 | 视觉审计 + 参考对标 | 截图逐屏对比 Notion/Cursor；间距、字号、层级最终校准；Modal/Panel 场景化选型（配置型任务用 Dialog，并排比对场景用可停靠 Panel） | 2-3 天 |

---

## 子页面索引

### 🎨 设计侧

## 现状评估

> 📍

Token 体系已存在，但执行层大面积逃逸。 基础设施是对的，问题在纪律。

### 已有的 Token 基础

定义位置：src/styles/tokens.css + main.css

| Token 类别 | 已定义数量 | 覆盖情况 |
| --- | --- | --- |
| Color | 72 个 --color-* 变量 | ⚠️ Primitives 覆盖率高，Features 层 ~70% |
| Spacing | 4px Grid 系统（--space-1 ~ --space-20） | ⚠️ 业务层大量 p-[120px]、px-[80px] 等魔法值逃逸 |
| Z-Index | --z-base ~ --z-tooltip（100/200/300/...） | ❌ 执行层完全击穿，业务代码泛滥 z-10/z-30/z-50 |
| 圆角 | 已定义 | ✅ 基本统一 |
| 阴影 | 部分定义（如 --shadow-md） | ❌ 多处魔法阴影如 shadow-[0_18px_48px_rgba(0,0,0,0.45)] |
| 动画 | --duration-fast: 100ms、--ease-default | ⚠️ 存在但未被充分引用，大量 transition-all duration-300 |
| Typography | 仅字体栈 --font-family-ui | ❌ 完全缺失——无字号阶梯、行高、字重的语义化 Token |

---

## 核心问题

### 1. 颜色逃逸

~24 个文件存在硬编码颜色，脱离主题管控：

- character/types.ts — 直接使用 text-blue-400、text-red-400、text-purple-400 等 Tailwind 原始色

- SearchPanel.tsx、VersionHistoryPanel.tsx — hex/rgba 硬编码

- 多处 !bg-* 强制覆盖类

后果： 主题切换（暗色/亮色）时出现明显的视觉违和。

### 2. Z-Index 层级系统失效

tokens.css 中已规划完整层级：

```
--z-sticky:   100
--z-dropdown: 200
--z-popover:  300
--z-modal:    ...
--z-tooltip:  ...
```

但业务代码完全无视，集中违规文件：

- KnowledgeGraph.tsx — z-10、z-30

- DiffHeader.tsx — z-20

- SearchPanel.tsx — z-50

- AiPanel.stories.tsx — z-50

后果： 多面板叠加、上下文菜单与模态框共存时必然发生 Z 轴穿透。

### 3. 阴影未抽象

代码中既有规范的 shadow-[var(--shadow-md)]，又存在：

- DiffHeader.tsx:104 — shadow-[0_18px_48px_rgba(0,0,0,0.45)]

- ModelPicker.tsx — 类似魔法阴影

后果： 深度表达混乱，破坏用户的空间隐喻直觉。

### 4. 间距魔法值

尽管有 4px Grid，业务层大量出现：

- ZenMode.tsx — px-[80px] py-[120px] max-w-[720px]

- DiffView.tsx — max-h-[300px]

- CharacterDetailDialog.tsx — max-h-[calc(100%-3.5rem)]

- DashboardPage.tsx — w-[35%]、min-h-[280px]

### 5. Typography Token 完全缺失

这是当前最大的结构性缺口。现状是"像素级修图"编码：

- DashboardPage.tsx 标题 — text-[28px] font-normal tracking-[-0.02em]

- 辅助文本 — text-[10px] tracking-[0.1em]

- 各处散装 text-[13px]、text-sm、leading-relaxed

没有 Heading-1、Body-Regular、Caption 等语义化规范，导致字阶和信息层级在不同面板间无法对齐。

---

## 改造方案

### Phase 1：补全缺失 Token

在 tokens.css 中新增以下类别：

Typography Token（优先级最高）：

> ⚠️

重要：字号必须使用 rem 而非 px。 rem 基于根字号，用户调整系统字体缩放时布局自动响应。px 硬编码会导致缩放失效，破坏可访问性。基准：1rem = 16px。

字号阶梯设计依据：

CN 当前代码中实际使用的散装字号：10px / 13px / 14px（最多） / 16px / 28px / text-sm(14px) / text-xs(12px)。这些值并非随机，反映了真实的信息层级需求。

对标分析：

| 层级 | iA Writer | Notion | Cursor (VS Code) | CN 建议 | 依据 |
| --- | --- | --- | --- | --- | --- |
| Caption / 标签 | — | 11px | 11px | 0.6875rem (11px) | UI 辅助文字的行业常见最小值 |
| Body-Small / 辅助 | — | 12-13px | 12px | 0.8125rem (13px) | CN 现有 text-[13px] 最频繁，保留 |
| Body / 正文 | 16-18px（可读性研究最优） | 14px | 13px | 0.875rem (14px) | IDE 侧边栏/面板用 14px；编辑区另定 |
| Body-Large | — | 16px | 14px | 1rem (16px) | 编辑区正文、强调信息 |
| Heading-3 | — | 18.75px | 16px | 1.25rem (20px) | 三级标题，比 Body-Large 跳 1.25x |
| Heading-2 | — | 23.44px | 20px | 1.5rem (24px) | 二级标题，比 H3 跳 1.2x |
| Heading-1 | — | 30px | 28px | 2rem (32px) | 一级标题，CN 现有 text-[28px] 向上对齐 |

> 跳跃比例约 1.2-1.33x， 接近 Major Third 谐音音阶（typographic scale 经典比例）。比 Notion 的 1.25x 稍大，因为 CN 的屏幕内容密度比 Notion 低（写作 IDE 大量留白），需要更强的层级对比。

编辑区与 UI 区的字号分离：

iA Writer 的核心洞察：写作正文的最优字号（16-18px）与 UI 控件的最优字号（13-14px）不同。 CN 应该分离两套字号：

- UI Token：--text-xs 到 --text-3xl，用于侧边栏、状态栏、弹窗等

- Editor Token：--editor-text-body: 1rem (16px) / --editor-text-heading-1: 2rem 等，用于主编辑区

- ZenMode / Focus Mode 下可进一步放大编辑区字号到 18px

```
/* UI Token（侧边栏、弹窗、状态栏） */
--text-xs:     0.6875rem;  /* 11px */
--text-sm:     0.8125rem;  /* 13px */
--text-base:   0.875rem;   /* 14px */
--text-lg:     1rem;       /* 16px */
--text-xl:     1.25rem;    /* 20px */
--text-2xl:    1.5rem;     /* 24px */
--text-3xl:    2rem;       /* 32px */

/* Editor Token（主编辑区） */
--editor-text-body:    1rem;       /* 16px，对标 iA Writer 可读性研究 */
--editor-text-h3:      1.25rem;    /* 20px */
--editor-text-h2:      1.5rem;     /* 24px */
--editor-text-h1:      2rem;       /* 32px */
--editor-leading:      1.7;        /* iA Writer 级行高，提升长文可读性 */

/* 行高 */
--leading-tight:   1.25;    /* 标题 */
--leading-normal:  1.5;     /* UI 正文 */
--leading-relaxed: 1.625;   /* 辅助文字 */

/* 字重 */
--font-normal:   400;
--font-medium:   500;
--font-semibold: 600;
```

Shadow Token（补全 + 暗色模式）：

> ⚠️

暗色模式的阴影不能简单复用亮色模式的值。 暗色背景上 rgba(0,0,0,0.08) 几乎不可见，需要显著提高透明度。同时暗色模式应使用"光晕"而非"暗影"——即用浅色半透明边缘模拟层级，而不是纯黑色扩散。

```
/* 亮色模式（默认） */
--shadow-sm:  0 1px 2px rgba(0,0,0,0.05);
--shadow-md:  0 4px 12px rgba(0,0,0,0.08);
--shadow-lg:  0 12px 32px rgba(0,0,0,0.12);
--shadow-xl:  0 18px 48px rgba(0,0,0,0.16);

/* 暗色模式——透明度显著提高 + 叠加微弱浅色边缘 */
@media (prefers-color-scheme: dark) {
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.24);
  --shadow-md:  0 4px 12px rgba(0,0,0,0.32);
  --shadow-lg:  0 12px 32px rgba(0,0,0,0.48);
  --shadow-xl:  0 18px 48px rgba(0,0,0,0.64);

  /* 可选：叠加微弱边缘模拟"光晕"效果 */
  --shadow-ring: 0 0 0 1px rgba(255,255,255,0.06);
}
```

暗色模式对标参考：

- Notion：弹窗和悬浮层使用 1px solid rgba(255,255,255,0.08) 边缘 + 较深阴影

- Cursor / VS Code：弹出菜单有明显的 border: 1px solid var(--vscode-widget-border) + 较重阴影

- Linear：暗色模式下几乎不用阴影，完全依赖微弱边缘区分层级

CN 的策略建议： 采用 Notion 方案——暗色模式下阴影 + 微弱边缘双重层级提示，这对写作 IDE 的多面板场景（编辑区、侧边栏、弹窗、悬浮菜单层叠）最为适用。

### Phase 2：清扫硬编码

批量替换策略（AI 可批量执行）：

| 违规模式 | 替换为 | 影响文件数 |
| --- | --- | --- |
| text-blue-400 等 raw Tailwind colors | text-[var(--color-*)] 语义色 | ~24 |
| z-10 / z-30 / z-50 | z-[var(--z-dropdown)] 等 Token 变量 | ~8 |
| shadow-[0_18px_48px_...] | shadow-[var(--shadow-xl)] | ~5 |
| text-[28px] 等散装字号 | text-[var(--text-3xl)] 或语义化排版组件 | ~20+ |
| !bg-* 强制覆盖 | 修复层叠逻辑，移除 !important | ~5 |

### Phase 3：建立语义化排版组件

封装 Typography 工具类或组件，让业务代码通过语义名称引用，而不是裸写像素值：

```
Heading-1  → text-3xl / font-semibold / leading-tight
Heading-2  → text-2xl / font-semibold / leading-tight
Heading-3  → text-xl  / font-medium  / leading-normal
Body       → text-base / font-normal / leading-normal
Body-Small → text-sm  / font-normal / leading-normal
Caption    → text-xs  / font-normal / leading-relaxed / color-text-secondary
```

---

## Token 命名规范

Token 命名采用三层结构：--{类别}-{语义}-{变体}

```
/* Color：语义优先 */
--color-text-primary
--color-text-secondary
--color-text-tertiary
--color-surface-default
--color-surface-elevated
--color-border-default
--color-accent
--color-error
--color-success

/* Typography：区分 UI 和 Editor */
--text-xs / --text-sm / ...        /* UI 字号 */
--editor-text-body / ...            /* 编辑区字号 */

/* Shadow：elevation 阶梯 */
--shadow-sm / --shadow-md / --shadow-lg / --shadow-xl

/* Z-Index：层级语义 */
--z-base / --z-sticky / --z-dropdown / --z-popover / --z-modal / --z-tooltip
```

禁止使用非语义化的 Token 名称（如 --color-gray-900、--shadow-1）。

---

## 目标 Token 完整覆盖清单

- [ ] Color — 语义化（--color-text-primary, --color-surface-elevated 等），禁止 raw Tailwind 色

- [ ] Spacing — 严格 4px Grid，禁止任意绝对值

- [ ] Typography — UI 字号阶梯 + Editor 字号阶梯 + 行高 + 字重 + 语义化组件，使用 rem 单位

- [ ] Z-Index — 严格分层，业务代码只能引用 Token 变量

- [ ] Shadow — 完整 elevation 阶梯（sm/md/lg/xl）+ 暗色模式单独定义

- [ ] Radius — 统一圆角（已基本达成）

- [ ] Motion — duration + easing 统一引用（已定义，需强制执行）+ prefers-reduced-motion 覆盖

> 📋

审计来源： Gemini（代码级审计）+ CN Agent（架构级回答）+ Joy 综合分析

## 审计总览

当前 CN 前端的核心设计矛盾：底层试图建立严谨的 Design Token 体系和受控的 Primitive 组件，但业务层为了快速交付，倒退回了滥用 Tailwind 任意值的模式。 架构徒有其表，失去了对全局一致性的约束力。

---

## 一、颜色与主题逃逸

~24 个文件存在硬编码颜色，脱离全局主题管控：

- character/types.ts — 直接使用 text-blue-400、text-red-400、text-purple-400 等 Tailwind 原始色

- SearchPanel.tsx、VersionHistoryPanel.tsx — hex/rgba 硬编码

- 多处 !bg-* 强制覆盖类

后果： 主题切换（暗色/亮色）时出现明显的视觉违和。

改造： 所有颜色统一映射到 --color-* 语义变量，禁止 raw Tailwind colors，移除所有 !important。

---

## 二、Z-Index 层级系统失效

tokens.css:41-48 已规划完整层级（--z-sticky: 100 / --z-dropdown: 200 / --z-popover: 300 ...），但执行层完全击穿：

- KnowledgeGraph.tsx:385 — z-10、z-30

- DiffHeader.tsx — z-20

- SearchPanel.tsx — z-50

- AiPanel.stories.tsx:1146 — z-50

后果： 多面板叠加、Context Menu 与 Modal 共存时必然发生 Z 轴穿透 Bug。

改造： 通过 React Portal 将弹出层提升到根节点，业务代码彻底禁止硬编码 z-index 数字。

---

## 三、阴影与深度（Elevation）滥用

代码中既有规范的 shadow-[var(--shadow-md)]，又存在：

- DiffHeader.tsx:104 — shadow-[0_18px_48px_rgba(0,0,0,0.45)]

- ModelPicker.tsx — 类似魔法阴影

后果： 深度表达混乱，破坏用户的空间隐喻直觉。

改造： 补全 Shadow Token 阶梯（sm/md/lg/xl），收拢所有魔法阴影。

---

## 四、魔法数值与响应式弹性破坏

布局充斥任意绝对值，在极端窗口尺寸或系统字体缩放时极易崩塌：

- ZenMode.tsx — px-[80px] py-[120px] max-w-[720px]

- DiffView.tsx — max-h-[300px]

- CharacterDetailDialog.tsx — max-h-[calc(100%-3.5rem)]

- DashboardPage.tsx:101 — w-[35%] + min-h-[280px]

- 多处 — calc(85vh-160px) 等视口绑定计算，未通过统一 Surface 容器抽象

风险： 13 寸笔记本缩小窗口 → 布局崩塌 + 双滚动条；未来分屏显示 → 不可用；面板拖拽 → 实现路径被切断。

---

## 五、滚动容器碎片化

- 全局约 194 处 独立的 overflow-hidden、overflow-y-auto 或 max-h-* 声明

- 缺乏统一的 <ScrollArea /> 容器级组件

- Dialog 内部、FileTreePanel、VersionHistoryPanel 各自为战

改造： 封装 <ScrollArea> 统一处理滚动条视觉样式、阴影遮罩、越界隐藏和键盘导航。

---

## 六、排版（Typography）语义化缺失

当前排版完全没有抽象层，属于"像素级修图"编码：

- DashboardPage.tsx 标题 — text-[28px] font-normal tracking-[-0.02em]

- 辅助文本 — text-[10px] tracking-[0.1em]

- 各处散装 text-[13px]、text-sm、leading-relaxed 拼接

- 零语义化：无 Heading-1、Body-Regular、Caption 等规范

后果： 用户大脑需要额外算力去解析"这个字号在当前上下文中代表什么权重"——认知疲劳。

---

## 七、布局刚性与容器越权

Feature 级组件不应感知视口边界，但当前大量越权：

- DashboardPage.stories.tsx、CharacterPanel — 强制 h-screen min-h-[700px]

- 多处子模块 — absolute inset-0、w-screen、h-screen

- DashboardPage Hero Card — 写死 w-[35%]，超宽屏空旷，窄屏挤压

改造： 引入 Workbench Shell 统一分配空间（Topbar + LeftActivityBar + MainEditor + RightPanel + BottomStatusArea），业务组件只输出 flex-1 或 size-full，禁止 h-screen / w-screen。

---

## 八、设计哲学断层：IDE vs Web App

> 产品定位是「IDE（创作工作台）」，但前端实现却采用「普通 Web App」的心智模型。

三重心智负担：

1. 焦点阻断 — IDE 强调沉浸式 Flow State，但 ExportDialog 等全屏 Modal 每次弹出都切断上下文

1. 空间不可预测 — IDE 视口应是"可停靠、可伸缩的 Panel"，但模块试图自己接管视口

1. 视觉噪音 — 过度依赖微观边框和阴影争夺焦点

### 关键决策：弹窗 vs 侧边栏

> 💡

结论：对于 CN 这样的写作 IDE，弹窗（Modal/Dialog）在大多数场景下确实更优。

侧边栏的问题：

- Memory 面板展开后已占屏幕近 1/3，主编辑区被压缩

- 编辑区宽度直接关系写作体验，侧边栏侵占是有代价的

- 左侧栏已塞满功能（搜索、大纲、历史、人物、角色关系），每个都用侧边栏会拥挤不可预测

弹窗更适合 CN 的理由：

1. 保持编辑区稳定 — 写作时最怕页面布局跳动，弹窗不会挤压主内容区

1. 聚焦交互 — Memory 设置、规则编辑等属于"配置型"任务，用完即走

1. 空间更充裕 — 屏幕中央弹窗可以比侧边栏更宽更高

1. 一致性好维护 — 所有侧边栏按钮统一走弹窗，交互模式统一

例外： 需要并排比对的场景（如版本历史 Diff）仍应使用可停靠 Panel。

---

## 改造优先级

| 优先级 | 改造项 | 目标文件/区域 |
| --- | --- | --- |
| P0 极危 | Z-Index 硬编码清理 + Portal 提升 | KnowledgeGraph、DiffHeader、SearchPanel、AiPanel |
| P1 高危 | 颜色硬编码清扫 | character/types.ts、SearchPanel、VersionHistoryPanel 等 ~24 文件 |
| P1 高危 | Workbench Shell 引入 | AppShell、DashboardPage、CharacterPanel 等 |
| P2 中危 | ScrollArea 组件封装 | 194 处 overflow 声明 |
| P2 中危 | Typography Token + 语义化排版 | 全局 ~20+ 文件散装字号 |
| P3 改善 | 魔法阴影收拢 | DiffHeader、ModelPicker 等 ~5 文件 |
| P3 改善 | 间距魔法值替换 | ZenMode、DiffView、DashboardPage 等 |

> 📍

Primitives 基础完备，Radix UI 底座扎实。核心问题是业务层绕过 Primitives 散写原生元素。

## 三层架构模型

```
Layer 1: Primitives  → 基础 UI 原子（Button, Input, Dialog...）
Layer 2: Composites  → 组合组件（Toolbar, Sidebar Item, Command Palette Row...）
Layer 3: Patterns    → 页面级模式（Page Header, Editor Canvas, Settings Panel...）
```

原则： Layer 1 必须像素级完美，因为它是一切的基石。Layer 2 关注组合规则。Layer 3 关注页面节奏。

---

## Layer 1：Primitives 现状

### 已有组件清单（25 个）

基本使用 Radix UI 作为无头组件底座，耦合度极低，完全纯受控：

- 交互类： Button、Input、Textarea、Select、Checkbox、Radio、Toggle、Slider

- 反馈类： Dialog、Popover、Tooltip、Toast

- 展示类： Card、Accordion、Avatar、Badge、Skeleton、Tabs

- 上传类： ImageUpload

### 评估

- ✅ 耦合度极低，无状态依赖，只负责 UI 渲染

- ✅ 代码注释中频繁引用 design spec §xxx，有规范意识

- ✅ Button.tsx:40-99 已有统一状态定义（variant + size + state 数组映射）

- ✅ ListItem 已统一定义 focus-visible:outline-[var(--color-ring-focus)]

- ⚠️ hover/focus/disabled 状态和过渡动画尚未完全收敛到所有 Primitives

### 缺失组件

- ❌ ScrollArea — 当前最大的结构性缺口，导致 194 处碎片化滚动声明

- ❌ Typography 组件 — 无 <Heading>、<Text>、<Caption> 等语义化排版组件

- ❌ Surface / Panel 容器 — 无统一的面板容器抽象

---

## Layer 2：Composites 清单

> 🧩

Composites = Primitives 的有意义组合。 每个 Composite 封装一种「交互模式」而非一个「UI 元素」。业务层（Layer 3）只组装 Composites，不再直接拼装 Primitives。

### 从现有代码推导的 Composites

CN 的 69 个 Feature 组件中，反复出现以下组合模式——这些就是应该被抽象为 Layer 2 的 Composites：

| Composite | 组合的 Primitives | 封装的交互模式 | 当前散写位置（需收敛） |
| --- | --- | --- | --- |
| ToolbarGroup | Button × N + Separator + Tooltip | 水平工具栏，按钮组间距 + 溢出折叠 | EditorToolbar、DiffHeader 各自拼装 |
| CommandItem | ListItem + Kbd + Icon | 命令面板行：图标 + 标签 + 快捷键 + hover/active | SearchPanel 内散写，CommandPalette 重复实现 |
| SidebarItem | ListItem + Icon + Badge + DragHandle | 侧边栏导航项：可拖拽、可折叠、多层级缩进 | FileTreePanel、CharacterListPanel 各自实现 |
| PanelContainer | Surface + ScrollArea + ResizeHandle | 可停靠面板：标题栏 + 滚动区域 + 拖拽调整宽度 | AiPanel、SearchPanel、FileTreePanel 各自硬编码 h-screen  • overflow |
| FormField | Label + Input/Select/Textarea + ErrorText | 表单字段：标签 + 输入 + 校验错误提示 | SettingsPanel、ExportDialog 散写 |
| ConfirmDialog | Dialog + Text + Button × 2 | 确认弹窗：标题 + 描述 + 取消/确认按钮 | 多处重复实现 Dialog + 按钮组合 |
| DropdownMenu | Popover + ListItem × N + Separator | 下拉菜单：触发器 + 选项列表 + 分组分隔 | ModelPicker、ContextMenu 各自实现 |
| InfoBar | Surface + Icon + Text + Button(optional) | 信息提示条：成功/警告/错误 + 可选操作按钮 | Toast 之外的内联提示各处散写 |
| SearchInput | Input + Icon(search) + Kbd + ClearButton | 搜索框：前置图标 + 快捷键提示 + 清除按钮 | SearchPanel、CommandPalette、FileTreePanel 重复 |
| EmptyState | Surface + Icon + Text + Button(optional) | 空状态：插图/图标 + 说明文字 + 可选操作 | 多处内联 div  • 文字，无统一样式 |
| TabBar | Tabs + Badge + CloseButton | 标签栏：可关闭 + 未保存标记 + 拖拽排序 | EditorTabs 单点实现，无法复用 |
| PropertyRow | Label + dynamic value (Text/Select/Date/Person) | 属性行：左侧标签 + 右侧可编辑值 | CharacterDetailDialog、MetadataPanel 各自实现 |

### Composite 设计规则

1. 只组合 Layer 1 Primitives——Composite 不能依赖另一个 Composite（防止嵌套爆炸）

1. Props 透传 Primitive 的 variant/size——Composite 不发明新的 variant 系统，直接复用 Primitive 的

1. 零业务逻辑——Composite 不 import Store、不调用 IPC、不持有业务状态

1. Slot 模式处理变体——用 children / renderProp / slot 处理内容变化，而非 if/else 分支

1. 每个 Composite 必须有 Storybook story——独立可视化验证

### 实施优先级

| 优先级 | Composite | 理由 |
| --- | --- | --- |
| P0 | PanelContainer、SidebarItem、CommandItem | 覆盖最多"脏区"文件，收益最大 |
| P1 | SearchInput、ToolbarGroup、FormField | 消除重复代码最多 |
| P2 | ConfirmDialog、DropdownMenu、EmptyState | 统一交互模式 |
| P3 | InfoBar、TabBar、PropertyRow | 目前散写点较少，可后续补 |

### 与改造计划的协同

```
Phase 1 (Primitives 补全)    → ScrollArea + Typography + Surface 就位
                                ↓
Phase 2 (Composites 封装)     → 用 ↑ 的 Primitives 组装 12 个 Composites
                                ↓
Phase 3 (Feature 层清理)      → Feature 组件替换散写代码为 Composites
```

每个 Composite 封装后，对应的"脏区"文件自然被清理——Composites 是 Feature 层清理的前置条件，不是独立任务。

---

## Layer 3：Features 现状

### 规模

- 69 个 Feature 组件，分布在 src/features/ 下

- 核心业务容器：DashboardPage、SearchPanel、AiPanel、FileTreePanel、KnowledgeGraph

### 耦合度分析

| 指标 | 数值 | 评估 |
| --- | --- | --- |
| 直接使用 Store Hook 的文件 | 43 处 import { useXxxStore } | ⚠️ 中等偏高 |
| 直接调用 IPC invoke 的文件 | 13 个 | ⚠️ 渲染/主进程边界模糊 |
| 散写原生 <button> / <input> | 较多 | ❌ 绕过 Primitives |
| 样式硬编码比例 | ~15-20% 业务组件 | ⚠️ 需清理 |

### "脏区"集中文件

以下 Feature 组件是违规最集中的区域，优先清理：

1. SearchPanel.tsx — 硬编码颜色 + Z-Index 违规 + 散写原生元素

1. CharacterDetailDialog.tsx — 魔法数值 + 硬编码色值 + transition-all

1. VersionHistoryPanel.tsx — 硬编码颜色 + 滚动处理碎片化

1. ExportDialog.tsx:727 — 局部绕过设计系统

1. KnowledgeGraph.tsx — Z-Index 硬编码 + 绝对定位越权

---

## 改造方案

### 1. 补全缺失 Primitives（优先）

ScrollArea：

- 封装统一的滚动容器，处理滚动条样式、阴影遮罩、越界隐藏

- 替换全局 194 处碎片化的 overflow-* 声明

Typography：

- 封装 <Heading level={1-4}> / <Text size="sm|base|lg"> / <Caption> 等

- 内部引用 Typography Token，业务代码通过语义名称引用

Surface / Panel：

- 封装统一面板容器，业务组件不再自行处理 h-screen / overflow / border

- Panel 自动处理可停靠、可伸缩逻辑

### 2. 收敛 Primitives 的交互状态

改造难度：低。 架构已高度收敛。

执行方案：

- 在 Button.tsx、Input.tsx、Select.tsx、Card、ListItem 的基础类字符串数组中更新 hover: / focus-visible: 规则

- 统一引用 --duration-fast 和 --ease-default

- 这些改动会立即全站全局生效

### 3. 清理 Feature 层违规

两段式策略：

1. Phase A： 改好 Primitives → 自动获得一波全局收益

1. Phase B： 逐个清理 5 个"脏区" Feature，替换原生元素为 Primitives，清除硬编码

### 4. IPC 调用收敛

当前 13 个文件直接调用 IPC invoke，应收敛到统一的 Service 层：

```
Feature 组件 → Service 层（统一 IPC 调用）→ Main Process
```

禁止 Feature 组件直接 import { ipcRenderer } 或 window.electron.invoke()。

> 📍

动画 Token 已定义但未被充分引用。业务层大面积使用宽泛的 transition-all，交互反馈拖沓且缺乏阻尼感。

## 现状诊断

### 已有的动画 Token

```
--duration-fast:    100ms;
--duration-normal:  200ms;   /* 待确认 */
--ease-default:     cubic-bezier(...);
```

### 核心问题

1. transition-all 泛滥

多处代码使用宽泛的 transition-all duration-300，而不是精确限制 transition-property：

- CharacterDetailDialog.tsx — transition-all

- CharacterPanel.stories.tsx — transition-all

- 大量业务组件 — 未指定具体属性

后果：

- 触发不必要的重绘（GPU 合成层过多）

- 所有属性同时过渡，动画显得"糊"而不是"脆"

- 交互反馈节奏与设计规范脱节

2. Duration 未引用 Token

虽然定义了 --duration-fast: 100ms，但业务代码直接写 duration-300、duration-200 等硬编码值。

3. 缺乏动画编排意识

当前所有动画都是"单属性过渡"，没有时差编排（Stagger）和序列编排（Sequence）的概念。

---

## 动画设计哲学

> 交互微动效的设计哲学是"克制且符合物理直觉"。

### 三条原则

1. 精确而非宽泛 — transition-colors 而非 transition-all

1. 快速而非缓慢 — IDE 交互应该是 100-200ms，不是 300-400ms

1. 有阻尼而非线性 — 使用 ease-out 或自定义 cubic-bezier，不是 linear

---

## 动画编排表（Motion Choreography Sheet）

### 微交互（100-150ms）

| 交互场景 | Duration | Easing | Property | 效果 |
| --- | --- | --- | --- | --- |
| 按钮 hover | 100ms | --ease-default | background-color, color | 背景色渐变 |
| 按钮 active | 80ms | ease-out | transform | scale(0.98) 轻微按压 |
| 链接/文字 hover | 120ms | ease-out | color | 颜色渐变 |
| Toggle 切换 | 150ms | ease-out | transform, background-color | 滑块移动 + 背景变色 |
| Checkbox 勾选 | 100ms | ease-out | transform, opacity | 勾号出现 + 轻微弹跳 |

### 面板过渡（200-300ms）

| 交互场景 | Duration | Easing | Property | 效果 |
| --- | --- | --- | --- | --- |
| 侧边栏展开/折叠 | 250ms | cubic-bezier(0.16,1,0.3,1) | width, opacity | 内容先淡出 → 宽度收缩（时差 50ms） |
| 弹窗出现 | 200ms | ease-out | transform, opacity | scale(0.98→1)  • opacity(0→1) |
| 弹窗关闭 | 150ms | ease-in | transform, opacity | scale(1→0.98)  • opacity(1→0) |
| 下拉菜单展开 | 180ms | ease-out | transform, opacity | translateY(-4px→0)  • fade-in |
| Tooltip 出现 | 150ms | ease-out | opacity | 纯 fade-in，不要位移 |

### 拖拽与编辑（即时-200ms）

| 交互场景 | Duration | Easing | Property | 效果 |
| --- | --- | --- | --- | --- |
| Block 拖拽浮起 | 150ms | ease-out | box-shadow, transform | shadow-lg  • scale(1.02) |
| Block 拖拽放下 | 200ms | cubic-bezier(0.16,1,0.3,1) | box-shadow, transform | 阴影消失 + 缩放回 1 |
| 列表项排序 | 200ms | ease-out | transform | translateY 平滑位移 |

---

## 缺失场景补充

当前页面只覆盖了“微交互 / 面板过渡 / 拖拽”三类动画，以下四类场景在写作 IDE 中同样关键但完全缺失。

### 场景 A：Loading 骨架屏（Skeleton）

> ⚠️

当前 CN 没有任何骨架屏。 文件树、人物列表、KG 面板等异步数据加载时要么空白要么只有 Spinner，用户感知是“卡死”。

| 区域 | 骨架屏形态 | 过渡方式 | 时机 |
| --- | --- | --- | --- |
| 编辑区 | 模拟文档行结构（长短不一的灭色条） | skeleton → 内容 crossfade 200ms | 文档切换时 |
| 文件树 | 模拟缩进层级的矩形块 | skeleton → 列表 stagger fade-in 50ms/item | 项目加载 / 切换时 |
| 人物列表 | 圆形头像 + 文字条 | skeleton → 卡片 stagger fade-in 30ms/item | 侧边栏展开时 |
| KG 面板 | 模拟节点 + 连线的粗略形状 | skeleton → canvas 节点渐现 | KG 数据加载时 |

实现方案：

```
// Skeleton Primitive——统一动画 Token
const Skeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      'animate-pulse rounded bg-[var(--color-bg-tertiary)]',
      className
    )}
  />
)

// 编辑区骨架屏示例
const EditorSkeleton = () => (
  <div className="space-y-3 p-6">
    <Skeleton className="h-8 w-3/4" />   {/* 标题 */}
    <Skeleton className="h-4 w-full" />   {/* 正文行 */}
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-4 w-4/6" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
  </div>
)
```

关键规则：

- 骨架屏形状必须与真实内容布局粗略匹配（不是像素级匹配）

- animate-pulse 使用 --duration-slow（300ms）的呼吸灯效果

- 加载时间 < 200ms 的场景不显示骨架屏（避免闪烁）——用 setTimeout 延迟显示

### 场景 B：错误反馈动画

> 💥

错误状态是写作 IDE 中最容易引发恐慌的场景。 保存失败、网络断开、AI 超时——动画的目标是降低焦虑，而不是增加干扰。

| 错误场景 | 反馈形式 | 动画 | 持续时间 |
| --- | --- | --- | --- |
| 保存失败 | StatusBar 红色闪烁 + “保存失败”文字 | bg-color pulse 2次 → 平静 | 保持到下次保存成功 |
| 网络断开 | TopBar 橙色 Banner 滑入 | translateY(-100% → 0) 250ms ease-out | 网络恢复后自动收起 |
| AI 请求超时 | AI Panel 内 inline 提示 + 重试按钮 | fade-in 150ms，不要抢眼 | 用户关闭或重试后消失 |
| 表单验证错误 | 输入框 shake + 红色边框 | translateX shake 300ms (0 → -4px → 4px → -2px → 0) | 错误修复后边框恢复 |
| IPC 通信失败 | 全局 Toast 从右下角滑入 | translateX(100% → 0) 200ms + 5s 后自动滑出 | 5 秒自动消失 |

Shake 动画实现：

```
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-4px); }
  40%      { transform: translateX(4px); }
  60%      { transform: translateX(-2px); }
  80%      { transform: translateX(2px); }
}
.animate-shake {
  animation: shake 300ms var(--ease-default);
}
```

### 场景 C：AI 流式输出动画

> ✨

AI 流式生成是 CN 最核心的差异化体验。 它的动画质量直接决定用户对“AI 是否智能”的感知——即使输出内容一样，流畅的打字效果会显得“更智能”。

#### 设计决策：Prompt-Response Panel，而非 Chat Bubble

> 🚨

CN 的 AI 交互不采用 ChatGPT 式的双气泡对话 UI。

CN 采用 Prompt-Response Panel 模式（参考 Cursor AI Pane / Notion AI Panel）：

|  | Chat Bubble（✘ 不采用） | Prompt-Response Panel（✔ CN 采用） |
| --- | --- | --- |
| 布局 | 左右对齐气泡，用户在右、AI 在左 | 用户输入栏在顶部/底部，AI 输出占满面板宽度 |
| 视觉隐喻 | “聊天对话”——AI 是对谈伙伴 | “调用工具”——AI 是执行器，输出是“结果”而非“回复” |
| 头像 | 有用户/AI 头像 | 无头像，无左右对齐 |
| 宽度利用 | 气泡占 60-70% 宽度，剩余空间浪费 | 输出占满 100% 面板宽度，信息密度最大化 |
| 适合场景 | 闲聊、多轮探讨 | 写作 IDE——指令式交互，用完即走 |
| 代表产品 | ChatGPT、Claude Web | Cursor AI Pane、Notion AI、Linear AI |

布局结构：

```
┌────────────────────────────────────┐
│  📝 用户输入栏（Command Bar）       │
│  “帮我改写第三段…”            [Send]  │
├────────────────────────────────────┤
│                                    │
│  AI 输出区（占满面板宽度）           │
│                                    │
│  第三段的新版本如下：             │
│                                    │
│  “夏日的光线透过百叶窗，在       │
│   地板上投下破碎的影子…”         │
│                                    │
│  [插入] [复制] [重新生成]          │
│                                    │
└────────────────────────────────────┘
```

动画含义： 因为输出区占满宽度，流式动画的视觉冲击力比气泡更强——所以动画必须更克制：不需要“打字机”的表演感，而是“结果渐现”的工具感。

当前问题： AI 输出大概率是粗暴的逐字插入 DOM，没有打字机缓冲、没有游标闪烁、没有段落级淡入。

目标体验（参考 Cursor AI Pane / Notion AI Panel）：

| 阶段 | 动画表现 | 实现要点 |
| --- | --- | --- |
| 等待中 | “✨” + 三点呼吸灯（opacity pulse） | animate-pulse 三个圆点，stagger 150ms |
| 流式输出中 | 逐字打出 + 光标闪烁 + 新段落淡入 | 16ms 帧率字符缓冲 + caret-blink 伪元素 + 段落 opacity 0→1 200ms |
| 代码块出现 | 代码块整体滑入 + 语法高亮渐现 | 先显示灰色背景块 translateY(8px→0) 200ms，然后内容流式填充 |
| 完成 | 光标消失 + “✅ Done” 淡入 | 光标 fade-out 200ms，完成标记 fade-in 150ms |

字符缓冲器实现：

```
// 流式输出缓冲器——避免逐 token 重绘，改为帧级批量插入
class StreamBuffer {
  private buffer: string[] = []
  private rafId: number | null = null

  push(chunk: string) {
    this.buffer.push(chunk)
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => this.flush())
    }
  }

  private flush() {
    const text = this.buffer.join('')
    this.buffer = []
    this.rafId = null
    // 批量插入 DOM，一帧只触发一次 reflow
    this.onFlush(text)
  }
}
```

光标闪烁 CSS：

```
@keyframes caret-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
.ai-caret::after {
  content: '▎';
  animation: caret-blink 800ms step-end infinite;
  color: var(--color-accent);
}
```

### 场景 D：路由过渡（视图切换）

> 💨

CN 的“路由”不是传统 SPA 路由，而是视图切换： 从 Dashboard → Editor、从文档 A → 文档 B、从普通模式 → Zen Mode。这些切换需要动画连接——否则用户会感觉“闪断”。

| 切换场景 | 动画类型 | 参数 | 说明 |
| --- | --- | --- | --- |
| Dashboard → Editor | Crossfade + 轻微缩放 | Dashboard opacity 1→0  • scale(1→0.98) 200ms，Editor opacity 0→1 200ms | “进入深层”的空间感 |
| Editor → Dashboard | Crossfade + 轻微放大 | 与上方相反，Dashboard scale(0.98→1) 返回 | “返回上层”的空间感 |
| 文档 A → 文档 B | 纯 Crossfade | opacity 150ms，不加位移或缩放 | 同层级切换，轻量过渡即可 |
| 普通模式 → Zen Mode | 左右栏滑出 + 编辑区居中扩展 | 侧边栏 translateX(0→-100%) 300ms + 编辑区 max-width 扩展 300ms | “屏息凝神”的仪式感 |
| Zen Mode → 普通模式 | 与上方相反 | 侧边栏滑入 + 编辑区收窄 | “回到工作台” |

实现方案（基于 React + Framer Motion 或纯 CSS）：

```
// 视图过渡 Hook
function useViewTransition() {
  const [transitioning, setTransitioning] = useState(false)

  const transitionTo = useCallback((nextView: () => void) => {
    setTransitioning(true)
    // 等待退场动画完成
    setTimeout(() => {
      nextView()
      // 入场动画自动触发
      requestAnimationFrame(() => setTransitioning(false))
    }, 200)
  }, [])

  return { transitioning, transitionTo }
}
```

---

## 改造方案

### Phase 1：替换 transition-all

批量搜索替换策略：

| 原始写法 | 替换为 | 适用场景 |
| --- | --- | --- |
| transition-all duration-300 | transition-colors duration-[var(--duration-fast)] | 纯颜色变化（hover） |
| transition-all duration-200 | transition-[transform,opacity] duration-200 | 面板出现/消失 |
| transition-all | 根据场景精确指定 property | 所有其他 |

### Phase 2：统一引用 Token

所有 duration 和 easing 引用 Token 变量：

```
/* 在 tokens.css 中补全 */
--duration-instant: 80ms;    /* 按压反馈 */
--duration-fast:    100ms;   /* 已有 */
--duration-normal:  200ms;   /* 面板过渡 */
--duration-slow:    300ms;   /* 复杂编排 */

--ease-default:  cubic-bezier(0.16, 1, 0.3, 1);  /* 已有 */
--ease-in:       cubic-bezier(0.4, 0, 1, 1);
--ease-out:      cubic-bezier(0, 0, 0.2, 1);
```

### Phase 3：在 Primitives 中内置

在 Button.tsx、Input.tsx、Select.tsx、Card、ListItem 的基础类数组中加入：

```
hover:bg-[var(--color-*)] 
transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)]
```

这些改动会立即全站全局生效。

---

## 目标清单

- [ ] 消除所有 transition-all — 替换为精确的 transition-property

- [ ] 所有 duration 引用 Token 变量 — 禁止硬编码 duration-300

- [ ] 所有 easing 引用 Token 变量 — 禁止裸写 ease-in-out

- [ ] Primitives 内置统一的过渡动画

- [ ] 面板展开/折叠加入时差编排（内容淡出 → 尺寸变化）

- [ ] 弹窗加入 scale + opacity 组合动画

- [ ] 封装 <Skeleton> Primitive + 四大区域骨架屏

- [ ] 错误反馈动画系统（StatusBar pulse / TopBar banner / Toast / shake）

- [ ] AI 流式输出动画（字符缓冲 + 光标闪烁 + 段落淡入）

- [ ] 视图切换过渡（Dashboard↔Editor / 文档切换 / Zen Mode）

> 🎯

逆向拆解标杆产品，提取可迁移的设计模式。 不是抄界面，而是理解"为什么这样做"。

## 标杆产品

### Notion — 编辑器体验的天花板

值得学习的：

- Block 系统的视觉一致性 — 每一个 block 的 spacing、typography、hover state、transition timing 都遵循同一套数学关系

- 极度克制的颜色使用 — 主界面几乎只有黑白灰 + 一个强调色，信息层级靠字重和间距区分而非颜色

- 微交互的精准度 — 拖拽时阴影升起 + 轻微缩放；Slash command 的 subtle fade-in + slide-up；侧边栏折叠的内容淡出 → 宽度收缩时差编排

- Cmd+K 的即时响应感 — 弹出速度 <100ms，输入无延迟

- 编辑器 + 数据库的统一体验 — 切换无割裂感

CN 可以借鉴的：

- Block 间距系统（Notion 的 4px grid 极为严格）

- Slash command / Command Palette 的交互节奏

- 侧边栏折叠的动画编排方式

不需要学的：

- Notion 的多人协作实时同步机制（CN 是单机写作 IDE）

- Notion 的数据库系统复杂度

---

### Cursor — IDE 中 AI 集成的标杆

值得学习的：

- 在 VS Code 基础上做极度克制的增量改动 — 每一处都不破坏整体节奏，这是"演进式设计"的典范

- AI 交互感觉原生 — 不像是"粘"上去的功能，而是编辑器的自然延伸

- 内联 AI 补全的视觉处理 — 灰色 ghost text + 淡入动画，不打断写作节奏

- 多面板布局稳定性 — 侧边栏、终端、编辑区的空间分配非常稳定

CN 可以借鉴的：

- AI 补全/建议的视觉处理方式（ghost text 而非弹窗）

- 面板布局的稳定性原则——编辑区永远不被意外压缩

- AI 面板与主编辑区的空间关系

---

### Linear — 极致的交互性能

值得学习的：

- 响应速度 — 所有操作都在 <50ms 内响应，给用户"直接操作"的错觉

- 动画的物理感 — 弹簧动画（spring physics）而非线性过渡

- 键盘优先 — 几乎所有操作都可以纯键盘完成

- 极简的视觉设计 — 大量留白，信息密度恰到好处

CN 可以借鉴的：

- 交互响应速度目标：<100ms

- 键盘快捷键体系的设计思路

- 动画的弹簧物理模型（如果未来引入 framer-motion）

---

## 直接竞品：写作工具

> CN 是写作 IDE，上面三个标杆是“通用工具”参考，以下四个才是直接竞品——它们和 CN 争夺同一批用户。

### iA Writer — 纯粹写作体验的极致

产品定位： 极简主义 Markdown 编辑器，“少即是多”的设计哲学。

值得学习的：

- Typography 极致 — 自研 iA Writer Duo / Quattro 字体，字号阶梯仅 3 级（标题/正文/脚注），行高 1.5-1.7，每个参数都经过可读性研究验证

- Focus Mode — 只高亮当前句子/段落，其余淡化为 30% 透明度，这是“沉浸式写作”的标杆实现

- 零 UI 干扰 — 无工具栏、无侧边栏、无颜色、无装饰；用户打开就直接写

- 字数统计的克制展示 — 状态栏仅显示字数/阅读时间，不用进度条或贮家感设计

CN 可以借鉴的：

- ZenMode 应该对标 iA Writer 的 Focus Mode，而不是只是“隐藏侧边栏”

- Typography Token 的行高/字重设定可参考 iA 的研究数据

- 编辑区的默认状态应该是“干净”的，而不是“功能丰富”的

CN 的优势：

- iA Writer 无 AI 能力、无知识图谱、无人物管理——这些是 CN 的差异化护城河

---

### Ulysses — 长篇写作的项目管理

产品定位： 面向长篇写作的 Markdown 编辑器 + 项目管理器。

值得学习的：

- Library → Group → Sheet 三层结构 — 文件组织很符合写作者心智模型（书 → 章节 → 片段）

- 无缝拼接导出 — 多个 Sheet 可以按顺序拼接为一个完整文档导出（ePub / PDF / DOCX）

- 写作目标系统 — 可设定字数/截止日期目标，状态栏显示进度

- iCloud 同步 — Mac / iPad / iPhone 无缝切换

CN 可以借鉴的：

- 文件树的组织方式可参考 Ulysses 的“书 → 章节 → 片段”模型

- 导出功能应该支持多片段拼接（CN 已有 ExportDialog，但拼接能力未知）

- 写作目标/进度追踪是写作工具的标配功能

CN 的优势：

- Ulysses 的 AI 集成极为浅层（仅基础纠错），CN 的 AI 协作深度远超

- Ulysses 无知识图谱、无人物关系网络

---

### Scrivener — 小说家的专业工具

产品定位： 专业级长篇写作工具，功能极其丰富但界面老旧。

值得学习的：

- Binder（活页夹） — 左侧树状结构可拖拽重排，每个节点可以是场景/章节/研究资料

- Corkboard 视图 — 每个场景变成一张索引卡，可在软木板上拖拽重排，这是“视觉化情节规划”的经典交互

- Research 文件夹 — 可以在项目内存放参考图片、PDF、网页截图，写作时并排查看

- Compile（编译导出） — 极其强大的导出系统，可定义复杂的排版规则

- Snapshots — 每次重大修改前可保存快照，类似简化版的 Git

CN 可以借鉴的：

- Corkboard 概念 — CN 的 KnowledgeGraph 可以借鉴这种“视觉化情节结构”的交互模式

- Research 并排查看 — 写作时能同时查看参考资料是专业写作工具的刚需

- Snapshots — CN 已有 VersionHistoryPanel，可以对标 Scrivener 的快照体验

CN 的优势：

- Scrivener 的 UI 停留在 2010 年代，视觉设计极其过时——这是 CN 最大的体验差异化机会

- Scrivener 零 AI 能力，零知识图谱

- Scrivener 的学习曲线极陡，CN 应该追求“开箱可用”

---

### Obsidian — 知识图谱 + Markdown 编辑器

产品定位： 本地优先的 Markdown 知识管理工具，插件生态极其丰富。

值得学习的：

- Graph View — 知识图谱的视觉化标杆，节点大小反映链接数，拖拽流畅，缩放自然

- 双向链接 — [[wikilink]] 语法即时创建双向关联，无需手动维护

- Canvas — 自由画布上摆放笔记、图片、链接，用线条连接，类似无限白板

- 插件系统 — 社区插件 2000+，覆盖几乎所有需求

- 本地优先 — 所有数据存储在本地 .md 文件，用户完全掌控

CN 可以借鉴的：

- KnowledgeGraph 对标 Graph View — CN 已有 KnowledgeGraph.tsx，应该对标 Obsidian 的交互流畅度（拖拽手感、缩放平滑度、节点 hover 信息）

- 双向链接体验 — 写作时快速建立人物/场景/线索之间的关联

- Canvas 概念 — 用于情节规划和世界观构建的自由画布

CN 的优势：

- Obsidian 的富文本编辑体验远不如 TipTap/ProseMirror 驱动的编辑器

- Obsidian 的 AI 集成依赖第三方插件，体验碎片化

- Obsidian 面向“笔记”而非“创作”，CN 的人物系统 / Memory 系统是写作工具的独特价值

---

## 竞品综合对比

| 维度 | iA Writer | Ulysses | Scrivener | Obsidian | CN |
| --- | --- | --- | --- | --- | --- |
| 核心场景 | 纯粹写作 | 长篇 + 管理 | 小说/剧本 | 知识管理 | AI 协作写作 |
| AI 集成 | ❌ 无 | ⚠️ 浅层 | ❌ 无 | ⚠️ 插件 | ✅ 深度原生 |
| 知识图谱 | ❌ | ❌ | ❌ | ✅ Graph View | ✅ KG + 人物网络 |
| 人物/角色管理 | ❌ | ❌ | ✅ Character Sheet | ❌ | ✅ + AI 理解 |
| Memory 系统 | ❌ | ❌ | ❌ | ❌ | ✅ 独家 |
| 沿浸式写作 | ⭐ 标杆 | ✅ 良好 | ⚠️ 一般 | ⚠️ 一般 | 目标：⭐ |
| 视觉设计 | ⭐ 极简优雅 | ✅ 现代 | ❌ 过时 | ✅ 可主题 | 目标：⭐ |
| 技术架构 | 原生 AppKit | 原生 AppKit | 原生 AppKit | Electron | Electron |

### CN 的竞争位置

> 🎯

CN 的独特价值主张： 把 iA Writer 级别的沿浸式写作体验，与 Scrivener 级别的项目管理能力，通过原生 AI 协作统一在一个现代化的界面里。这是任何现有工具都未实现的组合。

要达到这个目标，前端必须解决：

1. 编辑区体验达到 iA Writer 水准 — Typography Token、行高、Focus Mode 的极致打磨

1. 面板稳定性达到 Cursor 水准 — AppShell 拆分后编辑区永远不被压缩

1. KG 交互达到 Obsidian 水准 — 拖拽手感、缩放平滑、hover 信息

1. 响应速度达到 Linear 水准 — 所有操作 <100ms

---

## 逆向分析方法论

当需要分析一个标杆产品时，使用以下步骤：

### 1. 截图标注法

对标杆产品的每个核心界面截图，用标注工具标出：

- 间距数值（padding、margin、gap）

- 字号和字重

- 颜色值（前景、背景、边框）

- 圆角大小

- 阴影参数

### 2. 交互录屏法

录制标杆产品的核心交互，逐帧分析：

- 动画持续时间（Chrome DevTools → Performance → Screenshots）

- Easing 曲线

- 多属性动画的时差编排

### 3. Token 逆向

从截图中提取出 Token 系统：

- 这个产品用了多少种灰色？

- 间距只有哪几个值？

- 字号阶梯是什么？

### 4. 差异对比

将逆向得到的 Token 与 CN 当前的 Token 对比：

- 哪些维度 CN 缺失？

- 哪些维度 CN 已有但不够精确？

- 哪些维度 CN 做得更好？

---

## CN 差异化定位

> CreoNow 不是 Notion，也不是 Cursor。它是写作者的 IDE。

| 维度 | Notion | Cursor | CreoNow |
| --- | --- | --- | --- |
| 核心用户 | 知识工作者 | 程序员 | 文字创作者 |
| 编辑器核心 | Block Editor | Code Editor | Rich Text + AI 协作 |
| AI 角色 | 辅助工具 | 编程伙伴 | 创作伙伴 |
| 空间隐喻 | 文档/数据库 | 代码工作区 | 写作工作台 |
| 关键体验 | 组织信息 | 写代码更快 | 沉浸式创作 Flow |

CN 应该从 Notion 学编辑器的优雅，从 Cursor 学 AI 集成的自然，从 Linear 学交互的速度感。但最终，CN 的核心差异化在于——为长篇创作者提供沉浸式的 Flow State 环境。

> 📍

Radix UI 底座自带优秀的 a11y 基因，但业务层绕过 Primitives 散写原生元素，恰好把这层保护击穿了。 可访问性不是锦上添花，是 IDE 级产品的底线。

## 为什么写作 IDE 必须重视 Accessibility

> 写作者群体中，视觉疲劳、RSI（重复性劳损）、注意力障碍的比例远高于普通用户。

- 长时间高强度用眼 — 写作者日均屏幕时间 6-10 小时，低对比度 = 眼睛加速疲劳

- 键盘重度依赖 — 专业写作者厌恶鼠标中断 Flow State，键盘导航必须完整

- 系统字体缩放 — 很多写作者会把系统字体调到 125%-150%，布局必须弹性响应

- Reduced Motion 偏好 — 部分用户对动画敏感，必须尊重系统设置

---

## 现状评估

| 维度 | 现状 | 评估 |
| --- | --- | --- |
| 键盘导航 | Radix Primitives 内建 Tab/Arrow 键导航 | ✅ Primitives 层达标；❌ 业务层散写的原生元素无键盘支持 |
| Focus 管理 | ListItem 已有 focus-visible:outline-[var(--color-ring-focus)] | ⚠️ 部分 Primitives 已收敛，但未覆盖所有交互元素 |
| Focus Trap | Radix Dialog 自带 Focus Trap | ⚠️ 仅限使用 Radix Dialog 的弹窗；自建弹窗无 Trap |
| ARIA 标注 | Radix 组件自动注入 ARIA 属性 | ❌ 散写的原生 <button> / <input> 无 ARIA label |
| 颜色对比度 | Token 体系定义了语义色 | ⚠️ 未验证是否达到 WCAG AA（4.5:1 正文 / 3:1 大字） |
| Reduced Motion | 未实现 | ❌ 无 prefers-reduced-motion 媒体查询 |
| 屏幕阅读器 | 未测试 | ❌ 未知状态，需用 VoiceOver / NVDA 实测 |
| 字体缩放响应 | 大量 px 硬编码 + h-screen 锁定 | ❌ 系统字体缩放到 150% 时布局大概率崩塌 |

---

## 核心问题

### 1. 散写原生元素击穿 Radix 的 a11y 保护

Radix UI 的最大价值之一是开箱即用的 Accessibility（键盘导航、ARIA 属性、Focus 管理）。但当前业务层大量绕过 Primitives 直接写 <button> 和 <input>，等于主动放弃了这层保护。

这意味着： 组件架构页中"原生元素替换为 Primitives"的改造，同时也是 a11y 的最大单次修复。

### 2. Focus Visible 未全局收敛

ListItem 已定义 focus-visible:outline-[var(--color-ring-focus)]，但其他 Primitives（Button、Input、Select、Card 等）的 focus-visible 状态不一致。

目标： 所有可交互元素统一使用 --color-ring-focus 作为 focus 指示器，2px offset，确保在深色和浅色模式下都清晰可见。

### 3. 颜色对比度未经验证

当前 Token 体系定义了 72 个 --color-* 变量，但从未检查过：

- 正文文字与背景的对比度是否 ≥ 4.5:1（WCAG AA）

- 辅助文字（text-secondary）与背景的对比度是否 ≥ 4.5:1

- 交互元素（按钮、链接）的对比度是否 ≥ 3:1

- 暗色模式下的对比度——暗色模式最容易翻车

### 4. 零 Reduced Motion 支持

微交互页定义了完整的 Motion Choreography Sheet，但没有一行代码处理 prefers-reduced-motion。

对动画敏感的用户（前庭障碍、偏头痛等）在使用 CN 时会感到不适。

### 5. 语义化 HTML 不足

- 侧边栏应该是 <nav> 而非 <div>

- 主编辑区应该有 <main> landmark

- 面板区域应该有 <aside> 或 role="complementary"

- 状态栏应该有 role="status" 以便屏幕阅读器播报变化

---

## 改造方案

### Phase 1：搭便车（与现有改造协同，零额外成本）

以下改造已在其他页面的计划中，它们同时也是 a11y 修复，不需要额外工作：

| 已有计划 | a11y 收益 |
| --- | --- |
| 散写原生元素 → 替换为 Primitives | 自动获得 Radix 的键盘导航 + ARIA + Focus Trap |
| Primitives 统一 hover/focus/disabled 状态 | 所有交互元素获得一致的 focus-visible 指示器 |
| Typography Token 语义化 | 字号阶梯使用 rem 单位后自动支持系统字体缩放 |
| 去除 h-screen / w-screen 硬编码 | 布局弹性恢复，字体缩放不再崩塌 |

### Phase 2：Reduced Motion 支持（0.5 天）

在 tokens.css 中加入全局 Reduced Motion 覆盖：

```
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

更精细的方案（推荐）：

```
/* tokens.css */
--duration-fast:    100ms;
--duration-normal:  200ms;
--duration-slow:    300ms;

@media (prefers-reduced-motion: reduce) {
  --duration-fast:    0ms;
  --duration-normal:  0ms;
  --duration-slow:    0ms;
}
```

优势： 因为所有动画已经（或即将）引用 Token 变量，这一条媒体查询就能一次性关闭全站动画。这是 Token 系统的结构性红利。

### Phase 3：颜色对比度审计（0.5 天）

工具：

- Chrome DevTools → Rendering → Emulate vision deficiencies

- WebAIM Contrast Checker 或 Figma 插件 Stark

检查清单：

- [ ] --color-text-primary vs --color-surface-default ≥ 4.5:1

- [ ] --color-text-secondary vs --color-surface-default ≥ 4.5:1

- [ ] --color-text-tertiary vs --color-surface-default ≥ 3:1（仅限大字/图标）

- [ ] --color-accent vs --color-surface-default ≥ 3:1

- [ ] --color-ring-focus vs 所有可能的背景色 ≥ 3:1

- [ ] 暗色模式下重复以上全部检查

- [ ] 色盲模拟（红绿色盲、蓝黄色盲）下信息是否仍可区分

### Phase 4：语义化 HTML 标注（0.5 天）

在 LayoutShell 拆分时同步加入 landmark：

```
// LayoutShell.tsx
<div className="app-shell">
  <header role="banner">         {/* Topbar */}
    ...
  </header>
  <nav aria-label="主导航">       {/* LeftActivityBar */}
    ...
  </nav>
  <main id="main-content">       {/* MainEditor */}
    ...
  </main>
  <aside aria-label="辅助面板">   {/* RightPanel */}
    ...
  </aside>
  <footer role="status">         {/* StatusBar */}
    ...
  </footer>
</div>
```

### Phase 5：屏幕阅读器实测（1 天）

测试矩阵：

| 平台 | 屏幕阅读器 | 优先级 |
| --- | --- | --- |
| macOS | VoiceOver（内置） | P0 — Mac 是 CN 主要平台 |
| Windows | NVDA（免费） | P1 |
| Windows | JAWS | P3 — 商业软件，非必须 |

测试场景：

- [ ] 启动后 focus 是否自动落在编辑区

- [ ] Tab 键能否遍历所有可交互元素，顺序是否合理

- [ ] Dialog 打开后 focus 是否被 trap 住，Escape 是否能关闭

- [ ] 侧边栏折叠/展开后 focus 是否正确转移

- [ ] AI 面板的流式输出是否有 aria-live="polite" 播报

- [ ] 编辑器内的 Slash Command 是否可用键盘完整操作

---

## 与现有改造的协同关系

```
组件架构改造（原生元素 → Primitives）
        ↓ 自动获得
    键盘导航 + ARIA + Focus Trap

Design Token 改造（Typography 用 rem）
        ↓ 自动获得
    系统字体缩放支持

Motion Token 改造（duration 引用变量）
        ↓ 加一条媒体查询
    Reduced Motion 全站生效

AppShell 拆分（LayoutShell）
        ↓ 同步加入
    语义化 HTML landmarks
```

> 💡

关键洞察： 80% 的 a11y 修复可以搭便车在现有改造计划中完成，不需要额外工期。只有颜色对比度审计和屏幕阅读器实测是纯增量工作（合计 ~1.5 天）。

---

## ESLint 自动化守护

在 AI 工作流页已计划的 ESLint 规则基础上，追加 a11y 规则：

```
// .eslintrc
{
  "extends": ["plugin:jsx-a11y/recommended"],
  "rules": {
    "jsx-a11y/no-autofocus": "warn",
    "jsx-a11y/click-events-have-key-events": "error",
    "jsx-a11y/no-static-element-interactions": "error",
    "jsx-a11y/anchor-is-valid": "error"
  }
}
```

eslint-plugin-jsx-a11y 可以在 CI 中自动拦截：

- <div onClick> 缺少 onKeyDown + role + tabIndex

- <img> 缺少 alt

- 表单元素缺少 <label>

- 颜色作为唯一信息传达手段

---

## 目标清单

- [ ] 所有可交互元素统一 focus-visible 指示器（搭便车 Primitives 改造）

- [ ] 散写原生元素全部替换为 Radix Primitives（搭便车组件架构改造）

- [ ] Typography Token 使用 rem 单位支持系统字体缩放

- [ ] prefers-reduced-motion 媒体查询覆盖全站

- [ ] 颜色对比度通过 WCAG AA 标准（亮色 + 暗色）

- [ ] LayoutShell 加入语义化 HTML landmarks

- [ ] macOS VoiceOver 核心场景实测通过

- [ ] eslint-plugin-jsx-a11y 加入 CI pipeline

### 🔧 技术侧

> 📍

Electron 性能优化是 CN 长期竞争力的基础。 写作 IDE 的核心体验指标是"输入延迟"和"启动速度"。

## 性能目标

| 指标 | 目标值 | 参考 |
| --- | --- | --- |
| 冷启动到可交互 | < 2s | Cursor ~1.5s |
| 输入延迟（keystroke latency） | < 16ms（1 帧） | Notion ~10ms |
| 面板切换响应 | < 100ms | Linear ~50ms |
| 大文档（>10万字）滚动 | 60fps 无掉帧 | — |
| 内存占用（空项目） | < 200MB | VS Code ~180MB |

---

## 启动性能

### 优化方向

1. Renderer 预加载

- 利用 Electron 的 BrowserWindow 预创建机制，在主窗口显示前完成 React 树的首次渲染

- Vite 的 Code Splitting 确保首屏只加载必要模块

2. 懒加载非核心模块

- KnowledgeGraph、VersionHistoryPanel、ExportDialog 等重量级组件使用 React.lazy() + Suspense

- 只在用户实际打开对应面板时才加载

3. Store 初始化优化

- 12 个 Store 不需要在启动时全部初始化

- kgStore、versionStore、searchStore 等可延迟到首次使用时初始化

---

## 渲染性能

### 1. 减少不必要的重渲染

AppShell 拆分（已在渲染架构页详述）是最大的单次优化。 当前任何 Store 变更都会触发 AppShell 级联重渲染。

Zustand selector 精细化：

```
// ❌ 当前：订阅整个 store，任何字段变化都重渲染
const store = useLayoutStore()

// ✅ 改为：只订阅需要的字段
const sidebarWidth = useLayoutStore(s => s.sidebarWidth)
```

### 2. 虚拟化长列表

- 文件树（FileTreePanel）— 项目文件过多时需要虚拟滚动

- 搜索结果（SearchPanel）— 大量匹配结果

- 版本历史列表 — 可能非常长

推荐使用 @tanstack/react-virtual 或 react-window。

### 3. 编辑器性能

TipTap / ProseMirror 的性能关键点：

- 大文档渲染 — 考虑 ProseMirror 的分片渲染（只渲染可见区域）

- 装饰器（Decorations）性能 — AI 补全提示、语法高亮等装饰器数量不要失控

- Transaction 合并 — 批量更新时合并 ProseMirror transactions

---

## 内存管理

### Electron 特有的内存问题

1. 渲染进程泄漏 — React 组件卸载时未清理的事件监听、定时器、IPC 监听

1. 主进程泄漏 — 文件 watcher、数据库连接未释放

1. 大文件缓存 — 知识图谱数据、版本历史快照可能占用大量内存

### 优化策略

- 组件卸载时严格清理副作用（useEffect cleanup）

- IPC 监听使用 removeListener / removeAllListeners

- 大数据采用 LRU 缓存策略，控制内存上限

- 使用 Chrome DevTools Memory 面板定期检查 heap snapshot

---

## 监控与度量

### Baseline 数据采集方案

> ⚠️

没有 Baseline 就没有优化。 当前 CN 没有任何性能数据，所有目标值都是“拍脑袋”。第一步是采集真实数据，然后才能定义有意义的目标。

Phase 0：内置轻量级性能探针（立即可做，不依赖任何改造）

```
// === perf-probe.ts —— 全局性能探针，约 50 行代码 ===

// 1. 启动时间
performance.mark('app-start')
// main.tsx 中 React root 挂载完成后：
performance.mark('app-interactive')
performance.measure('startup', 'app-start', 'app-interactive')

// 2. 输入延迟（TipTap onTransaction 回调）
let lastKeystroke = 0
editor.on('beforeTransaction', () => { lastKeystroke = performance.now() })
editor.on('transaction', () => {
  const latency = performance.now() - lastKeystroke
  perfLog.push({ type: 'keystroke', latency, ts: Date.now() })
})

// 3. 面板切换响应（包裹 Zustand action）
function measureAction(name: string, fn: () => void) {
  const t0 = performance.now()
  fn()
  requestAnimationFrame(() => {
    const duration = performance.now() - t0
    perfLog.push({ type: 'action', name, duration, ts: Date.now() })
  })
}

// 4. 内存快照（每 60s 采集一次）
setInterval(() => {
  const mem = performance.memory // Chromium 特有
  perfLog.push({
    type: 'memory',
    usedHeap: mem?.usedJSHeapSize,
    totalHeap: mem?.totalJSHeapSize,
    ts: Date.now()
  })
}, 60_000)

// 5. 导出（开发模式下 console.table，发布前可写入本地文件）
window.__CN_PERF_DUMP__ = () => console.table(perfLog)
```

采集的 Baseline 指标：

| 指标 | 采集方式 | 采集场景 | 预期用途 |
| --- | --- | --- | --- |
| Cold Start Time | performance.measure | 关闭应用后重新打开 | 确定启动优化的真实基线 |
| Warm Start Time | performance.measure | Tab 切换回来 | 区分冷/热启动的优化策略 |
| Keystroke Latency (p50/p95/p99) | TipTap transaction 回调 | 空文档 / 1万字 / 10万字 | 输入延迟是否随文档大小增长 |
| Panel Switch Duration | Zustand action wrapper | 侧边栏切换、AI 面板开关 | 定位最慢的面板切换 |
| JS Heap Used | performance.memory | 启动后 / 30min 使用后 / 2h 使用后 | 检测内存泄漏趋势 |
| FPS (scroll) | requestAnimationFrame 帧率计算 | 大文档快速滚动 | 滚动性能是否达标 |

采集节奏：

1. 立即：加入 perf-probe.ts，采集 3 天日常使用数据

1. 第 1 周：汇总数据，确定各指标的 p50/p95/p99 作为 Baseline

1. 后续：每次改造前后对比，量化收益

---

## Bundle 分析

> 📦

Bundle 大小直接影响启动速度。 Electron 虽然不走网络，但 V8 仍然需要解析和编译 JS——bundle 越大，启动越慢。

### 分析工具链

```
# 1. Vite 内置可视化（推荐首选）
npx vite build --mode production
npx vite-bundle-visualizer

# 2. rollup-plugin-visualizer（更详细的 treemap）
# vite.config.ts 中添加：
import { visualizer } from 'rollup-plugin-visualizer'
plugins: [visualizer({ open: true, gzipSize: true })]

# 3. source-map-explorer（精确到模块级）
npx source-map-explorer dist/assets/*.js
```

### 需要关注的大依赖

| 依赖 | 预估大小 | 是否可 Tree-shake | 优化策略 |
| --- | --- | --- | --- |
| ProseMirror + TipTap | ~200-300KB (gzip) | 部分可 | 检查未使用的 TipTap extensions，删减 |
| Radix UI | ~50-80KB (gzip) | ✅ 模块化良好 | 确认只 import 实际使用的组件 |
| Zustand | ~2KB (gzip) | ✅ | 无需优化 |
| Tailwind CSS | 取决于用量 | ✅ PurgeCSS | 确保生产构建开启 purge |
| KnowledgeGraph 相关 | 可能很大（D3/Canvas） | 部分 | 必须懒加载，不进主 bundle |
| 其他工具库（lodash/date-fns 等） | 不确定 | 视导入方式 | 检查是否有整包导入（import _ from 'lodash'） |

### Code Splitting 策略

```
// vite.config.ts —— 建议的 chunk 分割策略
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        // 核心框架（始终加载）
        'vendor-react': ['react', 'react-dom'],
        'vendor-editor': ['@tiptap/core', '@tiptap/react', 'prosemirror-*'],
        'vendor-ui': ['@radix-ui/*'],

        // 懒加载 chunk（用户触发时才加载）
        // KnowledgeGraph、ExportDialog、VersionHistory 等
        // 通过 React.lazy() 自动分割
      }
    }
  }
}
```

### Bundle 健康检查清单

- [ ] 运行 vite-bundle-visualizer，获取当前总 bundle 大小

- [ ] 识别 Top 5 最大依赖，评估是否有替代方案或懒加载可能

- [ ] 检查是否存在整包导入（import X from 'lib' 而非 import { x } from 'lib'）

- [ ] 确认 KnowledgeGraph / VersionHistory / ExportDialog 已被懒加载

- [ ] 确认生产构建是否移除了 dev-only 代码（Storybook、测试工具等）

- [ ] 检查 CSS 产出大小，Tailwind purge 是否生效

---

## 持续监控

### 发版前检查流程

| 检查项 | 工具 | 通过标准 |
| --- | --- | --- |
| Bundle 大小变化 | vite-bundle-visualizer diff | 总体增量 ≤ 5%，或有明确理由 |
| Cold Start Time | perf-probe.ts | 不超过 Baseline p95 的 110% |
| Keystroke Latency | perf-probe.ts + 10万字测试文档 | p99 < 16ms |
| 内存泄漏 | Chrome DevTools heap snapshot | 2h 使用后 heap 增量 < 20% |
| Lighthouse 审计 | Electron 内置 DevTools | Performance score ≥ 90 |

### 回归测试场景

1. 空项目启动 — 冷启动时间

1. 大文档打开 — 10万字 Markdown 文件的打开时间 + 首屏渲染

1. 大文档编辑 — 10万字文档中连续输入 30s 的平均延迟

1. 多面板 — 同时打开编辑器 + AI 面板 + 文件树 + 搜索的内存占用

1. 长时间使用 — 2h 使用后的内存趋势曲线

> 📍

没有测试保障的重构是在走钢丝。 118 个组件文件即将经历 Token 清扫、Primitives 替换、AppShell 拆分等大规模改造，每一步都可能引入视觉回归和功能断裂。

## 为什么现在必须建立测试体系

当前 CN 即将进入密集重构期，改造计划包括：

- Token 清扫 — ~24 个文件的颜色/阴影/间距批量替换

- 原生元素替换 — 散写的 <button> / <input> 全部迁移到 Primitives

- AppShell 拆分 — 前端最核心的编排组件一分为三

- IPC 收敛 — 13 个文件的主进程通信逻辑迁移到 Service 层

每一项都是全局性改动，影响面广。没有自动化测试，只能靠肉眼走查——而肉眼会遗漏。

---

## 测试金字塔（适配 CN 场景）

```
/  E2E  \           ← 少量关键路径（Playwright）
   /  Visual  \          ← 组件截图对比（Chromatic / Percy / Storybook）
  / Integration \        ← Store + Service 联动（Vitest）
 /   Component   \      ← Primitives + Features（Testing Library）
/      Unit        \    ← 纯函数 / 工具函数（Vitest）
```

CN 的特殊性： 作为写作 IDE，视觉一致性和交互响应性是核心体验指标。因此视觉回归测试的优先级异常高——甚至高于传统的单元测试。

---

## 分层策略

### Layer 1：组件测试（Component Tests）

工具： Vitest + @testing-library/react

覆盖范围： 25 个 Primitives + 核心 Composites

测试什么：

- Primitives 的 props 契约 — 传入 variant/size/disabled 后渲染是否正确

- 键盘导航 — Tab/Enter/Escape/Arrow 键行为（同时验证 a11y）

- 状态转换 — hover → focus → active → disabled 的类名切换

- 事件回调 — onClick/onChange/onSubmit 是否正确触发

不测什么：

- 不测视觉像素（交给视觉回归测试）

- 不测 Store 交互（交给集成测试）

示例：

```
// Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders with correct variant class', () => {
    render(<Button variant="primary">Click</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-[var(--color-accent)]')
  })

  it('is keyboard accessible', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await userEvent.tab()
    expect(screen.getByRole('button')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('prevents interaction when disabled', async () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
```

优先级： 先覆盖 Button、Input、Dialog、Select、Tooltip 这 5 个使用频率最高的 Primitives。

---

### Layer 2：视觉回归测试（Visual Regression）

工具选择：

| 工具 | 原理 | 优势 | 劣势 | 推荐 |
| --- | --- | --- | --- | --- |
| Chromatic | Storybook 截图云端对比 | 与 Storybook 深度集成；CI 友好；团队审批流 | 付费（免费额度 5000 截图/月） | 首选 — CN 已有 .stories.tsx |
| Percy | 页面截图云端对比 | 跨浏览器支持 | 付费；不依赖 Storybook | 备选 |
| Playwright screenshots | E2E 截图本地对比 | 免费；完全自主控制 | 需自建基准图管理；维护成本高 | 轻量替代 |
| Storybook test-runner | Storybook + Playwright 截图 | 免费；本地运行 | 需要手动管理基准图 | MVP 方案 |

推荐路径： 从 Storybook test-runner（免费）起步 → 当截图管理成为负担时迁移到 Chromatic。

覆盖策略：

每个 Primitive 至少 3 张截图：

1. 默认态 — 正常渲染

1. 交互态 — hover / focus / active

1. 暗色模式 — 主题切换后

每个核心 Feature 至少 2 张截图：

1. 正常状态

1. 空状态 / 错误状态

Token 清扫时的工作流：

```
1. 运行 Storybook 截图 → 生成当前 baseline
2. 执行 Token 批量替换
3. 再次运行截图 → 自动对比差异
4. 审查所有 diff：
   - 预期内的变化（如颜色从硬编码变为 Token）→ 批准，更新 baseline
   - 预期外的变化（如布局偏移、元素消失）→ 修复
```

> 💡

关键洞察： CN 已经有 .stories.tsx 文件（如 AiPanel.stories.tsx、CharacterPanel.stories.tsx、DashboardPage.stories.tsx），视觉回归测试可以直接基于现有 Stories 建立，无需额外写测试用例。

---

### Layer 3：集成测试（Integration Tests）

工具： Vitest + @testing-library/react + Zustand mock

覆盖范围： Store ↔ Component 联动、Service 层

核心场景：

| 测试场景 | 涉及模块 | 验证点 |
| --- | --- | --- |
| 主题切换 | themeStore → 全局 Token | 切换后所有语义色正确映射 |
| 面板展开/折叠 | layoutStore → LayoutShell | 面板尺寸变化；编辑区不被意外压缩 |
| 文件保存 | editorStore → fileService → IPC | Service 层正确封装 IPC 调用；错误处理 |
| AI 补全流 | aiStore → TipTap → editorStore | 流式输出正确插入编辑器；取消/中断处理 |
| 搜索 | searchStore → SearchPanel | 输入 → 结果渲染 → 结果点击导航 |

IPC Mock 策略：

```
// 测试环境中 mock Electron IPC
vi.mock('@electron/ipc', () => ({
  invoke: vi.fn((channel, ...args) => {
    switch (channel) {
      case 'file:save':
        return Promise.resolve({ success: true })
      case 'file:read':
        return Promise.resolve({ content: 'mock content' })
      default:
        return Promise.reject(new Error(`Unknown channel: ${channel}`))
    }
  })
}))
```

---

### Layer 4：E2E 测试（End-to-End）

工具： Playwright + electron-playwright

为什么 Playwright：

- 原生支持 Electron 应用测试（electron-playwright 包）

- 可以在真实 Electron 环境中运行，而不是浏览器模拟

- 支持截图、录屏、Network 拦截

覆盖范围： 仅覆盖关键用户路径（不追求全覆盖）

核心用户路径（5 条）：

1. 启动 → 打开项目 → 编辑器可用

  - 验证冷启动性能在目标范围内

  - 验证编辑器可输入、光标正常

1. 写作 → AI 补全 → 接受/拒绝

  - 验证 AI 补全出现、键盘操作、内容正确插入

1. 侧边栏导航 → 面板切换 → 布局稳定

  - 验证面板切换不导致布局跳动

  - 验证编辑区宽度保持稳定

1. 搜索 → 结果 → 跳转

  - Cmd+K 打开搜索 → 输入 → 结果出现 → 点击跳转

1. 导出 → 完成

  - 验证导出流程端到端可用

---

## 测试基础设施

### Storybook 作为测试中枢

CN 已有 Storybook 和 .stories.tsx 文件，应该充分利用：

```
Storybook
  ├── 开发时 → 隔离环境调试组件
  ├── 视觉回归 → 自动截图对比
  ├── a11y 审计 → @storybook/addon-a11y 自动检查
  └── 交互测试 → play functions 验证行为
```

推荐安装的 Storybook addon：

- @storybook/addon-a11y — 每个 Story 自动跑 axe-core a11y 审计

- @storybook/test-runner — 将 Stories 转为自动化测试

- @storybook/addon-interactions — Story 内的交互测试（play functions）

### Vitest 配置

```
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/components/primitives/**', 'src/services/**'],
      thresholds: {
        // 先从低门槛开始，逐步提高
        statements: 50,
        branches: 40,
        functions: 50,
        lines: 50
      }
    }
  }
})
```

---

## 与改造计划的协同

### 改造前：建立 Baseline

```
1. 为所有现有 .stories.tsx 生成截图 baseline
2. 为 5 个核心 Primitives 写组件测试
3. 确保 CI 可以运行测试
```

### 改造中：测试守护

| 改造阶段 | 测试守护方式 |
| --- | --- |
| Phase 1 Token 清扫 | 视觉回归截图对比（最重要）— 每次批量替换后跑截图，确认只有预期变化 |
| Phase 1 原生元素替换 | 组件测试 — 替换后 props 契约和键盘行为不变 |
| Phase 2 AppShell 拆分 | 集成测试 — 面板编排、Store 联动、布局稳定性 |
| Phase 2 IPC 收敛 | Service 层单元测试 — mock IPC，验证封装正确 |
| Phase 3 微交互改造 | 视觉回归 — 动画变化的截图对比（静态帧） |
| Phase 4 视觉审计 | E2E + 视觉回归 — 最终全链路验收 |

### 改造后：持续守护

```
Git pre-commit hook
  └── ESLint（代码规范 + a11y）

CI pipeline（每次 push）
  ├── Vitest 单元/组件/集成测试
  ├── Storybook 视觉回归截图
  ├── @storybook/addon-a11y 可访问性审计
  └── Bundle size check（防止体积回归）

CI pipeline（每次 merge to main）
  └── Playwright E2E 关键路径
```

---

## 实施优先级

| 优先级 | 任务 | 预估 | 前置条件 |
| --- | --- | --- | --- |
| P0 — 改造前必须完成 | Storybook 视觉回归 baseline | 0.5 天 | 已有 .stories.tsx |
| P0 | 5 个核心 Primitives 的组件测试 | 1 天 | Vitest + Testing Library 配置 |
| P1 | Service 层单元测试（IPC mock） | 0.5 天 | IPC 收敛完成后 |
| P1 | @storybook/addon-a11y 集成 | 0.5 天 | Storybook 已有 |
| P2 | 核心集成测试（5 个场景） | 1-2 天 | AppShell 拆分完成后 |
| P2 | CI pipeline 搭建 | 0.5 天 | — |
| P3 | Playwright E2E（5 条关键路径） | 1-2 天 | 改造基本完成后 |

> ⚡

最小可行测试集： 在改造开始前，至少完成 P0 的两项（视觉 baseline + 5 个 Primitives 测试），总计 ~1.5 天。这是让重构从"走钢丝"变成"有安全网"的最低投入。

---

## 目标清单

- [ ] Vitest + Testing Library 配置完成

- [ ] 5 个核心 Primitives（Button / Input / Dialog / Select / Tooltip）组件测试通过

- [ ] Storybook 视觉回归 baseline 建立

- [ ] @storybook/addon-a11y 集成到现有 Stories

- [ ] Service 层（IPC 封装）单元测试通过

- [ ] 5 个核心集成测试场景通过

- [ ] CI pipeline 搭建完成（lint + test + visual regression）

- [ ] 5 条关键用户路径 E2E 测试通过

- [ ] 覆盖率门槛逐步提升到 70%+

> 🔴

AppShell 是当前前端最大的单点债务。 它承担了过多跨域编排与状态拼接，必须拆分。

## 技术栈现状

| 维度 | 方案 | 版本 |
| --- | --- | --- |
| 框架 | React（CSR） | 18.3.1 |
| 构建 | electron-vite + @vitejs/plugin-react | Vite 7.3.1 |
| 运行时 | Electron Renderer | 40.1.0 |
| 编辑器核心 | TipTap（底层 ProseMirror） | @tiptap/react 2.26.0 |
| 状态管理 | Zustand | 5.0.10 |

评估： 全部是 2025-2026 年桌面应用的主流最优解，不需要替换。

---

## 状态管理架构

### 多 Store 分域设计

src/stores 下至少 12 个核心 Store，按领域分离：

UI 域：

- themeStore — 主题切换（暗色/亮色）

- layoutStore — 面板可见性、尺寸

- onboardingStore — 引导流程

业务域：

- editorStore — bootstrapStatus、documentId、EntityCompletionSession 等

- fileStore — 文件系统

- projectStore — 项目元数据

- aiStore — AI 面板状态

- kgStore — 知识图谱

- searchStore — 搜索

- memoryStore — 记忆系统

- versionStore — 版本历史

### Store 依赖图

> 🚨

没有依赖图，就无法识别级联重渲染的源头。 以下是从代码 import 关系推导的 Store 间依赖关系。

```
graph TD
    subgraph "UI 域"
        themeStore["themeStore"]
        layoutStore["layoutStore"]
        onboardingStore["onboardingStore"]
    end

    subgraph "业务域"
        editorStore["editorStore"]
        fileStore["fileStore"]
        projectStore["projectStore"]
        aiStore["aiStore"]
        kgStore["kgStore"]
        searchStore["searchStore"]
        memoryStore["memoryStore"]
        versionStore["versionStore"]
    end

    editorStore -->|"documentId"| fileStore
    editorStore -->|"AI suggestions"| aiStore
    fileStore -->|"project context"| projectStore
    kgStore -->|"entity data"| editorStore
    searchStore -->|"file results"| fileStore
    versionStore -->|"document snapshots"| editorStore
    memoryStore -->|"context"| aiStore
    aiStore -->|"panel visibility"| layoutStore

    style themeStore fill:#4a9eff,color:#fff
    style layoutStore fill:#4a9eff,color:#fff
    style editorStore fill:#ff6b6b,color:#fff
    style fileStore fill:#ff6b6b,color:#fff
```

依赖关系分析：

| Store | 被依赖次数 | 依赖其他 Store | 风险等级 |
| --- | --- | --- | --- |
| editorStore | 3（kg、version、search 都指向它） | fileStore、aiStore | 🔴 最高——变更波及面最广 |
| fileStore | 2（editor、search） | projectStore | 🟡 中等 |
| aiStore | 2（editor、memory） | layoutStore | 🟡 中等 |
| layoutStore | 1（ai） | 无 | 🟢 低——叶子节点 |
| themeStore | 0 | 无 | 🟢 低——完全独立 |

关键洞察：

- editorStore 是“辐射中心”，它的任何变更都可能触发 3+ 个下游 Store 的级联更新

- UI 域和业务域之间只有 aiStore → layoutStore 一个跨域依赖，这很健康

- AppShell 拆分的核心目标：让 LayoutShell 只订阅 UI 域 Store，业务域的变更不再触发布局重渲染

### 编辑器状态分离 ✅

TipTap 内部维护自身的富文本 AST 状态，Zustand 的 editorStore 只负责业务协同状态，两者通过 React Hooks 同步协作。这是正确的分离方式。

---

## 核心问题：AppShell 过重

### 现状

AppShell.tsx:150 是整个前端的编排中枢，当前职责过多：

1. 同时读多个 Store（AppShell.tsx:152-191）— theme / layout / editor / project / file 等

1. 跨层级 Props 传递（AppShell.tsx:819-900）— Sidebar 和 CommandPalette 的参数过多

1. 直接处理 IPC 调用 — 部分主进程通信逻辑混在 Shell 内

### 后果

- 任何一个 Store 变更都可能触发 AppShell 重渲染，连带所有子组件

- 难以测试和维护

- 未来新增面板（多窗口、拖拽停靠）时改动面极大

---

## AppShell 拆分方案

将 AppShell 拆分为三个独立的关注点：

### 目标架构

```
AppShell（当前：上帝组件）
    ↓ 拆分为
├── LayoutShell          → 纯布局骨架
├── NavigationController → 导航/路由/面板切换
└── PanelOrchestrator    → 面板编排与空间分配
```

### LayoutShell

- 职责： 只负责 CSS Grid / Flexbox 布局骨架

- 不读任何业务 Store

- 子区域通过 children 或 slot 接收内容

- 定义标准 IDE 布局：Topbar + LeftActivityBar + MainEditor + RightPanel + BottomStatusBar

```
┌──────────────── Topbar ─────────────────┐
│ Icon │          Main Editor          │ R │
│ Bar  │                               │ i │
│      │                               │ g │
│ (L)  │                               │ h │
│      │                               │ t │
│      │                               │   │
├──────┴───────────────────────────────┴───┤
│              Status Bar                  │
└──────────────────────────────────────────┘
```

### NavigationController

- 职责： 管理面板路由和切换逻辑

- 只读 layoutStore，决定哪些面板当前可见

- 处理键盘快捷键（Cmd+B 切换侧边栏等）

### PanelOrchestrator

- 职责： 面板空间分配与尺寸管理

- 管理面板的可见性、宽度、是否可折叠

- 未来扩展：面板拖拽停靠、多窗口

---

## IPC 调用收敛

### 现状

当前 13 个文件直接调用 IPC invoke，渲染进程与主进程的边界在模糊化。

### 改造

建立统一的 Service 层，所有 IPC 通信收敛于此：

```
Feature 组件
    ↓ 调用
Service 层（统一封装 IPC）
    ↓ invoke
Main Process
```

规则：

- Feature 组件禁止直接 import { ipcRenderer } 或 window.electron.invoke()

- 所有 IPC 调用封装为语义化的 Service 方法（如 fileService.save()、projectService.export()）

- Service 层统一处理错误、重试、超时

---

## Error Boundary 策略

> 🛡️

当前 CN 没有任何 Error Boundary。 任何子组件的未捕获异常都会导致整个 App 白屏——对写作 IDE 来说这是灵难性的，因为用户可能正在编辑未保存的内容。

### 分层 Boundary 架构

```
graph TD
    A["AppErrorBoundary"] --> B["EditorBoundary"]
    A --> C["SidebarBoundary"]
    A --> D["PanelBoundary"]

    B --> E["TipTap Editor"]
    C --> F["FileTree"]
    C --> G["CharacterList"]
    D --> H["AiPanel"]
    D --> I["SearchPanel"]
    D --> J["KnowledgeGraph"]
```

| Boundary | 覆盖范围 | Fallback 行为 | 恢复策略 |
| --- | --- | --- | --- |
| AppErrorBoundary | 整个应用 | 显示“应用崩溃”页面 + “重新加载”按钮 | 自动尝试保存当前文档到本地 → 重载窗口 |
| EditorBoundary | 主编辑区 | 显示“编辑器出错” + 最近保存版本链接 | 重新初始化 TipTap 实例，不影响侧边栏 |
| SidebarBoundary | 左侧边栏（文件树 + 角色列表） | 显示“侧边栏加载失败” + 重试按钮 | 重新加载侧边栏，不影响编辑器 |
| PanelBoundary | 右侧面板（AI / 搜索 / KG） | 显示“面板加载失败” + 关闭按钮 | 关闭崩溃面板，其他面板不受影响 |

实现要点：

```
// ErrorBoundary 统一封装
class CNErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // 1. 报告错误（本地日志 + 可选远程）
    logError({ error, componentStack: info.componentStack })

    // 2. 如果是 EditorBoundary，尝试自动保存
    if (this.props.autoSave) {
      emergencySave()
    }
  }

  render() {
    if (this.state.hasError) {
      return <this.props.fallback
        error={this.state.error}
        onRetry={() => this.setState({ hasError: false })}
      />
    }
    return this.props.children
  }
}
```

与 AppShell 拆分的协同： Error Boundary 的分层与 AppShell 拆分的 LayoutShell / NavigationController / PanelOrchestrator 自然对齐——每个 Shell 组件内部包裹一层 Boundary。

---

## 状态持久化

> 💾

写作 IDE 的状态持久化不是可选项，是必须项。 用户关闭应用后重新打开，应该看到完全一样的工作环境——打开的文件、面板位置、侧边栏宽度、主题选择。

### 哪些状态需要持久化

| Store | 持久化? | 存储位置 | 理由 |
| --- | --- | --- | --- |
| themeStore | ✅ 全部 | localStorage | 用户的主题偏好必须跨会话保留 |
| layoutStore | ✅ 全部 | localStorage | 面板可见性、宽度、折叠状态应恢复 |
| editorStore | ⚠️ 部分 | electron-store / SQLite | 只持久化 lastOpenDocumentId、recentFiles，不持久化临时 UI 状态 |
| projectStore | ⚠️ 部分 | electron-store | 只持久化 lastOpenProject、recentProjects |
| onboardingStore | ✅ 全部 | localStorage | 引导状态不应每次重置 |
| aiStore | ❌ 不持久化 | — | AI 对话是临时的，重开应用时重新开始 |
| searchStore | ❌ 不持久化 | — | 搜索是临时操作 |
| kgStore / memoryStore / versionStore | ❌ 不持久化 | — | 数据源为文件系统 / DB，无需重复存储 |

### Zustand Persist 实现

```
import { persist, createJSONStorage } from 'zustand/middleware'

// UI Store 示例：全量持久化到 localStorage
export const useLayoutStore = create(
  persist(
    (set) => ({
      sidebarVisible: true,
      sidebarWidth: 260,
      rightPanelVisible: false,
      // ...
    }),
    {
      name: 'cn-layout',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// 业务 Store 示例：部分持久化（用 partialize 过滤）
export const useEditorStore = create(
  persist(
    (set) => ({
      lastOpenDocumentId: null,
      recentFiles: [],
      // 不持久化的临时状态：
      bootstrapStatus: 'idle',
      selectionRange: null,
    }),
    {
      name: 'cn-editor',
      storage: createJSONStorage(() => electronStore),
      partialize: (state) => ({
        lastOpenDocumentId: state.lastOpenDocumentId,
        recentFiles: state.recentFiles,
      }),
    }
  )
)
```

### 存储层选择

- localStorage：适用于 UI 偏好（主题、布局、引导）——简单、同步、无需 IPC

- electron-store：适用于业务数据（最近打开的文件/项目）——文件系统存储，不受浏览器存储限制

- SQLite：仅用于结构化业务数据（如 KG 节点缓存）——CN 已有 SQLite 基础设施

### 版本迁移

持久化 schema 会随版本演进。Zustand persist 内置 version + migrate 支持：

```
persist(
  // ...
  {
    name: 'cn-layout',
    version: 2,
    migrate: (persisted, version) => {
      if (version < 2) {
        // v1 → v2：新增 rightPanelWidth 字段
        return { ...persisted, rightPanelWidth: 320 }
      }
      return persisted
    },
  }
)
```

---

## 改造优先级

| 优先级 | 改造项 | 预估 |
| --- | --- | --- |
| P0 | AppShell 拆分为 LayoutShell + NavigationController + PanelOrchestrator | 3-5 天 |
| P1 | IPC 调用收敛到 Service 层 | 1-2 天 |
| P2 | 业务组件清除 h-screen / w-screen，改为由 Shell 注入可用尺寸 | 1 天 |
| P3 | Store 订阅优化（selector 精细化，避免不必要的重渲染） | 持续 |

> ⚡

核心心法：你做设计决策，AI 做实现。 永远不要让 AI "自由发挥设计"。给它约束（Token + 参考 + 你的判断），让它在约束内高效执行。

## 分工模型

| 你做的事 | AI 做的事 |
| --- | --- |
| 定 Design Token Spec | 生成 CSS variables / Tailwind config |
| 截图 + 标注问题 | 批量重构组件以符合 Token |
| 画粗略线框或描述布局 | 生成完整组件代码 |
| 定义动画编排表 | 实现所有 transition / animation |
| 指出"这里感觉不对" | 提供 3 个改进方案供你选择 |
| 找到一个参考（如 Notion） | 逆向分析并为 CN 适配 |

---

## 工作流程

### Step 1：约束先行

在让 AI 写任何一行代码之前，先准备好约束文档：

必须给 AI 的上下文：

- tokens.css 完整内容（让 AI 知道可用的变量）

- 目标组件的 Primitive 接口定义（让 AI 知道能用什么组件）

- 标杆产品的截图（让 AI 知道视觉目标）

- 当前代码的问题截图 + 你的标注（让 AI 知道哪里不对）

禁止让 AI 做的事：

- ❌ "帮我设计一个好看的侧边栏" — 太模糊，AI 会随意发挥

- ❌ "用你觉得合适的颜色" — AI 没有审美判断力

- ❌ "自由选择字号和间距" — 会破坏 Token 系统

正确的指令方式：

- ✅ "按照 tokens.css 中的变量，将 SearchPanel 的所有硬编码颜色替换为语义 Token"

- ✅ "参考 Notion 侧边栏的间距，用 --space-2 和 --space-4 重写 Sidebar 的 padding"

- ✅ "将 DiffHeader 的 shadow-[0_18px_48px_rgba(0,0,0,0.45)] 替换为 var(--shadow-xl)"

---

### Step 2：批量操作

AI 最大的优势是批量一致性操作。以下任务适合让 AI 一次性完成：

Token 清扫（Phase 1 核心任务）：

```
输入：
- tokens.css（可用变量清单）
- 24 个违规文件列表
- 违规模式 → 替换规则映射表

指令：
"逐个打开以下文件，将所有硬编码颜色替换为 tokens.css 中对应的语义变量。
替换规则：
- text-blue-400 → text-[var(--color-accent)]
- text-red-400 → text-[var(--color-error)]
- z-10/z-20/z-30/z-50 → z-[var(--z-{对应层级})]
- shadow-[...] → shadow-[var(--shadow-{对应级别})]
每个文件替换后，列出改动清单供我确认。"
```

原生元素替换：

```
输入：
- Primitives 组件的 API 文档（Button props、Input props 等）

指令：
"在以下文件中，找到所有直接使用 <button> 和 <input> 的地方，
替换为项目的 <Button> 和 <Input> Primitive 组件。
保留原有的 onClick/onChange 逻辑，样式从行内类名迁移到 Primitive 的 variant/size props。"
```

---

### Step 3：逐组件打磨

批量清扫完成后，逐个组件精细打磨：

对每个核心组件的 AI 指令模板：

```
"我要优化 [组件名] 的视觉和交互质量。

当前代码：[粘贴代码]
当前效果截图：[附图]
目标效果参考：[附 Notion/Cursor 截图]

请按以下要求改造：
1. 所有间距使用 tokens.css 中的 --space-* 变量
2. 所有颜色使用 --color-* 语义变量
3. hover 状态使用 transition-colors duration-[var(--duration-fast)]
4. focus-visible 使用 outline-[var(--color-ring-focus)]
5. 弹出动画使用 scale(0.98→1) + opacity(0→1)，duration 200ms，ease-out

输出改造后的完整代码。"
```

---

### Step 4：视觉走查

改造完成后，用 AI 辅助做视觉走查：

录屏走查法：

1. 录制自己使用 CN 的全流程（5-10 分钟）

1. 回看录屏，在每一次"皱眉"的地方截图

1. 将截图分类（间距问题 / 颜色问题 / 动画问题 / 状态缺失）

1. 每一类交给 AI 批量修复

截图对比法：

1. CN 截图 vs Notion 截图，同一类界面并排放

1. 让 AI 分析差异："对比这两张截图，列出 CN 与 Notion 在间距、字号、颜色、阴影上的具体差异"

1. 根据 AI 的分析结果决定哪些差异需要修复

---

## 效率倍增器

### 1. Storybook 驱动开发

为每个 Primitive 建立 Storybook Story，让 AI 在隔离环境中调试组件，而不是在整个应用中调试。

### 2. ESLint 规则自动化

让 AI 帮你写 ESLint 自定义规则，自动禁止：

- 使用 raw Tailwind colors（text-blue-*）

- 硬编码 z-index 数字

- transition-all

- h-screen / w-screen 在非 Shell 组件中出现

这样未来的代码就不会再"漂移"回去。

### 3. AI Code Review

每次提交前，让 AI 检查：

- 是否引入了新的硬编码值？

- 是否使用了 Primitives 还是散写了原生元素？

- 动画是否引用了 Token？

- 是否有不必要的 Store 订阅？

---

## 多 Agent 协作模型

> 🤖

单 Agent 模式的瓶颈： 上面的工作流假设你只用一个 AI。但 CN 已经是多 Agent 架构（Cursor + Claude + Gemini + 本地 Agent），需要明确分工协议，否则 Agent 之间会互相覆盖、风格不一致、产生“设计漂移”。

### Agent 角色与专业化

| Agent 角色 | 典型工具 | 擅长 | 指派任务 | 禁止任务 |
| --- | --- | --- | --- | --- |
| 🛠️ Builder | Cursor / Windsurf | 大范围代码生成、多文件重构 | Token 清扫、组件替换、AppShell 拆分 | 设计决策、新增 Token 变量 |
| 🧠 Thinker | Claude / GPT | 架构分析、方案设计、文档撰写 | 设计方案对比、代码审计、知识库维护 | 直接修改生产代码 |
| 🔍 Auditor | Gemini（长上下文） | 全库扫描、模式识别、回归检测 | 审计报告、违规检测、一致性检查 | 代码修改（只报告，不动手） |
| 🎨 Stylist | Claude / 专项 Prompt | 视觉微调、动画参数、设计细节 | 单组件视觉打磨、动画曲线调参 | 架构变更、多文件重构 |

### 协作协议

原则：单一真相源 + 明确交接点

```
graph LR
    A["👁️ 你（最终裁判）"] --> B["约束文档"]
    B --> C["🛠️ Builder"]
    B --> D["🎨 Stylist"]
    B --> E["🔍 Auditor"]
    B --> F["🧠 Thinker"]
    C -->|"PR / diff"| A
    D -->|"PR / diff"| A
    E -->|"审计报告"| A
    F -->|"方案文档"| A
```

协作规则：

1. 约束文档是唯一真相源

  - 所有 Agent 必须接收同一份约束文档（tokens.css + 设计规范 + 组件 API）

  - 任何 Agent 不得“发明”新 Token 或新组件——只有你可以扩展约束文档

1. 串行决策，并行执行

  - 架构决策（Thinker）必须在代码生成（Builder）之前完成

  - 同一决策确定后，多个文件的 Builder 任务可并行

  - Auditor 始终在 Builder 完成之后运行

1. 不跨界

  - Builder 不做设计决策（遇到模糊地带停下问你）

  - Thinker 不直接改代码（只输出方案文档）

  - Auditor 只报告不修复（避免“运动员兼裁判”）

### 典型协作流程示例

场景：AppShell 拆分

| 步骤 | Agent | 输入 | 输出 |
| --- | --- | --- | --- |
| 1. 审计现状 | 🔍 Auditor | AppShell.tsx 全文 + 所有 import 文件 | 职责清单、耦合点、风险分析 |
| 2. 设计方案 | 🧠 Thinker | 审计报告 + 你的约束（三组件架构） | LayoutShell / NavController / PanelOrchestrator 接口定义 |
| 3. 你审批 | 👁️ 你 | 方案文档 | ✅ / ❌ / 修改意见 |
| 4. 代码实现 | 🛠️ Builder | 批准的接口定义 + tokens.css + 组件 API | 3 个新文件 + AppShell 的 diff |
| 5. 视觉微调 | 🎨 Stylist | 拆分后的截图 + 动画编排表 | 过渡动画、间距微调 |
| 6. 回归检查 | 🔍 Auditor | 改造前后的完整代码 | ✅ 一致性确认 / ❌ 新问题清单 |

### Agent 冲突解决

当多个 Agent 给出矛盾建议时：

1. 谁说了算？ → 永远是你。Agent 只提供信息，不做决策

1. 如何判断？ → 回到约束文档。符合 Token / 规范 / 性能目标的方案胜出

1. 无法判断？ → 让两个 Agent 分别实现，用 Storybook 并排对比，你看哪个好

### 上下文模板（Agent Briefing）

每次启动一个 Agent 任务时，用以下模板提供上下文：

```
## Agent Briefing

**你的角色：** [Builder / Thinker / Auditor / Stylist]
**任务：** [一句话描述]

### 约束文档
- tokens.css：[附件/链接]
- 组件 API：[附件/链接]
- 动画编排表：[附件/链接]

### 输入
- 目标文件：[...]
- 参考截图：[...]
- 前置决策：[已确定的架构/设计选择]

### 输出要求
- 格式：[代码 diff / 方案文档 / 审计报告]
- 约束：[禁止新增 Token / 禁止改架构 / ...]

### 不确定时
如果遇到不确定的设计决策，停下并列出选项让我选择。
禁止自行决定任何设计方向。
```

---

## 关键原则

> 世界级的前端不是"做了很多好东西"，而是"没有任何一个地方让你出戏"。

1. 约束产生质量 — Token 系统的价值不是"好看"，而是"不可能不一致"

1. 批量优于逐个 — 用 AI 做系统级清扫，而不是逐个像素调

1. 自动化守护成果 — ESLint 规则 + CI 检查，防止改好的东西再次退化

1. 你的眼睛是最终裁判 — AI 写代码，你判断"对不对"

### 📦 工程侧

> 🎯

核心命题：让人类看到最好的界面，而底层对 AI 完全透明。 结构层是从语义层派生的轻量 AST，呈现层是纯粹的视觉渲染——两者都不写回存储核心。CN 的前端要做到：AI 流式输出时 UI 丝滑更新，人类编辑时体验不输 Notion。whatis2@

---

## 1. 三层分离原则（全局锚点）

```
┌─────────────────────────────────┐
│   呈现层（Presentation）         │  ← 人类看到的：排版、样式、交互      【本页】
├─────────────────────────────────┤
│   结构层（Structure）            │  ← 轻量标注：段落、标题、引用等      【本页】
├─────────────────────────────────┤
│   语义层（Semantic）             │  ← AI 消费的：连续文本 + 语义标签    【后端侧】
└─────────────────────────────────┘
```

- 语义层（后端侧）：存储核心，AI 直接消费 → 详见 ‣

- 结构层（本页）：从语义层派生的轻量 AST，可缓存可重建

- 呈现层（本页）：渲染引擎 + design token，不写回存储

---

## 2. 结构层：派生的、而非规定的

### 2.1 核心思想

结构层回答的问题是：这段文字的组织形式是什么？

```
语义层的 content + spans
  → 结构解析器（Structure Parser）
    → 输出：轻量 AST（段落、标题、列表、引用...）
```

这个 AST 和 Notion 的 block 树看起来很像，但有本质区别：

| 维度 | Notion 的 Block | CN 的结构 AST |
| --- | --- | --- |
| 地位 | 是存储的主体 | 是从语义层派生的缓存 |
| 持久化 | 每个 block 独立存储在数据库中 | 可缓存，但随时可从语义层重建 |
| AI 写入路径 | text → parse → create blocks → save each | text → append to content → invalidate AST cache |
| 编辑粒度 | 必须定位到具体 block | 直接操作文本偏移量，AST 自动更新 |

### 2.2 增量解析

> 💡

类比：Tree-sitter 对代码做的事，CN 要对散文做。 文本变化时只重新解析受影响的区间，不重建整棵树。

增量解析的核心流程：

```
sequenceDiagram
    participant S as 语义层 (content)
    participant P as Structure Parser
    participant A as AST Cache
    participant R as Renderer

    Note over S: 文本发生变化（人类编辑或 AI 输出）
    S->>P: changeEvent { range, newText }
    P->>P: 仅重新解析受影响区间
    P->>A: patchAST(affectedNodes)
    A->>R: astDiff
    R->>R: 仅重绘变化的视觉节点
```

性能关键：

- 普通编辑（敲一个字）：只影响当前段落节点，解析时间 < 1ms

- AI 流式输出（每 100ms 追加一批 token）：只解析新增区间，不触碰已有 AST 节点

- 大规模粘贴/替换：最差情况退化为全量解析，但仍然比逐 block 创建快

### 2.3 与 ProseMirror/TipTap 的关系

CN 目前使用 TipTap 2.26 / ProseMirror 作为编辑器。ProseMirror 本身就是基于 document → schema → node tree 的模型，而非独立 block 实体。

适配建议：

- ProseMirror 的 doc 节点树本质上就是一棵结构 AST，可以直接复用

- 关键改造点：ProseMirror 的 State.doc 应该从语义层的 content + spans 派生，而不是作为 source of truth

- AI 写入时：先更新语义层 content → 然后通过 tr.replaceWith() 同步 ProseMirror state → ProseMirror 自动增量更新视图

- 人类编辑时：ProseMirror transaction → 反向同步到语义层 content + spans

```
graph LR
    subgraph Backend["后端（语义层）"]
        C["content\n连续文本"]
    end

    subgraph Frontend["前端（结构层）"]
        PM["ProseMirror State\nAST = doc node tree"]
    end

    C -->|"AI 写入 / 加载"| PM
    PM -->|"人类编辑"| C

    PM --> V["ProseMirror View\n渲染到 DOM"]

    style C fill:#e8f5e9,stroke:#4CAF50
    style PM fill:#e3f2fd,stroke:#1976D2
    style V fill:#fff3e0,stroke:#FF9800
```

---

## 3. 呈现层：厚客户端，薄存储

### 3.1 核心原则

```
结构 AST
  → 渲染引擎（ProseMirror View + CN Design Token）
    → 排版、字体、间距、动画、交互
    → 完全是前端的事，不写回存储
```

以下内容不进入语义层存储：

- 字体大小、颜色、间距等纯视觉属性 → 用 ‣ 在渲染时决定

- 折叠状态、光标位置、滚动位置 → 前端 session 状态

- 多种渲染模式（编辑模式、阅读模式、大纲模式、PDF 导出）→ 同一份 content，不同渲染管线

### 3.2 语义属性 vs 视觉属性的边界

> ⚠️

判定规则：如果一个标注影响 AI 对文本的理解，它就属于语义层；如果只影响人类的视觉感受，它就属于呈现层。

| 标注类型 | 归属 | 理由 |
| --- | --- | --- |
| 加粗 | 语义层 span | 表示"强调"，AI 需要知道哪些内容被作者标记为重点 |
| 斜体 | 语义层 span | 可能表示内心独白、术语、书名等语义信息 |
| 分隔线 | 语义层 span | 表示"话题转换"或"场景切换" |
| 用户高亮（标记重点） | 语义层 span | 创作者有意标注的重要段落，AI 应感知 |
| 字体大小 | 呈现层 | 纯视觉排版，不影响语义理解 |
| 行间距 | 呈现层 | 纯视觉排版 |
| 装饰性颜色 | 呈现层 | 纯视觉美化 |
| 折叠/展开状态 | 呈现层（session） | 临时交互状态 |

### 3.3 多渲染模式

同一份语义层 content 可以呈现为多种视觉形态：

| 模式 | 渲染策略 | 用途 |
| --- | --- | --- |
| 编辑模式 | ProseMirror View + 完整交互 | 主写作界面 |
| 阅读模式 | 连续排版流（像书一样），无可编辑元素 | 长文阅读、预览 |
| 大纲模式 | 只渲染 heading 节点，可折叠层级视图 | 结构导航 |
| 导出模式 | 生成 PDF/EPUB/HTML | 发布 |

这是 block 模型很难做到的——因为 block 同时是存储和渲染单元，渲染模式切换意味着底层数据结构也要变。语义层 + 派生渲染的架构天然支持多模式。

---

## 4. AI 流式输出的 UI 更新策略

### 4.1 全链路：从 Token 到像素

```
sequenceDiagram
    participant LLM as LLM
    participant M as Main Process
    participant CB as ChunkBatcher
    participant SL as 语义层 (content)
    participant PM as ProseMirror State
    participant V as ProseMirror View

    loop 流式输出
        LLM->>M: token chunks
        M->>CB: push(tokens)
        CB->>SL: append to content（批量）
        CB->>PM: tr.insertText()（批量）
        PM->>V: 增量 DOM 更新
    end

    Note over V: 用户看到文字逐步出现，丝滑无卡顿
```

### 4.2 对比 Notion 的渲染路径

```
Notion:
  token → create block → insert into block tree → React re-render block component
  → 每个 block 是独立 React 组件 → 大量组件挂载 → 渲染树瞬间重建 → 白屏

CN:
  token → append text → ProseMirror incremental update → 只更新变化的 DOM 节点
  → 无新组件挂载 → 无渲染树重建 → 丝滑
```

关键差异：Notion 的每个 block 是独立 React 组件，AI 生成 100 个 block = 挂载 100 个 React 组件。CN 的 ProseMirror 是对整个文档做 DOM diff，AI 输出再多文本也只是一次 insertText transaction。

### 4.3 前端配合后端防护

与 ‣ 及 ‣ 协同：

| 后端提供 | 前端配合 |
| --- | --- |
| ChunkBatcher 后的批量 IPC push | 按批量更新 ProseMirror state，不需逐 token 触发 transaction |
| 背压信号（ai:stream:backpressure） | 降低更新频率，显示"生成中"占位或骨架动画 |
| 流结束事件（SKILL_STREAM_DONE） | 触发语法高亮、LaTeX 渲染等后处理 |
| 事务回滚通知（{ rolledBack: true }） | 恢复到 AI 生成前的 ProseMirror state 快照 |
| 版本冲突通知（VERSION_CONFLICT） | 提示用户 AI 生成被丢弃，手动编辑已保留 |

---

## 5. 人类编辑体验：不输 Notion

### 5.1 "人类消费"不等于"block 呈现"

CN 的最终读者是人类创作者和读者。但人类消费内容的最佳方式不一定是 Notion 式的 block 编辑器：

- 长文阅读需要的是连续的排版流（像书一样），不是可拖拽的 block

- 大纲/结构需要的是可折叠的层级视图，这从结构 AST 直接派生就够了

- 协作批注标注在语义区间上比标注在 block 上更精确——可以标注半句话，而不是整个段落 block

### 5.2 用户交互的映射

用户的每个编辑操作最终都映射为对语义层 content 的区间操作：

| 用户操作 | ProseMirror 处理 | 语义层影响 |
| --- | --- | --- |
| 打字输入 | tr.insertText() | content insert at offset + 更新受影响的 spans 偏移 |
| 删除文字 | tr.delete() | content delete at range + 收缩/删除受影响的 spans |
| 拖拽段落 | tr.delete()  • tr.insert() | content 区间移动 + spans 偏移重算 |
| 加粗/标记 | tr.addMark() | 新增语义 span（role: emphasis / highlight） |
| 创建标题 | tr.setNodeMarkup() | 新增/修改 span（role: heading, level: N） |

### 5.3 ProseMirror State 快照

用于 AI 回滚场景：AI 开始生成前，保存当前 ProseMirror EditorState 快照。如果后端发来 rollback 通知，直接恢复到快照状态，用户看到的是"AI 生成被撤销"，体验干净利落。

```
// AI 生成前
const snapshot = editorView.state;

// 收到 rollback 通知
editorView.updateState(snapshot);
```

---

## 6. 相关页面

- ‣ — 后端侧的存储核心设计

- ‣ — 后端四道防线，前端需配合的协议

- ‣ — 现有 ProseMirror + Zustand 架构

- ‣ — 呈现层的视觉变量系统

- ‣ — AI 输出时的过渡动画设计

- ‣ — 渲染性能的全局优化策略
