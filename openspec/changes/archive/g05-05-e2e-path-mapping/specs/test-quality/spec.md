# Delta Spec: test-quality — E2E 关键路径映射表

- **Parent Change**: `g05-05-e2e-path-mapping`
- **Base Spec**: N/A（测试治理增量规则）
- **GitHub Issue**: 待创建

---

## 变更摘要

测试治理文档必须包含一张“7 条关键用户路径 ↔ E2E 文件映射表”，并为部分覆盖或未覆盖项写明处理结论。

---

## Scenarios

### Scenario S-G05-05-01: 七条关键路径均可追溯到测试文件

```
GIVEN  `05-e2e-testing-patterns.md`
WHEN   查看映射章节
THEN   7 条关键路径均能映射到具体 E2E 文件或明确标记为空洞
```

### Scenario S-G05-05-02: 部分覆盖项有明确结论

```
GIVEN  编辑与保存、导出等部分覆盖路径
WHEN   查看映射表
THEN   每一项都写明“补充 E2E”或“由下层测试覆盖”的处理结论
```
