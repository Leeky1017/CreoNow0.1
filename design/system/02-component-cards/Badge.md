# Badge 组件生成卡片

## 元信息

- **优先级**: P1
- **依赖**: 无
- **文件位置**: `components/primitives/Badge/`
- **设计参考**: `34-component-primitives.html`

---

## 尺寸变体

| 尺寸 | 高度 | 字号 | padding | 圆角          |
| ---- | ---- | ---- | ------- | ------------- |
| sm   | 18px | 10px | 0 6px   | --radius-full |
| md   | 22px | 11px | 0 8px   | --radius-full |

---

## 颜色变体

| 变体    | 背景                    | 文字                |
| ------- | ----------------------- | ------------------- |
| default | --color-bg-hover        | --color-fg-muted    |
| accent  | --color-accent-subtle   | --color-fg-default  |
| success | --color-success-subtle  | --color-success     |
| warning | --color-warning-subtle  | --color-warning     |
| error   | --color-error-subtle    | --color-error       |
| info    | --color-info-subtle     | --color-info        |

---

## 文字样式

| 属性            | 值     |
| --------------- | ------ |
| font-weight     | 500    |
| letter-spacing  | 0.02em |

---

## 边界情况 (MUST 处理)

| 边界         | 处理方式           |
| ------------ | ------------------ |
| 文字过长     | truncate, max-width |
| 数字 > 99    | 显示 "99+"          |

---

## 禁止事项

- MUST NOT 硬编码颜色值
- MUST NOT 使用 any 类型
