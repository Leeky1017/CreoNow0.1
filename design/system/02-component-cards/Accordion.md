# Accordion 组件生成卡片

## 元信息

- **优先级**: P1
- **依赖**: Radix UI Accordion
- **文件位置**: `components/primitives/Accordion/`
- **设计参考**: `10-settings.html`, `34-component-primitives.html`

---

## 触发器规格

| 属性    | 值                    |
| ------- | --------------------- |
| 布局    | flex, space-between   |
| 宽度    | 100%                  |
| 高度    | 40px                  |
| padding | 0 12px                |
| 字号    | 13px                  |
| 字重    | 500                   |
| 颜色    | --color-fg-default    |
| 圆角    | --radius-sm           |

---

## 展开图标

| 属性   | 值                              |
| ------ | ------------------------------- |
| 图标   | ChevronDown (lucide-react)      |
| 大小   | 16px                            |
| 展开   | rotate(180°), --duration-normal |

---

## 内容区

| 属性    | 值                                        |
| ------- | ----------------------------------------- |
| padding | 12px                                      |
| 动效    | grid-template-rows: 0fr → 1fr             |
| 时长    | var(--duration-slow)                       |

---

## 状态矩阵 (MUST 全部实现)

| 状态          | 视觉表现                    | 触发方式      |
| ------------- | --------------------------- | ------------- |
| collapsed     | 内容隐藏, 箭头向下          | 默认          |
| expanding     | 高度渐增动画                | 点击触发器    |
| expanded      | 内容可见, 箭头向上          | 展开后        |
| collapsing    | 高度渐减动画                | 再次点击      |
| hover         | 触发器背景: --color-bg-hover | 鼠标悬停      |

---

## 边界情况

| 边界          | 处理方式                     |
| ------------- | ---------------------------- |
| 内容过长      | 正常溢出（不限制高度）        |
| 嵌套 Accordion | 缩进 + 不同层级样式         |
| 多项同时展开   | 支持 type="multiple"        |

---

## 禁止事项

- MUST NOT 直接动画 height 属性
- MUST NOT 硬编码颜色值
- MUST NOT 使用 any 类型
