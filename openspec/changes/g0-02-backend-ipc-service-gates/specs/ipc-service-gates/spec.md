# G0-02 后端 IPC 与服务健壮性门禁行为规范

## Scenarios

### Scenario S-IPC-01: 有 Schema 验证的 Handler 通过

```
GIVEN  main/src/ipc/file.ts 中一个 handler 函数体内包含 schema.parse(args) 调用
WHEN   运行 pnpm gate:ipc-validation
THEN   该 handler 不在违规列表中
```

### Scenario S-IPC-02: 无 Schema 验证的 Handler 报告违规

```
GIVEN  main/src/ipc/ai.ts 中一个 handler 函数体直接 destructure 参数无任何 validate/parse 调用
WHEN   运行 pnpm gate:ipc-validation
THEN   该 handler 出现在违规列表中
AND    输出包含文件路径、handler 名称
```

### Scenario S-IPC-03: 违规数不超过基线

```
GIVEN  ipc-validation-baseline.json 记录基线违规数为 N
AND    当前扫描结果违规数 M
WHEN   M ≤ N
THEN   gate 输出 PASS
```

### Scenario S-IPC-04: 新增违规阻断 CI

```
GIVEN  ipc-validation-baseline.json 记录基线违规数为 N
AND    新代码引入了一个未验证的 handler
WHEN   当前扫描结果违规数 M > N
THEN   gate 输出 FAIL
AND    列出新增的违规 handler
```

### Scenario S-STUB-01: 正常方法通过

```
GIVEN  main/src/services/documents/documentCoreService.ts 中一个方法有实际业务逻辑
WHEN   运行 pnpm gate:service-stubs
THEN   该方法不在桩方法列表中
```

### Scenario S-STUB-02: return [] 桩方法被检测

```
GIVEN  某 service 类中一个公共方法体仅有 return []
WHEN   运行 pnpm gate:service-stubs
THEN   该方法出现在桩方法列表中
AND    输出包含：文件路径、类名、方法名、行号
```

### Scenario S-STUB-03: TODO 注释被检测

```
GIVEN  某 service 类中一个公共方法体包含 // TODO: implement
WHEN   运行 pnpm gate:service-stubs
THEN   该方法出现在桩方法列表中
```

### Scenario S-STUB-04: throw not-implemented 被检测

```
GIVEN  某 service 类中一个公共方法体仅有 throw new Error('not implemented')
WHEN   运行 pnpm gate:service-stubs
THEN   该方法出现在桩方法列表中
```

### Scenario S-STUB-05: 桩方法数量不超过基线

```
GIVEN  service-stubs-baseline.json 记录基线桩方法数为 N
AND    当前扫描结果桩方法数 M
WHEN   M ≤ N
THEN   gate 输出 PASS
```

### Scenario S-STUB-06: 新增桩方法阻断 CI

```
GIVEN  service-stubs-baseline.json 记录基线桩方法数为 N
AND    新代码引入了一个新桩方法
WHEN   当前扫描结果桩方法数 M > N
THEN   gate 输出 FAIL
```

### Scenario S-SKILL-01: Skill handler 输出有 schema 通过

```
GIVEN  skill handler 函数在调用 LLM 后使用 outputSchema.parse(result) 校验返回值
WHEN   运行 cross-module contract gate 的 skill-output 维度检查
THEN   该 handler 不在违规列表中
```

### Scenario S-KEY-01: API Key 有格式校验通过

```
GIVEN  API key 配置校验函数包含长度/前缀/格式检查（不仅仅是非空）
WHEN   运行 cross-module contract gate 的 api-key 维度检查
THEN   该配置不在违规列表中
```
