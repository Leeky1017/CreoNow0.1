# 工具链

更新时间：2026-03-04 16:00

## 包管理与构建

| 用途     | 工具                      | 约束                               |
| -------- | ------------------------- | ---------------------------------- |
| 包管理   | pnpm 8                    | 必须使用 `--frozen-lockfile`       |
| 构建     | Vite（via electron-vite） | —                                  |
| Monorepo | pnpm workspace            | `apps/desktop` + `packages/shared` |

## 测试

| 用途      | 工具                           | 说明                        |
| --------- | ------------------------------ | --------------------------- |
| 单元/集成 | Vitest                         | 兼容 Jest API               |
| 组件测试  | React Testing Library          | 测试行为而非实现            |
| E2E       | Playwright                     | 支持 Electron               |
| Mock      | Vitest 内置（vi.mock / vi.fn） | —                           |
| AI Eval   | Golden Test Set                | 人工标注基线 + LLM-as-Judge |
| 覆盖率    | Vitest coverage                | CI 门禁强制                 |

## 样式与设计

| 用途     | 工具           | 说明                               |
| -------- | -------------- | ---------------------------------- |
| 样式     | Tailwind CSS 4 | `@theme` / `@layer` CSS-first 配置 |
| 组件原语 | Radix UI       | 无样式、可访问                     |
| 组件文档 | Storybook      | 可视化契约，与应用共享 Token       |

## CI/CD

| 用途                 | 工具 / 配置                                | 说明                            |
| -------------------- | ------------------------------------------ | ------------------------------- |
| CI                   | GitHub Actions                             | 三个 required checks            |
| `ci`                 | `.github/workflows/ci.yml`                 | lint + typecheck + test + build |
| `merge-serial`       | `.github/workflows/merge-serial.yml`       | 串行合并队列                    |
| 合并策略             | auto-merge                                 | 禁止手动合并                    |

## 自动化脚本

| 脚本                             | 职责                                       |
| -------------------------------- | ------------------------------------------ |
| `agent_controlplane_sync.sh`     | 同步控制面 `origin/main`                   |
| `agent_worktree_setup.sh`        | 创建 `.worktrees/issue-<N>-<slug>`         |
| `agent_worktree_cleanup.sh`      | 清理 worktree                              |
| `agent_pr_preflight.py`          | PR 提交前校验（Branch、Issue）         |
| `agent_pr_automerge_and_sync.sh` | 创建 PR + 开启 auto-merge              |
| `ipc-acceptance-gate.ts`         | IPC 契约验收门禁                           |
| `contract-generate.ts`           | IPC 契约代码生成                           |

脚本约定：

- 所有脚本使用 `set -euo pipefail`
- 退出码：`0` 成功，`1` 可恢复失败，`2` 不可恢复失败
- 输出前缀：`[OK]`、`[FAIL]`、`[SKIP]`、`[WARN]`
