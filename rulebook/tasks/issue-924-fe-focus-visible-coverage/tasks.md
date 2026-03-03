# Tasks: issue-924-fe-focus-visible-coverage

## Red Phase
- [ ] 编写 guard 测试 `focus-visible-feature-guard.test.ts`
  - [ ] S1: 扫描 `features/**/*.tsx` 中的原生 `<button` 标签，断言有 focus-visible 或已用 Primitive
  - [ ] S2: 断言 `tokens.css` 包含 `--color-focus-ring` token
  - [ ] S3: 断言 `main.css` 包含 `.focus-ring` class 且引用 `--color-focus-ring`
- [ ] 运行测试确认 Red
- [ ] 记录 Red 阶段输出到 RUN_LOG

## Green Phase
- [ ] `tokens.css`: 新增 `--color-focus-ring`（亮/暗）
- [ ] `main.css`: 新增 `.focus-ring` utility class
- [ ] 高优先级 Feature 逐目录添加 focus-visible 或替换为 Primitive
- [ ] 运行测试确认 Green
- [ ] 运行全量测试确认无回归
- [ ] 记录 Green 阶段输出到 RUN_LOG

## Refactor Phase
- [ ] 评估语义化改进（可选）
- [ ] 确保 focus-ring utility 与 Primitive focus 样式视觉一致

## Evidence
- [ ] RUN_LOG 记录完整
- [ ] Dependency Sync Check 已完成
