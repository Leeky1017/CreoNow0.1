# Select 组件生成卡片

## 元信息

- **优先级**: P0
- **依赖**: Radix UI Select
- **文件位置**: `components/primitives/Select/`
- **设计参考**: `10-settings.html`, `34-component-primitives.html`

---

## 触发器规格

| 属性   | 值                         |
| ------ | -------------------------- |
| 高度   | 40px                       |
| padding | 0 12px                    |
| 背景   | --color-bg-surface         |
| 边框   | 1px --color-border-default |
| 圆角   | --radius-sm                |
| 字号   | 13px                       |

---

## 下拉内容规格

| 属性        | 值                         |
| ----------- | -------------------------- |
| 背景        | --color-bg-raised          |
| 边框        | 1px --color-border-default |
| 圆角        | --radius-md                |
| 阴影        | --shadow-md                |
| z-index     | --z-dropdown               |
| max-height  | 320px                      |
| padding     | 4px                        |

---

## 选项项规格

| 属性         | 值                    |
| ------------ | --------------------- |
| 高度         | 32px                  |
| padding      | 0 8px 0 32px          |
| 圆角         | --radius-sm           |
| 字号         | 13px                  |
| 选中标记     | Check 图标 (左侧)     |

---

## 状态矩阵 (MUST 全部实现)

| 状态     | 视觉表现                   | 触发方式     |
| -------- | -------------------------- | ------------ |
| default  | 正常颜色                   | 初始状态     |
| hover    | bg: --color-bg-hover       | 鼠标悬停     |
| selected | bg: --color-bg-selected    | 当前选中值   |
| disabled | opacity: 0.5               | disabled=true |
| open     | 下拉内容可见               | 点击触发器   |

---

## 分组 (MAY)

- 分组标签: text-xs, uppercase, tracking-wider, muted color, px-8, py-2

---

## 禁止事项

- MUST NOT 硬编码颜色值
- MUST NOT 使用 any 类型
