# v1-18j: 清理硬编码字间距

> 属于 v1-18-arbitrary-value-cleanup（父 change），详细设计见父 change 的 proposal.md。

## 语境

10 处硬编码 `tracking-[0.1em]`/`tracking-[0.15em]`/`tracking-[-0.01em]` 散布在 features 和 primitives 中。
tokens.css 已有 `--tracking-wide`，部分可映射；负值 tracking 需评估是否新增 token。

## 当前状态

```bash
grep -rn 'tracking-\[' apps/desktop/renderer/src/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | grep -v 'var(--' | wc -l
# → 10
```

## 目标状态

同一命令 → **0**

## 映射规则

| 硬编码               | 方案                                                         |
| -------------------- | ------------------------------------------------------------ |
| `tracking-[0.1em]`   | 评估映射到 `--tracking-wide` 或新增 `--tracking-label` token |
| `tracking-[0.15em]`  | 评估映射到 `--tracking-wide` 或新增 token                    |
| `tracking-[-0.01em]` | 新增 `--tracking-tight` token                                |
| `tracking-[-0.02em]` | 新增 `--tracking-tighter` token                              |

## 不做什么

- 不改 `tracking-[var(--*)]` — token 引用，合法
- 不改测试/stories 文件
- 不自行决定 token 名称（实施时需确认 tokens.css 设计）

## 完成验证

```bash
grep -rn 'tracking-\[' apps/desktop/renderer/src/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | grep -v 'var(--' | wc -l  # → 0
pnpm typecheck                                                                       # → 0 errors
```
