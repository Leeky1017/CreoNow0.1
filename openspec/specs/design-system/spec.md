# Design System Specification

## Purpose

定义 CreoNow 视觉设计系统的 Token 体系、命名规范、Tailwind 映射契约与模块间消费关系。

### Scope

| Layer  | Path                                                                           |
| ------ | ------------------------------------------------------------------------------ |
| 设计源 | `design/system/01-tokens.css`                                                  |
| 运行时 | `apps/desktop/renderer/src/styles/tokens.css`                                  |
| 主题桥 | `apps/desktop/renderer/src/styles/main.css`（`@theme` 块）                     |
| 组件层 | `apps/desktop/renderer/src/components/primitives/`                             |
| 参考   | `design/DESIGN_DECISIONS.md` §3-4、`docs/references/design-ui-architecture.md` |

---

## Requirements

### Requirement: Token 分层架构

设计系统**必须**采用三层 Token 架构：

1. **源文件层**（`design/system/01-tokens.css`）：Token 的权威定义，由设计决策驱动。
2. **运行时层**（`renderer/src/styles/tokens.css`）：与源文件层保持完全同步，供 Electron 渲染进程使用。
3. **Tailwind 桥接层**（`renderer/src/styles/main.css` 的 `@theme` 块）：将 Token 映射到 Tailwind v4 namespace，使 utility class 可用。

Token 值的变更**必须**先更新源文件层，再同步到运行时层和桥接层。

---

### Requirement: Token 命名规范

#### 内部 Token（源文件层 + 运行时层）

内部 Token 使用 CreoNow 自有命名体系，反映语义用途：

| 类别            | 命名模式                   | 示例                    |
| --------------- | -------------------------- | ----------------------- |
| 颜色            | `--color-<role>-<variant>` | `--color-bg-base`       |
| 间距            | `--space-<N>`              | `--space-4`（16px）     |
| 语义间距        | `--space-<context>`        | `--space-panel-padding` |
| 圆角            | `--radius-<size>`          | `--radius-md`           |
| 阴影            | `--shadow-<size>`          | `--shadow-lg`           |
| 动效时长        | `--duration-<speed>`       | `--duration-fast`       |
| 动效曲线        | `--ease-<type>`            | `--ease-default`        |
| 预设 Typography | `--text-<role>-<property>` | `--text-display-size`   |
| 独立字重        | `--weight-<name>`          | `--weight-semibold`     |
| 独立字间距      | `--tracking-<name>`        | `--tracking-tight`      |
| 独立行高        | `--leading-<name>`         | `--leading-relaxed`     |
| 字体族          | `--font-family-<name>`     | `--font-family-ui`      |
| 布局尺寸        | `--size-<context>`         | `--size-icon-bar`       |
| z-index         | `--z-<level>`              | `--z-modal`             |

#### Typography 预设 Token 完整清单

| Token 族              | 用途                      | size | weight | line-height | letter-spacing |
| --------------------- | ------------------------- | ---- | ------ | ----------- | -------------- |
| `--text-display-*`    | 页面大标题（展示级）      | 48px | 300    | 1.1         | -0.03em        |
| `--text-page-title-*` | 页面标题                  | 24px | 600    | 1.2         | -0.02em        |
| `--text-heading-*`    | 区块标题（同 page-title） | 24px | 600    | 1.2         | -0.02em        |
| `--text-card-title-*` | 卡片标题                  | 16px | 600    | 1.3         | -0.01em        |
| `--text-subtitle-*`   | 小标题                    | 14px | 500    | 1.4         | —              |
| `--text-body-*`       | UI 正文                   | 13px | 400    | 1.5         | —              |
| `--text-editor-*`     | 编辑器正文                | 16px | 400    | 1.8         | —              |
| `--text-nav-*`        | 导航元素                  | 13px | 500    | 1.4         | 0              |
| `--text-caption-*`    | 辅助信息                  | 12px | 400    | 1.4         | —              |
| `--text-metadata-*`   | 元数据（时间戳、字数等）  | 12px | 400    | 1.4         | 0.02em         |
| `--text-label-*`      | 大写标签                  | 10px | 500    | 1.2         | 0.1em          |
| `--text-tree-*`       | 侧栏树节点                | 13px | 400    | 1.3         | —              |
| `--text-status-*`     | 状态栏                    | 11px | 400    | 1.2         | —              |
| `--text-mono-*`       | 代码/等宽                 | 13px | 400    | 1.5         | —              |

**别名关系**：

