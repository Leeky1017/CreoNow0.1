# 文件清理执行清单

更新时间：2026-03-04 15:00

> "除却巫山不是云。"——清除噪音，让真正重要的东西显现。

---

## 文件索引

| § | 章节 | 内容 |
|---|------|------|
| 一 | 清理原则 | 删除标准与决策逻辑 |
| 二 | 清理清单 | 按目录的具体操作 |
| 三 | 不清理的部分 | 保留区域及理由 |
| 四 | 清理效果预估 | 量化预期 |
| 五 | 执行顺序和 PR 规划 | 分步实施 |

---

## 一、清理原则

1. **不删除任何文件**——全部使用 `git mv` 归档，保留完整历史
2. **分阶段执行**——先移动，再验证无引用，再提交
3. **一个 PR 一个阶段**——易于回滚

---

## 二、清理清单

### 阶段 1：Rulebook 冻结（~5.6 MB，265 个目录）

**目标**：将所有 active Rulebook tasks 移入 archive，冻结整个 rulebook 目录。

```bash
# 将 151 个 active tasks 移入 archive
cd rulebook/tasks
for d in issue-*; do
  [ -d "$d" ] && git mv "$d" archive/
done

# 添加 FROZEN.md 标记
cat > FROZEN.md << 'EOF'
# Rulebook — 已冻结

此目录自 2026-03-04 起不再接受新任务。
历史任务保留在 `archive/` 中供查阅。
详见：docs/audit/governance-reform-master-plan.md
EOF
git add FROZEN.md
```

**验证**：
```bash
# 确认 active 目录为空（仅剩 README.md, FROZEN.md, archive/）
ls rulebook/tasks/ | grep -v README | grep -v FROZEN | grep -v archive
# 应输出空
```

**影响分析**：
- CI：`openspec-log-guard` 检查 Rulebook → 该 workflow 将被删除（阶段 3）
- 脚本：`agent_pr_preflight.py` 中 Rulebook 校验 → 需在阶段 3 移除
- AGENTS.md：引用 Rulebook → 需在阶段 4 更新

---

### 阶段 2：RUN_LOG 和 Review 归档（~2.5 MB，417 个文件）

**目标**：将 `openspec/_ops/task_runs/` 和 `openspec/_ops/reviews/` 中的文件移入 `openspec/_ops/archive/`。

```bash
cd openspec/_ops

# 创建归档目录
mkdir -p archive/task_runs archive/reviews

# 移动 374 个 RUN_LOG
git mv task_runs/ISSUE-*.md archive/task_runs/

# 移动 43 个 Review
git mv reviews/ISSUE-*.md archive/reviews/ 2>/dev/null

# 在原目录写 FROZEN.md
for dir in task_runs reviews; do
  cat > "$dir/FROZEN.md" << EOF
# 已冻结

此目录自 2026-03-04 起不再接受新文件。
历史文件保留在 \`archive/$dir/\` 中供查阅。
EOF
  git add "$dir/FROZEN.md"
done
```

**验证**：
```bash
# task_runs 和 reviews 应各只剩 FROZEN.md
ls openspec/_ops/task_runs/
ls openspec/_ops/reviews/
# archive 下应有文件
ls openspec/_ops/archive/task_runs/ | wc -l  # 应为 374
ls openspec/_ops/archive/reviews/ | wc -l    # 应为 43
```

**影响分析**：
- CI：`openspec-log-guard` 检查 RUN_LOG 路径 → 该 workflow 将被删除（阶段 3）
- 脚本：`agent_pr_preflight.py` 检查 RUN_LOG → 需在阶段 3 移除
- delivery-skill.md：引用 RUN_LOG 路径 → 需在阶段 4 更新

---

### 阶段 3：CI 和脚本清理

**3a. 删除 openspec-log-guard workflow**

```bash
git rm .github/workflows/openspec-log-guard.yml
```

**3b. 从 ci.yml 移除 doc-timestamp-gate 和 dependency-audit**

手动编辑 `.github/workflows/ci.yml`：
- 删除 `doc-timestamp-gate` job（约 15 行）
- 删除 `dependency-audit` job（约 15 行）
- 从 ci gate 的 `needs` 列表中移除这两项
- 新增 `i18n-completeness` 和 `token-compliance` jobs
- 将 `test-discovery-consistency` 增加 `continue-on-error: true`

**3c. 创建 weekly dependency-audit workflow**

