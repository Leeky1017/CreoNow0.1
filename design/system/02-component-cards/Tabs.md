# Tabs 组件生成卡片

## 元信息

- **优先级**: P0
- **依赖**: Radix UI Tabs
- **文件位置**: `components/primitives/Tabs/`
- **设计参考**: `20-memory-panel.html`, `34-component-primitives.html`

---

## Tab 列表容器

| 属性   | 值                     |
| ------ | ---------------------- |
| 布局   | flex                   |
| 底边   | 1px --color-separator  |
| gap    | 0（紧密排列）          |

---

## 单个 Tab

| 属性       | 值                       |
| ---------- | ------------------------ |
| 高度       | 36px                     |
| padding    | 0 16px                   |
| 字号       | 13px                     |
| 字重       | 400 (默认), 500 (激活)    |
| 颜色       | --color-fg-muted (默认)   |
| 底边       | 2px transparent (默认)    |

---

## 状态矩阵 (MUST 全部实现)

| 状态          | 视觉表现                              | 触发方式     |
| ------------- | ------------------------------------- | ------------ |
| default       | muted 文字, transparent 底边           | 初始状态     |
| hover         | default 文字色                        | 鼠标悬停     |
| active        | default 文字, weight:500, accent 底边  | 当前选中     |
| focus-visible | focus ring                            | Tab 键聚焦   |
| disabled      | opacity: 0.4, cursor: not-allowed     | disabled=true |

---

## 滑动指示器 (SHOULD)

- 底部 2px accent 色条
- 切换时滑动过渡: `transform: translateX(...)`, `var(--duration-normal)`

---

## 禁止事项

- MUST NOT 硬编码颜色值
- MUST NOT 使用 any 类型
- MUST NOT 在 Tab 内使用裸字符串（走 i18n）
