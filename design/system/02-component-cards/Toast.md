# Toast 组件生成卡片

## 元信息

- **优先级**: P0
- **依赖**: 自研（Sonner 式 API）
- **文件位置**: `components/providers/AppToastProvider/`
- **设计参考**: `34-component-primitives.html`

---

## 容器规格

| 属性        | 值                    |
| ----------- | --------------------- |
| 定位        | fixed                 |
| bottom      | 24px (--space-6)      |
| right       | 24px (--space-6)      |
| z-index     | --z-toast             |
| 方向        | flex-col, gap: 8px    |
| max-width   | 360px                 |

---

## 单条 Toast 规格

| 属性    | 值                         |
| ------- | -------------------------- |
| 背景    | --color-bg-raised          |
| 边框    | 1px --color-border-default |
| 圆角    | --radius-md                |
| 阴影    | --shadow-lg                |
| padding | 12px 16px                  |

---

## 变体

| 变体    | 图标色              | 左侧指示条色        |
| ------- | ------------------- | ------------------- |
| success | --color-success     | --color-success     |
| error   | --color-error       | --color-error       |
| warning | --color-warning     | --color-warning     |
| info    | --color-info        | --color-info        |

---

## 文字规格

| 元素     | 字号 | 字重 | 颜色             |
| -------- | ---- | ---- | ---------------- |
| 标题     | 13px | 500  | --color-fg-default |
| 描述     | 12px | 400  | --color-fg-muted   |
| 关闭按钮 | 16px | -    | Ghost 风格        |
| 操作按钮 | 12px | 500  | --color-accent     |

---

## 动效

- 进入: `translateX(100%) → translateX(0)`, `var(--duration-slow)`
- 退出: `opacity: 1 → 0`, `var(--duration-fast)`
- 堆叠: 新 Toast 从底部推入，旧 Toast 向上位移

---

## 行为约束 (MUST)

- 同时最多显示 3 条
- 超出 3 条时最旧的自动消失
- 默认 5s 自动消失
- MUST NOT 用 Toast 展示保存成功（走状态栏指示器）

---

## 禁止事项

- MUST NOT 硬编码颜色值
- MUST NOT 使用 any 类型
- MUST NOT 用于保存反馈
