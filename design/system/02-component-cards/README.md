# 组件生成卡片

> **用途**: 每个组件的"施工图纸"，AI 生成组件时必读

---

## 卡片结构

每张卡片包含：

1. **元信息**: 优先级、依赖、文件位置
2. **变体/尺寸**: 组件的配置选项
3. **状态矩阵**: MUST 实现的所有状态
4. **边界情况**: MUST 处理的边界条件
5. **Props 接口**: TypeScript 类型定义
6. **Cursor Prompt**: 可直接使用的生成 prompt
7. **验收测试代码**: 可执行的测试用例
8. **AI 自检步骤**: 可视化验证流程

---

## 黄金标准组件 (P0)

这些组件是代码风格和质量的基准，后续组件必须参考：

| 组件   | 文件        | 用途         |
| ------ | ----------- | ------------ |
| Button | `Button.md` | 交互组件模式 |
| Input  | `Input.md`  | 表单组件模式 |
| Card   | `Card.md`   | 容器组件模式 |

---

## 原子组件 (P1)

> **状态说明**：以下组件均已在 `apps/desktop/renderer/src/components/primitives/` 中实现。
> "卡片待写"表示组件代码已存在但规格卡片尚未撰写。

| 组件     | 文件          | 状态     |
| -------- | ------------- | -------- |
| Badge    | `Badge.md`    | 卡片待写 |
| Avatar   | `Avatar.md`   | 卡片待写 |
| Icon     | `Icon.md`     | 卡片待写 |
| Spinner  | `Spinner.md`  | 卡片待写 |
| Text     | `Text.md`     | 卡片待写 |
| Heading  | `Heading.md`  | 卡片待写 |
| Skeleton | `Skeleton.md` | 卡片待写 |
| Checkbox | `Checkbox.md` | 卡片待写 |
| Select   | `Select.md`   | 卡片待写 |
| Textarea | `Textarea.md` | 卡片待写 |

---

## 使用流程

```
1. AI 读取组件卡片
2. AI 读取黄金标准代码（如有）
3. AI 生成组件代码 + Story
4. AI 运行验收测试
5. AI 可视化自检（Storybook + MCP）
6. 用户人工验收
7. 修改并循环，直到满意
```

---

## 创建新卡片

复制现有卡片模板，填写：

```markdown
# [组件名] 组件生成卡片

## 元信息

- 优先级: P0/P1/P2
- 依赖: 列出依赖的其他组件
- 文件位置: components/primitives/[组件名]/
- 设计参考: 对应的设计稿

## 变体/尺寸

[列出所有变体和尺寸选项]

## 状态矩阵 (MUST 全部实现)

[列出所有状态及其视觉表现]

## 边界情况 (MUST 处理)

[列出所有边界条件及处理方式]

## Props 接口

[TypeScript 类型定义]

## Cursor Prompt

[可直接复制的生成 prompt]

## 验收测试代码

[可执行的测试代码]

## AI 自检步骤

[可视化验证步骤]
```
