# Tasks: issue-925-fe-composites-p1
更新时间：2026-03-03 09:37

## 1. Specification
- [ ] 1.1 审阅需求边界：新增 P1 Composites（SearchInput/FormField/ToolbarGroup）
- [ ] 1.2 依赖同步检查：`fe-composites-p0` (#919) 已合并 main

## 2. TDD Mapping
- [ ] 2.1 Scenario → 测试映射完成
- [ ] 2.2 门禁确认：Red 失败输出已记录

## 3. Red
- [ ] 3.1 SearchInput.test.tsx — 3 个测试用例
- [ ] 3.2 FormField.test.tsx — 2 个测试用例
- [ ] 3.3 ToolbarGroup.test.tsx — 1 个测试用例
- [ ] 3.4 运行确认 Red（6 个测试全红）

## 4. Green
- [ ] 4.1 新增 SearchInput.tsx
- [ ] 4.2 新增 FormField.tsx
- [ ] 4.3 新增 ToolbarGroup.tsx
- [ ] 4.4 替换示范：OutlinePanel 搜索区 → `<SearchInput>`
- [ ] 4.5 替换示范：SettingsGeneral 表单字段 → `<FormField>`
- [ ] 4.6 运行确认 Green（6 个测试全绿）

## 5. Refactor
- [ ] 5.1 确认 a11y 属性（role/aria-label）
- [ ] 5.2 确认 FormField htmlFor 关联
- [ ] 5.3 JSDoc 注释完善

## 6. Evidence
- [ ] 6.1 RUN_LOG Red 记录
- [ ] 6.2 RUN_LOG Green 记录
- [ ] 6.3 全量回归通过
- [ ] 6.4 Dependency Sync Check 记录
