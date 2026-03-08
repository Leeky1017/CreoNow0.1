# G0-01 前端 ESLint 门禁行为规范

## Scenarios

### Scenario S-LINT-01: 原生 HTML 元素在 renderer 生产代码中被阻断

```
GIVEN  renderer/src/ 下的非 test/stories 的 .tsx 文件
WHEN   开发者使用 <button>, <input>, <select>, <textarea>, <dialog>, <a>, <label> 等原生 HTML 交互元素
THEN   ESLint 报告 creonow/no-native-html-element 违规
AND    报告消息建议对应的 Radix/设计系统替代组件
```

### Scenario S-LINT-02: 设计系统组件不误报

```
GIVEN  renderer/src/ 下的 .tsx 文件
WHEN   开发者使用 <Button>, <Input>, <Select>, <Dialog> 等设计系统组件
THEN   ESLint 不报告 creonow/no-native-html-element 违规
```

### Scenario S-LINT-03: 非交互原生元素不误报

```
GIVEN  renderer/src/ 下的 .tsx 文件
WHEN   开发者使用 <div>, <span>, <p>, <h1>-<h6>, <ul>, <li>, <section>, <article>, <main>, <header>, <footer>, <nav> 等布局/语义元素
THEN   ESLint 不报告 creonow/no-native-html-element 违规
```

### Scenario S-LINT-04: 错误码在 JSX 中被阻断

```
GIVEN  renderer/src/ 下的非 test 的 .tsx 文件
WHEN   开发者在 JSX return 语句中使用 {error.code} 或 {err.code}
THEN   ESLint 报告 creonow/no-raw-error-code-in-ui 违规
AND    报告消息建议使用 getHumanErrorMessage() 或 t() 映射
```

### Scenario S-LINT-05: 错误码在条件判断中不误报

```
GIVEN  renderer/src/ 下的 .tsx 文件
WHEN   开发者在 if/switch 语句中使用 error.code === 'SOME_CODE' 进行条件判断
THEN   ESLint 不报告 creonow/no-raw-error-code-in-ui 违规
```

### Scenario S-LINT-06: 错误码在日志/catch 中不误报

```
GIVEN  renderer/src/ 下的 .tsx 文件
WHEN   开发者在 console.error() 或 catch 块中引用 error.code
THEN   ESLint 不报告 creonow/no-raw-error-code-in-ui 违规
```

### Scenario S-LINT-07: Tailwind 阴影类被阻断

```
GIVEN  renderer/src/ 下的 .tsx 文件
WHEN   开发者使用 className 包含 shadow-lg, shadow-xl, shadow-2xl, shadow-md, shadow-sm
THEN   ESLint 报告 creonow/no-raw-tailwind-tokens 违规
AND    报告消息建议使用 --shadow-* Design Token
```

### Scenario S-LINT-08: CSS 变量阴影引用不误报

```
GIVEN  renderer/src/ 下的 .tsx 文件
WHEN   开发者使用 className 包含 shadow-[var(--shadow-card)] 或 style 引用 var(--shadow-*)
THEN   ESLint 不报告 creonow/no-raw-tailwind-tokens 违规
```

### Scenario S-LINT-09: Storybook 文件设计 Token 覆盖

```
GIVEN  renderer/src/ 下的 .stories.tsx 文件
WHEN   开发者使用原始 Tailwind 色值（如 bg-red-500）
THEN   ESLint 报告 creonow/no-raw-tailwind-tokens 违规（级别 warn）
```

### Scenario S-LINT-10: Storybook 文件裸字符串豁免

```
GIVEN  renderer/src/ 下的 .stories.tsx 文件
WHEN   开发者在 args/文案中使用裸字符串
THEN   ESLint 不报告 i18next/no-literal-string 违规
```

### Scenario S-LINT-11: 新规则以 warn 启动并纳入 ratchet

```
GIVEN  no-native-html-element 和 no-raw-error-code-in-ui 以 warn 级别启用
WHEN   运行 pnpm lint:warning-budget
THEN   lint-ratchet 检查当前违规数 ≤ lint-baseline.json 中记录的初始值
AND    新增代码引入的新违规会导致 ratchet 失败
```

### Scenario S-LINT-12: test 文件不受新规则约束

```
GIVEN  renderer/src/ 下的 .test.tsx 或 .spec.tsx 文件
WHEN   开发者使用原生 <button> 或引用 error.code
THEN   ESLint 不报告 creonow/no-native-html-element 或 creonow/no-raw-error-code-in-ui 违规
```
