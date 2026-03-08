# G0-04 资源大小与性能预算门禁行为规范

## Scenarios

### Scenario S-RES-01: 有大小校验的文件写入通过

```
GIVEN  main/src/ipc/file.ts 中 save handler 在写入前检查 Buffer.byteLength(content) <= MAX_SIZE
WHEN   运行 pnpm gate:resource-size
THEN   该写入操作不在违规列表中
```

### Scenario S-RES-02: 无大小校验的文件写入报告违规

```
GIVEN  main/src/services/export/exportService.ts 中 writeFile 调用前无任何大小检查
WHEN   运行 pnpm gate:resource-size
THEN   该写入操作出现在违规列表中
AND    输出包含文件路径、行号、操作类型
```

### Scenario S-RES-03: 违规数不超过基线

```
GIVEN  resource-size-baseline.json 记录基线违规数为 N
AND    当前扫描违规数 M ≤ N
WHEN   运行 pnpm gate:resource-size
THEN   gate 输出 PASS
```

### Scenario S-RES-04: 新增未校验写入阻断

```
GIVEN  resource-size-baseline.json 记录基线违规数为 N
AND    新代码引入了一个未校验大小的 writeFile
WHEN   当前扫描违规数 M > N
THEN   gate 输出 FAIL
```

### Scenario S-BUNDLE-01: Bundle 大小在预算内通过

```
GIVEN  bundle-size-baseline.json 记录基线总大小为 S bytes
AND    构建产物总大小 T ≤ S × 1.05（5% 容许增长）
WHEN   运行 pnpm gate:bundle-budget
THEN   gate 输出 PASS
AND    输出包含当前大小和基线大小对比
```

### Scenario S-BUNDLE-02: Bundle 大小超预算报警

```
GIVEN  bundle-size-baseline.json 记录基线总大小为 S bytes
AND    构建产物总大小 T > S × 1.05
WHEN   运行 pnpm gate:bundle-budget
THEN   gate 输出 FAIL
AND    输出包含超出大小、超出百分比、各 chunk 大小变化明细
```

### Scenario S-BUNDLE-03: Baseline 更新

```
GIVEN  有意的大型重构后需要更新 baseline
WHEN   运行 pnpm gate:bundle-budget --update-baseline
THEN   bundle-size-baseline.json 更新为当前构建产物大小
```
