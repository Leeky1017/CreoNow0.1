# G0-06 非自动化问题全覆盖审计协议行为规范

## Scenarios

### Scenario S-REVIEW-01: 涉及 UI 的 PR 触发非自动化检查项

```
GIVEN  一个修改了 renderer/src/ 下 .tsx 文件的 PR
WHEN   PR 作者填写 PR template
THEN   template 中包含"非自动化检查"章节
AND    作者需逐项确认或标注 N/A
```

### Scenario S-REVIEW-02: 非 UI 的 PR 可跳过非自动化检查

```
GIVEN  一个仅修改 main/src/ 下后端代码的 PR
WHEN   PR 作者填写 PR template
THEN   "非自动化检查"章节可标注全部 N/A
```

### Scenario S-AUDIT-01: 审计必须包含产品行为验证

```
GIVEN  审计 Agent 对一个前端 PR 执行 PRE-AUDIT
WHEN   审计评论中不包含任何产品行为验证（无截图、无用户场景验证命令）
THEN   该 PRE-AUDIT 被视为不完整
AND    需要补充至少 1 条产品行为验证
```

### Scenario S-AUDIT-02: FINAL-VERDICT 必须回答产品行为问题

```
GIVEN  审计 Agent 发布 FINAL-VERDICT
WHEN   FINAL-VERDICT 中包含"作为用户，修改后行为是否符合 spec"的明确回答
THEN   FINAL-VERDICT 格式完整
```

### Scenario S-FONT-01: 字体验收清单可执行

```
GIVEN  一个修改了字体相关 CSS/token 的 PR
WHEN   reviewer 按照 font-verification-checklist.md 执行验收
THEN   清单中每一项可在 Storybook 或 Electron 开发环境中验证
AND    验证结果可截图记录
```

### Scenario S-RATE-01: 速率限制 RFC 可评审

```
GIVEN  rate-limiting-rfc.md 已创建
WHEN   架构评审会议审阅该 RFC
THEN   RFC 包含：当前调用链路、需限流端点、候选策略、评审状态
```
