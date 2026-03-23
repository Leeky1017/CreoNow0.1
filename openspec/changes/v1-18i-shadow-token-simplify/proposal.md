# v1-18i: 简化 shadow token 引用

> 属于 v1-18-arbitrary-value-cleanup（父 change），详细设计见父 change 的 proposal.md。

## 语境

`@theme inline` 已将 `--shadow-sm/md/lg/xl` 导出为 Tailwind 工具类，因此 `shadow-[var(--shadow-xl)]` 可直接写成 `shadow-xl`。
另有 5 处复合自定义阴影 `shadow-[0_Npx_var(...)]` 需逐个评估是否可映射到标准 token。

## 当前状态

```bash
grep -rn 'shadow-\[var(--shadow' apps/desktop/renderer/src/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 35

grep -rn 'shadow-\[0' apps/desktop/renderer/src/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 5
```

## 目标状态

- `shadow-[var(--shadow-*)]` → **0**
- `shadow-[0_...]` → 逐个评估，能映射到 token 的替换，不能的保留并加 eslint-disable 注释

## 映射规则

| 硬编码 | 简写 |
|--------|------|
| `shadow-[var(--shadow-sm)]` | `shadow-sm` |
| `shadow-[var(--shadow-md)]` | `shadow-md` |
| `shadow-[var(--shadow-lg)]` | `shadow-lg` |
| `shadow-[var(--shadow-xl)]` | `shadow-xl` |

## 不做什么

- 不改 `shadow-sm/md/lg/xl`（已是简写，无需处理）
- 不改 `box-shadow` CSS 属性引用
- 不改测试/stories 文件

## 完成验证

```bash
grep -rn 'shadow-\[var(--shadow' apps/desktop/renderer/src/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l   # → 0
grep -rn 'shadow-\[0' apps/desktop/renderer/src/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l   # → 0 或保留带注释
pnpm typecheck                                                     # → 0 errors
pnpm -C apps/desktop exec vitest run                               # → all pass
```