- `--text-heading-*` 与 `--text-page-title-*` **同值**，`heading` 为语义别名，用于区块级标题上下文。两者值必须保持同步，未来若需分化则先更新本 spec。
- `--text-nav-*` 与 `--text-tree-*` **不同**：nav 的 weight 为 500（强调），tree 为 400（正文级）。
- `--text-metadata-*` 与 `--text-caption-*` **不同**：metadata 有 0.02em letter-spacing（数据感），caption 无。

---

### Requirement: Tailwind v4 桥接层命名规范

`@theme` 块中的变量名**必须**遵循 Tailwind v4 的 namespace 约定（参见 `node_modules/tailwindcss/theme.css`），否则不会生成对应 utility class。

#### 字体尺寸（text-\*）

```
--text-<name>: <size>;
--text-<name>--line-height: <value>;
--text-<name>--letter-spacing: <value>;
--text-<name>--font-weight: <value>;
```

通过 `@theme inline` 引用内部 Token：

```css
@theme inline {
  --text-display: var(--text-display-size);
  --text-display--line-height: var(--text-display-line-height);
  --text-display--letter-spacing: var(--text-display-letter-spacing);
  --text-display--font-weight: var(--text-display-weight);
}
```

生成 utility class：`text-display` → 自动应用 font-size + line-height + letter-spacing + font-weight。

#### 字重（font-weight-\*）

```
--font-weight-<name>: <value>;
```

通过 `@theme inline` 引用内部 Token：

```css
@theme inline {
  --font-weight-light: var(--weight-light);
}
```

生成 utility class：`font-light` → font-weight: 300。

#### 字间距（tracking-\*）

```
--tracking-<name>: <value>;
```

通过 `@theme inline` 引用内部 Token：

```css
@theme inline {
  --tracking-tight: var(--tracking-tight);
}
```

生成 utility class：`tracking-tight` → letter-spacing: -0.03em。

#### 行高（leading-\*）

```
--leading-<name>: <value>;
```

通过 `@theme inline` 引用内部 Token：

```css
@theme inline {
  --leading-tight: var(--leading-tight);
}
```

生成 utility class：`leading-tight` → line-height: 1.1。

#### 何时用 `@theme` vs `@theme inline`

- `@theme`（不带 inline）：硬编码值，Tailwind 会在编译时静态替换。适用于不依赖运行时 CSS 变量的值（如圆角、间距常量）。
- `@theme inline`：值保留为 `var(--xxx)` 引用，在运行时解析。**适用于需要引用 tokens.css 中已定义的 CSS 变量的场景**——本项目的 typography / weight / tracking / leading token 均需走此路径。

---

### Requirement: 语义间距 Token

语义间距**必须**通过引用基础间距 Token 定义（不得硬编码值）：

| Token                   | 值               | 用途         |
| ----------------------- | ---------------- | ------------ |
| `--space-panel-padding` | `var(--space-4)` | 面板内边距   |
| `--space-section-gap`   | `var(--space-6)` | 区块间距     |
| `--space-item-gap`      | `var(--space-2)` | 列表项间距   |
| `--space-inline-gap`    | `var(--space-1)` | 行内元素间距 |

---

### Requirement: Token 同步契约

`renderer/src/styles/tokens.css` 与 `design/system/01-tokens.css` 中的 Token 变量名和值**必须**保持一致。新增、修改、删除 Token 时，两个文件必须同步更新。

Guard 测试**必须**自动验证同步一致性。

---

## Scenarios

#### Scenario: Tailwind utility class 消费 typography token

- **假设** `@theme inline` 中定义了 `--text-display: var(--text-display-size)`
- **当** 开发者在 JSX 中使用 `className="text-display"`
- **则** Tailwind 生成的 CSS 包含 `font-size: var(--text-display-size)`
- **并且** 同时应用 `line-height: var(--text-display-line-height)`
- **并且** 同时应用 `letter-spacing: var(--text-display-letter-spacing)`
- **并且** 同时应用 `font-weight: var(--text-display-weight)`

#### Scenario: 新增 Token 时的同步流程

- **假设** 需要新增一个 `--text-footnote-*` Token 族
- **当** 在 `design/system/01-tokens.css` 中定义
- **则** 必须同步到 `renderer/src/styles/tokens.css`
- **并且** 必须在 `main.css` 的 `@theme inline` 中添加 Tailwind 桥接
- **并且** guard 测试必须覆盖新 Token

#### Scenario: 运行时主题切换时 Token 生效

- **假设** `@theme inline` 使用 `var()` 引用 Token
- **当** 用户切换 dark/light 主题
- **则** CSS 变量值随主题切换，Tailwind utility class 自动生效新值
