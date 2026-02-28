# 微交互与动画编排（Motion Choreography）

> Source: Notion local DB page `ce2d4592-2d52-4fa1-a273-02784f9b25a8`

> 📍

动画 Token 已定义但未被充分引用。业务层大面积使用宽泛的 transition-all，交互反馈拖沓且缺乏阻尼感。

## 现状诊断

### 已有的动画 Token

```
--duration-fast:    100ms;
--duration-normal:  200ms;   /* 待确认 */
--ease-default:     cubic-bezier(...);
```

### 核心问题

1. transition-all 泛滥

多处代码使用宽泛的 transition-all duration-300，而不是精确限制 transition-property：

- CharacterDetailDialog.tsx — transition-all

- CharacterPanel.stories.tsx — transition-all

- 大量业务组件 — 未指定具体属性

后果：

- 触发不必要的重绘（GPU 合成层过多）

- 所有属性同时过渡，动画显得"糊"而不是"脆"

- 交互反馈节奏与设计规范脱节

2. Duration 未引用 Token

虽然定义了 --duration-fast: 100ms，但业务代码直接写 duration-300、duration-200 等硬编码值。

3. 缺乏动画编排意识

当前所有动画都是"单属性过渡"，没有时差编排（Stagger）和序列编排（Sequence）的概念。

---

## 动画设计哲学

> 交互微动效的设计哲学是"克制且符合物理直觉"。

### 三条原则

1. 精确而非宽泛 — transition-colors 而非 transition-all

1. 快速而非缓慢 — IDE 交互应该是 100-200ms，不是 300-400ms

1. 有阻尼而非线性 — 使用 ease-out 或自定义 cubic-bezier，不是 linear

---

## 动画编排表（Motion Choreography Sheet）

### 微交互（100-150ms）

| 交互场景 | Duration | Easing | Property | 效果 |
| --- | --- | --- | --- | --- |
| 按钮 hover | 100ms | --ease-default | background-color, color | 背景色渐变 |
| 按钮 active | 80ms | ease-out | transform | scale(0.98) 轻微按压 |
| 链接/文字 hover | 120ms | ease-out | color | 颜色渐变 |
| Toggle 切换 | 150ms | ease-out | transform, background-color | 滑块移动 + 背景变色 |
| Checkbox 勾选 | 100ms | ease-out | transform, opacity | 勾号出现 + 轻微弹跳 |

### 面板过渡（200-300ms）

| 交互场景 | Duration | Easing | Property | 效果 |
| --- | --- | --- | --- | --- |
| 侧边栏展开/折叠 | 250ms | cubic-bezier(0.16,1,0.3,1) | width, opacity | 内容先淡出 → 宽度收缩（时差 50ms） |
| 弹窗出现 | 200ms | ease-out | transform, opacity | scale(0.98→1)  • opacity(0→1) |
| 弹窗关闭 | 150ms | ease-in | transform, opacity | scale(1→0.98)  • opacity(1→0) |
| 下拉菜单展开 | 180ms | ease-out | transform, opacity | translateY(-4px→0)  • fade-in |
| Tooltip 出现 | 150ms | ease-out | opacity | 纯 fade-in，不要位移 |

### 拖拽与编辑（即时-200ms）

| 交互场景 | Duration | Easing | Property | 效果 |
| --- | --- | --- | --- | --- |
| Block 拖拽浮起 | 150ms | ease-out | box-shadow, transform | shadow-lg  • scale(1.02) |
| Block 拖拽放下 | 200ms | cubic-bezier(0.16,1,0.3,1) | box-shadow, transform | 阴影消失 + 缩放回 1 |
| 列表项排序 | 200ms | ease-out | transform | translateY 平滑位移 |

---

## 缺失场景补充

当前页面只覆盖了“微交互 / 面板过渡 / 拖拽”三类动画，以下四类场景在写作 IDE 中同样关键但完全缺失。

### 场景 A：Loading 骨架屏（Skeleton）

> ⚠️

当前 CN 没有任何骨架屏。 文件树、人物列表、KG 面板等异步数据加载时要么空白要么只有 Spinner，用户感知是“卡死”。

| 区域 | 骨架屏形态 | 过渡方式 | 时机 |
| --- | --- | --- | --- |
| 编辑区 | 模拟文档行结构（长短不一的灭色条） | skeleton → 内容 crossfade 200ms | 文档切换时 |
| 文件树 | 模拟缩进层级的矩形块 | skeleton → 列表 stagger fade-in 50ms/item | 项目加载 / 切换时 |
| 人物列表 | 圆形头像 + 文字条 | skeleton → 卡片 stagger fade-in 30ms/item | 侧边栏展开时 |
| KG 面板 | 模拟节点 + 连线的粗略形状 | skeleton → canvas 节点渐现 | KG 数据加载时 |

实现方案：

