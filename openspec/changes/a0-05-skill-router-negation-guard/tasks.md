# Tasks: a0-05-skill-router-negation-guard

- [ ] 更新 `openspec/changes/a0-05-skill-router-negation-guard/specs/skill-system/spec.md`，明确否定语境下不得触发对应 skill
- [ ] 为关键词匹配与 rewrite 启发式增加最小 negation guard
- [ ] 确保被否定的命中会继续走后续规则或默认回退到 `builtin:chat`
- [ ] 为 `不要续写`、`别写下去`、`不要改写` 等场景补齐测试
- [ ] 验证正向关键词场景不回归
