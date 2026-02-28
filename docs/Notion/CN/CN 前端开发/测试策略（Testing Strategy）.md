# 测试策略（Testing Strategy）

> Source: Notion local DB page `bca1cba7-a4d3-4eea-b78c-1ed972d262f6`

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
