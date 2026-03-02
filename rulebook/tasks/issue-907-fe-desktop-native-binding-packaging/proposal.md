# Proposal: fe-desktop-native-binding-packaging

更新时间：2026-03-02 16:30

| 字段     | 值                                              |
| -------- | ----------------------------------------------- |
| Issue    | #907                                            |
| Change   | fe-desktop-native-binding-packaging             |
| Module   | desktop (infrastructure)                        |
| Priority | P0                                              |
| Status   | implementing                                    |

## 问题描述

`electron-builder.json` 中 `"npmRebuild": false` 导致 `better-sqlite3` native addon 未针对 Electron ABI 重编译。打包后应用启动时会因为无法加载 native binding 而返回 `DB_ERROR`。

## 解决方案

1. 将 `npmRebuild` 从 `false` 改为 `true`，让 electron-builder 在打包时自动重编译 native addon
2. 添加 guard 测试静态断言 `electron-builder.json` 配置的正确性
3. 已有的 `asarUnpack: ["**/*.node"]` 配置确保 `.node` 文件被解包到 asar 外部

## 影响范围

- `apps/desktop/electron-builder.json` — 配置变更
- `apps/desktop/main/src/ipc/__tests__/native-binding-path.guard.test.ts` — 新增 guard 测试

## 不处理

- Provider 未配置问题（`AI_NOT_CONFIGURED`）不在本次范围内
