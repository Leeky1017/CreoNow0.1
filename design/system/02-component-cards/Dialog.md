# Dialog 组件生成卡片

## 元信息

- **优先级**: P0
- **依赖**: Radix UI Dialog
- **文件位置**: `components/primitives/Dialog/`
- **设计参考**: `16-create-project-dialog.html`, `34-component-primitives.html`

---

## 变体 (Variants)

| 尺寸 | 宽度  | padding | 用途             |
| ---- | ----- | ------- | ---------------- |
| sm   | 400px | 24px    | 确认/告知        |
| md   | 560px | 24px    | 表单/创建        |
| lg   | 720px | 32px    | 复杂配置/预览    |
| xl   | 900px | 32px    | 大型面板式对话框 |

---

## 视觉规格

| 属性     | 值                         |
| -------- | -------------------------- |
| 背景     | --color-bg-surface         |
| 边框     | 1px --color-border-default |
| 圆角     | --radius-lg (12px)         |
| 阴影     | --shadow-xl                |
| z-index  | --z-modal                  |
| 遮罩     | --color-scrim              |

---

## 状态矩阵 (MUST 全部实现)

| 状态     | 视觉表现                           | 行为           | 触发方式          |
| -------- | ---------------------------------- | -------------- | ----------------- |
| opening  | scale(0.96→1), opacity(0→1)       | 遮罩渐入       | open=true         |
| open     | 正常显示                           | 可交互         | 打开后            |
| closing  | scale(1→0.96), opacity(1→0)       | 遮罩渐出       | 关闭动作          |
| closed   | 不渲染                             | -              | open=false        |

---

## 关闭行为 (MUST)

| 触发         | 行为       | 可禁用? |
| ------------ | ---------- | ------- |
| Escape 键    | 关闭对话框 | 否      |
| 点击遮罩     | 关闭对话框 | 是      |
| 关闭按钮     | 关闭对话框 | 否      |

---

## 动效

- 进入: `var(--duration-normal)`, `var(--ease-out)`
- 退出: `var(--duration-fast)`
- MUST NOT 使用 bounce/elastic 缓动

---

## 禁止事项

- MUST NOT 硬编码颜色值
- MUST NOT 使用 any 类型
- MUST NOT 使用内联样式定义尺寸
