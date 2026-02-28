# Git 分支策略

> Source: Notion local DB page `80d271af-30d8-4ac7-affe-033068225d0a`

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
