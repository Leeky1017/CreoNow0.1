# CreoNow OpenSpec


本目录存放项目行为规范（Source of Truth）和变更提案。

## 目录结构

```
openspec/
├── project.md              ← 项目概述（Agent 第二入口）
├── specs/                  ← 按模块组织的主规范（12 个模块）
│   ├── context-engine/
│   ├── knowledge-graph/
│   ├── memory-system/
│   ├── skill-system/
│   ├── ai-service/
│   ├── search-and-retrieval/
│   ├── editor/
│   ├── workbench/
│   ├── document-management/
│   ├── project-management/
│   ├── ipc/
│   └── version-control/
└── changes/                ← 进行中的变更（Delta Specs）
    └── EXECUTION_ORDER.md  ← 多活跃 change 时的执行顺序（串行/并行、依赖、更新时间）
```

## 入口

- Agent 宪法：`/AGENTS.md`
- 项目概述：`project.md`
- 交付规则：`/docs/delivery-skill.md`

## 证据体系

交付证据统一为 **PR 评论 + CI 日志**。
