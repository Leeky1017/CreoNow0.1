# G0-03 前端架构守护门禁行为规范

## Scenarios

### Scenario S-DIM-01: 大像素固定尺寸被阻断

```
GIVEN  renderer/src/ 下的非 test/stories 的 .tsx 文件
WHEN   开发者使用 className 包含 h-[600px] 或 w-[400px]（N > 48）
THEN   ESLint 报告 creonow/no-hardcoded-dimension 违规
AND    报告消息建议使用 min-h / max-h / overflow-auto 等弹性方案
```

### Scenario S-DIM-02: 小像素尺寸不误报

```
GIVEN  renderer/src/ 下的 .tsx 文件
WHEN   开发者使用 className 包含 h-[16px] 或 w-[24px]（N ≤ 48）
THEN   ESLint 不报告 creonow/no-hardcoded-dimension 违规
```

### Scenario S-DIM-03: Tailwind 预定义尺寸类不误报

```
GIVEN  renderer/src/ 下的 .tsx 文件
WHEN   开发者使用 h-full, w-screen, min-h-0, max-w-prose 等 Tailwind 预定义尺寸类
THEN   ESLint 不报告 creonow/no-hardcoded-dimension 违规
```

### Scenario S-EB-01: 有 ErrorBoundary 的路由通过

```
GIVEN  路由 /editor 的页面组件被 <ErrorBoundary> 包裹
WHEN   运行 pnpm gate:error-boundary
THEN   该路由不在违规列表中
```

### Scenario S-EB-02: 无 ErrorBoundary 的路由报告违规

```
GIVEN  路由 /settings 的页面组件未被任何 ErrorBoundary 包裹
WHEN   运行 pnpm gate:error-boundary
THEN   该路由出现在违规列表中
AND    输出包含路由路径、组件名
```

### Scenario S-EB-03: ErrorBoundary 违规数不超过基线

```
GIVEN  error-boundary-baseline.json 记录基线违规数为 N
AND    当前扫描违规数 M ≤ N
WHEN   运行 pnpm gate:error-boundary
THEN   gate 输出 PASS
```

### Scenario S-ARCH-01: Provider 嵌套超阈值报警

```
GIVEN  App.tsx 中 Provider 嵌套深度为 13
AND    阈值设定为 10
WHEN   运行 pnpm gate:architecture-health
THEN   输出 [ARCH_HEALTH] WARN provider nesting depth: 13 (threshold: 10)
```

### Scenario S-ARCH-02: 文件行数超限报告

```
GIVEN  renderer/src/services/someService.ts 有 650 行
AND    阈值设定为 500 行
WHEN   运行 pnpm gate:architecture-health
THEN   该文件出现在超限文件列表中
AND    输出包含文件路径和行数
```

### Scenario S-ARCH-03: ARIA-live 缺失检测

```
GIVEN  renderer/src/components/Toast/Toast.tsx 渲染动态通知内容
AND    组件 JSX 中不包含 aria-live 属性
WHEN   运行 pnpm gate:architecture-health
THEN   该组件出现在 ARIA-live 缺失列表中
```

### Scenario S-ARCH-04: 有 aria-live 的动态组件通过

```
GIVEN  renderer/src/components/StatusBar/StatusBar.tsx 包含 aria-live="polite"
WHEN   运行 pnpm gate:architecture-health
THEN   该组件不在 ARIA-live 缺失列表中
```

### Scenario S-ARCH-05: 架构健康指标不超过基线

```
GIVEN  architecture-health-baseline.json 记录各维度基线值
AND    当前扫描各维度均 ≤ 基线
WHEN   运行 pnpm gate:architecture-health
THEN   gate 输出 PASS
```