```
// Skeleton Primitive——统一动画 Token
const Skeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      'animate-pulse rounded bg-[var(--color-bg-tertiary)]',
      className
    )}
  />
)

// 编辑区骨架屏示例
const EditorSkeleton = () => (
  <div className="space-y-3 p-6">
    <Skeleton className="h-8 w-3/4" />   {/* 标题 */}
    <Skeleton className="h-4 w-full" />   {/* 正文行 */}
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-4 w-4/6" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
  </div>
)
```

关键规则：

- 骨架屏形状必须与真实内容布局粗略匹配（不是像素级匹配）

- animate-pulse 使用 --duration-slow（300ms）的呼吸灯效果

- 加载时间 < 200ms 的场景不显示骨架屏（避免闪烁）——用 setTimeout 延迟显示

### 场景 B：错误反馈动画

> 💥

错误状态是写作 IDE 中最容易引发恐慌的场景。 保存失败、网络断开、AI 超时——动画的目标是降低焦虑，而不是增加干扰。

| 错误场景 | 反馈形式 | 动画 | 持续时间 |
| --- | --- | --- | --- |
| 保存失败 | StatusBar 红色闪烁 + “保存失败”文字 | bg-color pulse 2次 → 平静 | 保持到下次保存成功 |
| 网络断开 | TopBar 橙色 Banner 滑入 | translateY(-100% → 0) 250ms ease-out | 网络恢复后自动收起 |
| AI 请求超时 | AI Panel 内 inline 提示 + 重试按钮 | fade-in 150ms，不要抢眼 | 用户关闭或重试后消失 |
| 表单验证错误 | 输入框 shake + 红色边框 | translateX shake 300ms (0 → -4px → 4px → -2px → 0) | 错误修复后边框恢复 |
| IPC 通信失败 | 全局 Toast 从右下角滑入 | translateX(100% → 0) 200ms + 5s 后自动滑出 | 5 秒自动消失 |

Shake 动画实现：

```
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-4px); }
  40%      { transform: translateX(4px); }
  60%      { transform: translateX(-2px); }
  80%      { transform: translateX(2px); }
}
.animate-shake {
  animation: shake 300ms var(--ease-default);
}
```

### 场景 C：AI 流式输出动画

> ✨

AI 流式生成是 CN 最核心的差异化体验。 它的动画质量直接决定用户对“AI 是否智能”的感知——即使输出内容一样，流畅的打字效果会显得“更智能”。

#### 设计决策：Prompt-Response Panel，而非 Chat Bubble

> 🚨

CN 的 AI 交互不采用 ChatGPT 式的双气泡对话 UI。

CN 采用 Prompt-Response Panel 模式（参考 Cursor AI Pane / Notion AI Panel）：

|  | Chat Bubble（✘ 不采用） | Prompt-Response Panel（✔ CN 采用） |
| --- | --- | --- |
| 布局 | 左右对齐气泡，用户在右、AI 在左 | 用户输入栏在顶部/底部，AI 输出占满面板宽度 |
| 视觉隐喻 | “聊天对话”——AI 是对谈伙伴 | “调用工具”——AI 是执行器，输出是“结果”而非“回复” |
| 头像 | 有用户/AI 头像 | 无头像，无左右对齐 |
| 宽度利用 | 气泡占 60-70% 宽度，剩余空间浪费 | 输出占满 100% 面板宽度，信息密度最大化 |
| 适合场景 | 闲聊、多轮探讨 | 写作 IDE——指令式交互，用完即走 |
| 代表产品 | ChatGPT、Claude Web | Cursor AI Pane、Notion AI、Linear AI |

布局结构：

```
┌────────────────────────────────────┐
│  📝 用户输入栏（Command Bar）       │
│  “帮我改写第三段…”            [Send]  │
├────────────────────────────────────┤
│                                    │
│  AI 输出区（占满面板宽度）           │
│                                    │
│  第三段的新版本如下：             │
│                                    │
│  “夏日的光线透过百叶窗，在       │
│   地板上投下破碎的影子…”         │
│                                    │
│  [插入] [复制] [重新生成]          │
│                                    │
└────────────────────────────────────┘
```

动画含义： 因为输出区占满宽度，流式动画的视觉冲击力比气泡更强——所以动画必须更克制：不需要“打字机”的表演感，而是“结果渐现”的工具感。

当前问题： AI 输出大概率是粗暴的逐字插入 DOM，没有打字机缓冲、没有游标闪烁、没有段落级淡入。

目标体验（参考 Cursor AI Pane / Notion AI Panel）：

| 阶段 | 动画表现 | 实现要点 |
| --- | --- | --- |
| 等待中 | “✨” + 三点呼吸灯（opacity pulse） | animate-pulse 三个圆点，stagger 150ms |
| 流式输出中 | 逐字打出 + 光标闪烁 + 新段落淡入 | 16ms 帧率字符缓冲 + caret-blink 伪元素 + 段落 opacity 0→1 200ms |
| 代码块出现 | 代码块整体滑入 + 语法高亮渐现 | 先显示灰色背景块 translateY(8px→0) 200ms，然后内容流式填充 |
| 完成 | 光标消失 + “✅ Done” 淡入 | 光标 fade-out 200ms，完成标记 fade-in 150ms |

