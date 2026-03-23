# Tasks: v1-14a 补齐对话框交互遗留

- **父 change**: v1-14-*
- **状态**: 📋 待实施
- **任务数**: 2

---

## 文件组

- [ ] `CreateProjectDialog.tsx` + `useCreateProject.ts` — 新建模板成功后自动选中（AC-17）
      实例（1 处）:
        :模板创建回调 — 新增 onTemplateCreated → 刷新列表并 auto-select
      验证: `pnpm -C apps/desktop exec vitest run CreateProjectDialog`

- [ ] `ExportDialog.tsx` + `useExportConfig.ts` + IPC/main 层 — 导出进度态 Cancel 真实中止（AC-18）
      实例（1 处）:
        :导出进度态 Cancel 按钮 — 补齐 abort 链路（前端 → IPC → main 中止导出任务）
      验证: `pnpm -C apps/desktop exec vitest run ExportDialog`

---

## 整体验证

```bash
pnpm typecheck && pnpm -C apps/desktop exec vitest run export project
```
