# CreoNow

更新时间：2026-02-21 11:57

AI 驱动的文字创作 IDE（创作者的 Cursor）

## 项目结构

```
CreoNow/
├── apps/desktop/       # Electron 桌面应用
│   ├── main/           # 后端（主进程）
│   └── renderer/       # 前端（渲染进程）
├── packages/shared/    # 共享代码
├── design/Variant/     # 设计资产
├── openspec/           # 项目规范
└── scripts/            # 自动化脚本
```

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS 4
- **后端**: Electron + TypeScript + SQLite
- **编辑器**: TipTap 2
- **状态管理**: Zustand
- **组件原语**: Radix UI

## 开发

```bash
# 安装依赖
pnpm install --frozen-lockfile

# 类型检查
pnpm typecheck

# Lint
pnpm lint
```

## 规范

- 项目概述：`openspec/project.md`
- 模块行为规范：`openspec/specs/<module>/spec.md`
- 设计规范：`design/DESIGN_DECISIONS.md`
- Agent 规则：`AGENTS.md`