字符缓冲器实现：

```
// 流式输出缓冲器——避免逐 token 重绘，改为帧级批量插入
class StreamBuffer {
  private buffer: string[] = []
  private rafId: number | null = null

  push(chunk: string) {
    this.buffer.push(chunk)
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => this.flush())
    }
  }

  private flush() {
    const text = this.buffer.join('')
    this.buffer = []
    this.rafId = null
    // 批量插入 DOM，一帧只触发一次 reflow
    this.onFlush(text)
  }
}
```

光标闪烁 CSS：

```
@keyframes caret-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
.ai-caret::after {
  content: '▎';
  animation: caret-blink 800ms step-end infinite;
  color: var(--color-accent);
}
```

### 场景 D：路由过渡（视图切换）

> 💨

CN 的“路由”不是传统 SPA 路由，而是视图切换： 从 Dashboard → Editor、从文档 A → 文档 B、从普通模式 → Zen Mode。这些切换需要动画连接——否则用户会感觉“闪断”。

| 切换场景 | 动画类型 | 参数 | 说明 |
| --- | --- | --- | --- |
| Dashboard → Editor | Crossfade + 轻微缩放 | Dashboard opacity 1→0  • scale(1→0.98) 200ms，Editor opacity 0→1 200ms | “进入深层”的空间感 |
| Editor → Dashboard | Crossfade + 轻微放大 | 与上方相反，Dashboard scale(0.98→1) 返回 | “返回上层”的空间感 |
| 文档 A → 文档 B | 纯 Crossfade | opacity 150ms，不加位移或缩放 | 同层级切换，轻量过渡即可 |
| 普通模式 → Zen Mode | 左右栏滑出 + 编辑区居中扩展 | 侧边栏 translateX(0→-100%) 300ms + 编辑区 max-width 扩展 300ms | “屏息凝神”的仪式感 |
| Zen Mode → 普通模式 | 与上方相反 | 侧边栏滑入 + 编辑区收窄 | “回到工作台” |

实现方案（基于 React + Framer Motion 或纯 CSS）：

```
// 视图过渡 Hook
function useViewTransition() {
  const [transitioning, setTransitioning] = useState(false)

  const transitionTo = useCallback((nextView: () => void) => {
    setTransitioning(true)
    // 等待退场动画完成
    setTimeout(() => {
      nextView()
      // 入场动画自动触发
      requestAnimationFrame(() => setTransitioning(false))
    }, 200)
  }, [])

  return { transitioning, transitionTo }
}
```

---

## 改造方案

### Phase 1：替换 transition-all

批量搜索替换策略：

| 原始写法 | 替换为 | 适用场景 |
| --- | --- | --- |
| transition-all duration-300 | transition-colors duration-[var(--duration-fast)] | 纯颜色变化（hover） |
| transition-all duration-200 | transition-[transform,opacity] duration-200 | 面板出现/消失 |
| transition-all | 根据场景精确指定 property | 所有其他 |

### Phase 2：统一引用 Token

所有 duration 和 easing 引用 Token 变量：

```
/* 在 tokens.css 中补全 */
--duration-instant: 80ms;    /* 按压反馈 */
--duration-fast:    100ms;   /* 已有 */
--duration-normal:  200ms;   /* 面板过渡 */
--duration-slow:    300ms;   /* 复杂编排 */

--ease-default:  cubic-bezier(0.16, 1, 0.3, 1);  /* 已有 */
--ease-in:       cubic-bezier(0.4, 0, 1, 1);
--ease-out:      cubic-bezier(0, 0, 0.2, 1);
```

### Phase 3：在 Primitives 中内置

在 Button.tsx、Input.tsx、Select.tsx、Card、ListItem 的基础类数组中加入：

```
hover:bg-[var(--color-*)] 
transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)]
```

这些改动会立即全站全局生效。

---

## 目标清单

- [ ] 消除所有 transition-all — 替换为精确的 transition-property

- [ ] 所有 duration 引用 Token 变量 — 禁止硬编码 duration-300

- [ ] 所有 easing 引用 Token 变量 — 禁止裸写 ease-in-out

- [ ] Primitives 内置统一的过渡动画

- [ ] 面板展开/折叠加入时差编排（内容淡出 → 尺寸变化）

- [ ] 弹窗加入 scale + opacity 组合动画

- [ ] 封装 <Skeleton> Primitive + 四大区域骨架屏

- [ ] 错误反馈动画系统（StatusBar pulse / TopBar banner / Toast / shake）

- [ ] AI 流式输出动画（字符缓冲 + 光标闪烁 + 段落淡入）

- [ ] 视图切换过渡（Dashboard↔Editor / 文档切换 / Zen Mode）
