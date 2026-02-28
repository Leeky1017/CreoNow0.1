# 提案：fe-desktop-native-binding-packaging

更新时间：2026-02-28 19:20

## Why（问题与目标）

Owner 实测打包版出现 `DB_ERROR`：`better-sqlite3` native binding 缺失或路径不正确，导致 Skills 不可用。这属于“构建产物不完整”的硬故障。

本 change 目标：修复打包流程，确保发布产物包含必要 native addon，并在构建期提供可自动验证的护栏。

## What（交付内容）

- 修复 `better-sqlite3` native binding 在打包产物中的包含与加载路径。
- 在构建/CI 增加验证护栏（脚本或检查）：
  - 打包前/后校验 native addon ABI 与产物路径一致
- 产物验证口径：打包版启动后不再出现 `DB_ERROR`（在满足前置条件时）。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-desktop-native-binding-packaging/specs/ai-service/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/electron-builder.json`
  - `apps/desktop/main/*`（native binding 加载路径）
  - `scripts/ensure-desktop-native-node-abi.ts`（若作为护栏）

## Out of Scope（不做什么）

- 不在本 change 内解决 Provider 未配置问题（`AI_NOT_CONFIGURED` 由设置引导处理）。

## Dependencies（依赖）

- 上游：`openspec/specs/ai-service/spec.md`

## 审阅状态

- Owner 审阅：`PENDING`
