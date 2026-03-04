# AI 前端开发执行路线图

> **⚠️ 本文档已过时**：项目实际开发未按 Phase 0-6 顺序执行。
> 24 个 L1 Primitives + 10 个 L2 Composites + 完整的 Feature 层均已实现，
> Storybook 有 66 个 story，测试有 1,778 个用例。
> 本文档保留作为历史参考，当前前端状态请参见
> [前端诊断报告](../../docs/audit/amp-cn-frontend-issues-and-i18n-problems-analysis.md)。

> **角色**: AI 执行必读文档（已过时）  
> **目的**: 提供明确的执行顺序和验收标准  
> **来源**: DESIGN_DECISIONS.md 拆分

---

## 执行原则

1. **分层执行**: 每层独立验收后再进入下一层
2. **黄金标准先行**: Button → Input → Card 需精雕细琢，后续组件以此为模板
3. **可视化反馈**: 每个组件生成后必须通过 Storybook 自检
4. **Mock 优先**: Layer 1-4 使用 Mock 数据，不依赖后端

---

## Phase 0: 环境准备

**目标**: 确保开发环境可用

**检查项**:

- [ ] Node.js 安装正确 (`node --version`)
- [ ] 依赖安装成功 (`pnpm install`)
- [ ] Storybook 可启动 (`pnpm storybook`)
- [ ] 浏览器可访问 http://localhost:6006

**完成标志**: Storybook 在浏览器中正常显示

### Phase 0 详细步骤（用户操作指南）

Phase 0 是唯一需要用户执行命令的阶段，之后全由 AI 操作：

```
步骤 1：确认 Node.js 已安装
用户：在终端输入 `node --version`
预期：显示版本号（如 v20.x.x）
如果报错：让 AI 帮你安装

步骤 2：安装项目依赖
用户：在终端输入 `pnpm install`
预期：显示安装进度，最后成功
等待时间：约 1-3 分钟

步骤 3：启动 Storybook
用户：在终端输入 `pnpm storybook`
预期：终端显示 "Storybook started" 之类的信息
浏览器：自动打开 http://localhost:6006

步骤 4：确认 Storybook 运行
用户：在浏览器中看到 Storybook 界面
如果报错：把错误信息复制给 AI

完成后：Phase 0 结束，后续所有操作都是：
- AI 写代码
- 用户在浏览器看效果
- 用户用文字描述问题
- AI 修改
```

---

## Phase 1: 黄金标准组件

**目标**: 建立代码风格和质量基准

**组件列表** (按顺序精雕细琢):

1. **Button** - 展示 variant/size/state 处理模式
2. **Input** - 展示表单组件的验证和状态模式
3. **Card** - 展示容器组件的 slot 模式

**验收标准**:

- [ ] 所有状态覆盖 (default/hover/active/focus-visible/disabled/loading)
- [ ] 所有边界处理 (超长文本/空内容/极窄容器)
- [ ] 代码风格一致
- [ ] Storybook Story 完整
- [ ] 用户验收通过

**注意**: 这 3 个组件需要多轮迭代直到完全满意

---

## Phase 2: 原子组件

**目标**: 构建设计系统基础

**组件列表**:

- Badge, Avatar, Icon, Spinner
- Text, Heading, Skeleton
- Checkbox, Select, Textarea

**验收标准**:

- [ ] AI 自检通过 (浏览器 MCP)
- [ ] 代码风格与黄金标准一致
- [ ] 用户抽查通过

---

## Phase 3: 布局组件

**目标**: 构建三栏布局框架

**组件列表**:

- Icon Bar (48px 固定宽度)
- Status Bar (28px 固定高度)
- Sidebar 容器 (可拖拽, 180-400px)
- Panel 容器 (可拖拽, 280-480px)
- Resizer 拖拽分隔条

**验收标准**:

- [ ] 高度约束正确 (`min-height: 0`)
- [ ] 独立滚动正确 (`overflow-y: auto`)
- [ ] 拖拽调整正常工作
- [ ] 双击恢复默认宽度
- [ ] 偏好持久化

---

## Phase 4: 面板组件

**目标**: 构建功能面板

**组件列表**:

- FileTree (文件树)
- Outline (大纲)
- AI Panel (AI 对话)
- Info Panel (属性面板)
- Command Palette (Cmd+K)
- Dialogs (对话框)

**验收标准**:

- [ ] 功能完整
- [ ] 状态正确 (空/加载/错误)
- [ ] 键盘导航可用

---

## Phase 5: 页面组装

**目标**: 组装完整页面

**页面列表**:

- Login (登录页)
- Onboarding (引导页)
- Dashboard (项目管理)
- Editor/Workbench (核心编辑器)

**验收标准**:

- [ ] 页面布局正确
- [ ] 组件组合正确
- [ ] 完整流程可走通 (Mock 数据)

---

## Phase 6: 整体调优

**目标**: 根据用户反馈优化

**工作内容**:

- 视觉细节修正
- 交互打磨
- 边界情况处理
- 性能优化

---

## 设计稿优先级

| 优先级 | 设计稿                         | 用途             |
| ------ | ------------------------------ | ---------------- |
| **P0** | 05-dashboard-sidebar-full.html | Dashboard 主设计 |
| **P0** | 09-editor-full-ide.html        | 核心编辑器界面   |
| **P0** | 12-sidebar-filetree.html       | 文件树           |
| **P0** | 14-ai-panel.html               | AI 面板          |
| P1     | 01-login.html                  | 登录页           |
| P1     | 02-onboarding.html             | 引导页           |
| P1     | 10-settings.html               | 设置             |
| P1     | 13-sidebar-outline.html        | 大纲             |
| P1     | 15-info-panel.html             | 信息面板         |
| P1     | 17-command-palette.html        | 命令面板         |
| P2     | 其他                           | 增强功能         |

---

## 验收清单

### 像素验收 (MUST 全部通过)

- [ ] 所有间距为 4px 的倍数
- [ ] Icon Bar 宽度为 48px
- [ ] 图标尺寸为 24px，点击区域为 40x40px
- [ ] 分割线使用 --color-separator，1px 宽
- [ ] 卡片圆角为 --radius-xl (16px)
- [ ] 按钮圆角按尺寸使用正确的 radius
- [ ] 输入框高度为 40px

### 交互验收 (MUST 全部通过)

- [ ] 所有可点击元素有 hover 状态
- [ ] 键盘导航时显示 focus-visible ring
- [ ] 鼠标点击不显示 focus ring
- [ ] 面板宽度可拖拽调整
- [ ] 双击拖拽手柄恢复默认宽度
- [ ] 面板宽度变化后持久化
- [ ] 所有快捷键正常工作

### 主题验收 (MUST 全部通过)

- [ ] 深色主题下所有颜色使用 CSS Variable
- [ ] 浅色主题下所有颜色使用 CSS Variable
- [ ] 主题切换无闪烁
- [ ] 跟随系统主题自动切换

---

## 文档索引

| 文档                            | 用途                          |
| ------------------------------- | ----------------------------- |
| `01-tokens.css`                 | Design Tokens 实现            |
| `02-component-cards/*.md`       | 组件生成卡片                  |
| `03-state-inventory.md`         | 全局状态清单 + 36项陷阱检查表 |
| `04-composition-scenarios/`     | 组合场景验收                  |
| `05-design-mapping.md`          | 设计稿到代码映射 + UI模块清单 |
| `06-shortcuts.md`               | 快捷键规范                    |
| `../reference-implementations/` | 黄金标准代码                  |
| `../DESIGN_DECISIONS.md`        | 终极参考 (完整规范)           |
