# Toggle 组件生成卡片

## 元信息

- **优先级**: P0
- **依赖**: Radix UI Switch (Toggle), Radix UI Checkbox, Radix UI RadioGroup
- **文件位置**: `components/primitives/Toggle/`, `Checkbox/`, `RadioGroup/`
- **设计参考**: `10-settings.html`, `34-component-primitives.html`

---

## Toggle Switch

### 轨道

| 属性   | 值                         |
| ------ | -------------------------- |
| 宽度   | 36px                       |
| 高度   | 20px                       |
| 圆角   | --radius-full              |
| 背景   | --color-bg-hover (Off)     |
| 背景   | --color-accent (On)        |
| 边框   | 1px --color-border-default |

### 滑块

| 属性   | 值                    |
| ------ | --------------------- |
| 宽度   | 16px                  |
| 高度   | 16px                  |
| 圆角   | --radius-full         |
| 颜色   | --color-fg-muted (Off), --color-fg-inverse (On) |
| 位移   | translateX(0) (Off), translateX(16px) (On)       |

---

## Checkbox

| 属性   | 值                         |
| ------ | -------------------------- |
| 宽度   | 16px                       |
| 高度   | 16px                       |
| 圆角   | --radius-sm (4px)          |
| 边框   | 1px --color-border-default |
| 选中   | bg: --color-accent, Check 图标 (白, 12px) |
| 动效   | scale(0.9→1) 弹性反馈      |

---

## Radio

| 属性     | 值                         |
| -------- | -------------------------- |
| 宽度     | 16px                       |
| 高度     | 16px                       |
| 圆角     | --radius-full              |
| 边框     | 2px --color-border-default |
| 选中边框 | --color-accent             |
| 选中标记 | 8px 实心圆 --color-accent  |

---

## 状态矩阵 (MUST 全部实现, 通用)

| 状态          | 视觉表现                    | 触发方式      |
| ------------- | --------------------------- | ------------- |
| default       | 正常颜色                    | 初始状态      |
| hover         | 边框色加亮                  | 鼠标悬停      |
| checked       | accent 背景/边框 + 标记     | 用户切换      |
| focus-visible | focus ring                  | Tab 键聚焦    |
| disabled      | opacity: 0.5                | disabled=true |

---

## 禁止事项

- MUST NOT 硬编码颜色值
- MUST NOT 使用 any 类型
