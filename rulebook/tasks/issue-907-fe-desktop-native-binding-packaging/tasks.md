# Tasks: fe-desktop-native-binding-packaging (#907)

更新时间：2026-03-02 16:30

## Specification

修复 `better-sqlite3` native binding 在打包产物中的包含与加载路径，确保打包版启动不报 `DB_ERROR`。

## TDD Mapping

| Scenario         | 测试名                                      | 断言                                                    |
| ---------------- | ------------------------------------------- | ------------------------------------------------------- |
| AI-FE-NATIVE-S1  | ABI probe 可加载                             | `pnpm desktop:ensure-native-node-abi` 不抛异常          |
| AI-FE-NATIVE-S2  | asarUnpack includes \*\*/\*.node             | 读取 JSON，断言 `asarUnpack` 包含 `**/*.node`           |
| AI-FE-NATIVE-S3  | npmRebuild is not false                      | 断言 `npmRebuild !== false`                             |

Guard 测试文件：`apps/desktop/main/src/ipc/__tests__/native-binding-path.guard.test.ts`

## Steps

- [x] 1. Red — guard 测试确认 S3 失败（`npmRebuild: false`）
- [x] 2. Green — 修改 `electron-builder.json`，`npmRebuild: true`
- [x] 3. ABI probe 通过（S1）
- [x] 4. 全量回归测试通过
- [x] 5. Typecheck 通过

## Evidence

- Guard test Red: S2 passed, S3 failed (npmRebuild was false)
- Guard test Green: S2 passed, S3 passed (npmRebuild changed to true)
- ABI probe: exit 0, no exceptions
- Unit tests: 257 tsx + 10 vitest = 267 tests, all passed
- Typecheck: clean
