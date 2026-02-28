# 提案：fe-project-image-cropper

更新时间：2026-02-28 19:20

## Why（问题与目标）

创建项目上传封面图后，当前只能 `object-cover` 裁剪填满容器，无法拖拽调整焦点，也无法缩放裁剪。对标 Notion 封面图，用户需要 Reposition 能力。

本 change 目标：为“项目封面图”提供最小可用的裁剪/聚焦能力，并输出可持久化的 crop 参数。

## What（交付内容）

- 新增 Layer 2 Composite：`ImageCropper`
  - 支持拖拽平移与滚轮缩放
  - 输出 `{ file, cropArea: { x, y, zoom } }`（或等价结构）
- `CreateProjectDialog` 使用 `ImageCropper` 替换裸 `ImageUpload`
- 保留现有 `ImageUpload` API：`ImageCropper` 作为增强包装而非破坏性替换

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-project-image-cropper/specs/project-management/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/components/primitives/ImageUpload.tsx`
  - `apps/desktop/renderer/src/components/composites/ImageCropper.tsx`（新）
  - `apps/desktop/renderer/src/features/projects/CreateProjectDialog.tsx`

## Out of Scope（不做什么）

- 不在本 change 内引入复杂图片编辑（滤镜/旋转/多裁剪比例）。
- 不在本 change 内实现跨页面复用（先服务创建项目封面图）。

## Dependencies（依赖）

- 上游：`openspec/specs/project-management/spec.md`
- 下游：`fe-composites-p0-panel-and-command-items`（Composite 体系整体收敛时可进一步对齐）

## 审阅状态

- Owner 审阅：`PENDING`