```bash
# 新文件：.github/workflows/dependency-audit.yml
```

**3d. 移除/简化治理脚本**

```bash
# 可安全删除的脚本（仅被已删除的 CI workflow 使用）
git rm scripts/validate_main_session_audit_ci.py
git rm scripts/validate_independent_review_ci.py
git rm scripts/independent_review_record.sh
git rm scripts/main_audit_resign.sh

# 可选删除（doc-timestamp-gate 不再在 CI 中运行）
# git rm scripts/check_doc_timestamps.py  # 本地使用可保留

# 需要简化（移除 RUN_LOG/Rulebook 检查逻辑）
# scripts/agent_pr_preflight.py
# scripts/agent_pr_preflight.sh
```

**3e. 更新 GitHub Branch Protection**

在 GitHub 仓库设置中：
- Settings → Branches → Branch protection rules → main
- Required status checks：移除 `openspec-log-guard`
- 保留：`ci`、`merge-serial`

**验证**：
```bash
# CI 配置语法检查
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"

# 确认 openspec-log-guard 不再存在
ls .github/workflows/openspec-log-guard.yml  # 应返回 No such file

# 确认被删脚本不再存在
ls scripts/validate_main_session_audit_ci.py  # 应返回 No such file
```

---

### 阶段 4：文档更新

**4a. 重写 AGENTS.md**

按照 [AGENTS.md 改革提案](./agents-md-reform-proposal.md) 重写。

**4b. 重写 delivery-skill.md**

- 移除所有 Rulebook 相关条款（规则 1, 7, 异常表 3 项）
- 移除所有 RUN_LOG 相关条款（规则 9, 15, 16, 异常表 2 项）
- 移除 Independent Review .md 文件要求（规则 17）
- 移除 EXECUTION_ORDER.md 要求（规则 5, 6）
- 移除过程记录时序要求（规则 20）
- 移除文档时间戳治理（§七）
- 简化 Independent Review 协议（§八）— 结论写 PR comment，不生成 .md
- 从 20 条硬约束减到 8 条（5 L1 + 3 L2）

**4c. 更新 openspec/project.md**

如果引用了"三体系"概念，改为"双体系"。

**4d. 更新 scripts/README.md**

移除已删除脚本的文档。

---

## 三、不清理的部分

| 保留目标 | 理由 |
|----------|------|
| `openspec/changes/archive/`（240 dirs, 6 MB） | 历史变更记录，是项目演进的完整档案 |
| `openspec/specs/`（所有 spec.md） | 模块行为规范是核心资产 |
| `design/`（设计文档） | 设计决策和 token 定义 |
| `docs/references/`（参考文档） | 技术选型、命名约定等仍有参考价值 |
| `docs/Notion/`（Notion 导出） | 早期产品思考的归档 |
| `docs/audit/`（审计报告） | 包括本次改革文档 |
| `rulebook/tasks/archive/`（114 dirs） | 已归档的历史，不占活跃路径 |

---

## 四、清理效果预估

| 指标 | 清理前 | 清理后 |
|------|--------|--------|
| 活跃路径中的治理文件 | 568 个（151 Rulebook + 374 RUN_LOG + 43 Review） | **0 个** |
| 活跃路径中的治理体积 | 8.1 MB | **~0** |
| CI workflows | 3 个 | **2 个** |
| CI jobs（每 PR） | 14 + log-guard | **13**（含 2 新增质量检查） |
| Required checks | 3 个 | **2 个** |
| 治理脚本 | 6 个 | **0-1 个** |
| Agent 每任务治理开销 | 6-8 个 .md + 4+ commits | **0 个 .md + 1-2 commits** |

---

## 五、执行顺序和 PR 规划

| PR | 阶段 | 内容 | 风险 |
|----|------|------|------|
| PR 1 | 阶段 1 | Rulebook 冻结（git mv） | 极低——纯文件移动 |
| PR 2 | 阶段 2 | RUN_LOG/Review 归档（git mv） | 极低——纯文件移动 |
| PR 3 | 阶段 3 | CI 和脚本清理 | 中——需更新 Branch Protection |
| PR 4 | 阶段 4 | 文档更新（AGENTS.md + delivery-skill.md） | 低——纯文档 |

**注意**：PR 3 合并前需要先在 GitHub 设置中移除 `openspec-log-guard` required check，否则 PR 3 自身会被该 check 阻塞。

---

> "轻装上阵，方能致远。"
