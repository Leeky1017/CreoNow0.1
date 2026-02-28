# Electron 性能优化

> Source: Notion local DB page `0ee298a2-1b4f-46db-b29b-b0bc404ec3c5`

> 📍

Electron 性能优化是 CN 长期竞争力的基础。 写作 IDE 的核心体验指标是"输入延迟"和"启动速度"。

## 性能目标

| 指标 | 目标值 | 参考 |
| --- | --- | --- |
| 冷启动到可交互 | < 2s | Cursor ~1.5s |
| 输入延迟（keystroke latency） | < 16ms（1 帧） | Notion ~10ms |
| 面板切换响应 | < 100ms | Linear ~50ms |
| 大文档（>10万字）滚动 | 60fps 无掉帧 | — |
| 内存占用（空项目） | < 200MB | VS Code ~180MB |

---

## 启动性能

### 优化方向

1. Renderer 预加载

- 利用 Electron 的 BrowserWindow 预创建机制，在主窗口显示前完成 React 树的首次渲染

- Vite 的 Code Splitting 确保首屏只加载必要模块

2. 懒加载非核心模块

- KnowledgeGraph、VersionHistoryPanel、ExportDialog 等重量级组件使用 React.lazy() + Suspense

- 只在用户实际打开对应面板时才加载

3. Store 初始化优化

- 12 个 Store 不需要在启动时全部初始化

- kgStore、versionStore、searchStore 等可延迟到首次使用时初始化

---

## 渲染性能

### 1. 减少不必要的重渲染

AppShell 拆分（已在渲染架构页详述）是最大的单次优化。 当前任何 Store 变更都会触发 AppShell 级联重渲染。

Zustand selector 精细化：

```
// ❌ 当前：订阅整个 store，任何字段变化都重渲染
const store = useLayoutStore()

// ✅ 改为：只订阅需要的字段
const sidebarWidth = useLayoutStore(s => s.sidebarWidth)
```

### 2. 虚拟化长列表

- 文件树（FileTreePanel）— 项目文件过多时需要虚拟滚动

- 搜索结果（SearchPanel）— 大量匹配结果

- 版本历史列表 — 可能非常长

推荐使用 @tanstack/react-virtual 或 react-window。

### 3. 编辑器性能

TipTap / ProseMirror 的性能关键点：

- 大文档渲染 — 考虑 ProseMirror 的分片渲染（只渲染可见区域）

- 装饰器（Decorations）性能 — AI 补全提示、语法高亮等装饰器数量不要失控

- Transaction 合并 — 批量更新时合并 ProseMirror transactions

---

## 内存管理

### Electron 特有的内存问题

1. 渲染进程泄漏 — React 组件卸载时未清理的事件监听、定时器、IPC 监听

1. 主进程泄漏 — 文件 watcher、数据库连接未释放

1. 大文件缓存 — 知识图谱数据、版本历史快照可能占用大量内存

### 优化策略

- 组件卸载时严格清理副作用（useEffect cleanup）

- IPC 监听使用 removeListener / removeAllListeners

- 大数据采用 LRU 缓存策略，控制内存上限

- 使用 Chrome DevTools Memory 面板定期检查 heap snapshot

---

## 监控与度量

### Baseline 数据采集方案

> ⚠️

没有 Baseline 就没有优化。 当前 CN 没有任何性能数据，所有目标值都是“拍脑袋”。第一步是采集真实数据，然后才能定义有意义的目标。

Phase 0：内置轻量级性能探针（立即可做，不依赖任何改造）

```
// === perf-probe.ts —— 全局性能探针，约 50 行代码 ===

// 1. 启动时间
performance.mark('app-start')
// main.tsx 中 React root 挂载完成后：
performance.mark('app-interactive')
performance.measure('startup', 'app-start', 'app-interactive')

// 2. 输入延迟（TipTap onTransaction 回调）
let lastKeystroke = 0
editor.on('beforeTransaction', () => { lastKeystroke = performance.now() })
editor.on('transaction', () => {
  const latency = performance.now() - lastKeystroke
  perfLog.push({ type: 'keystroke', latency, ts: Date.now() })
})

// 3. 面板切换响应（包裹 Zustand action）
function measureAction(name: string, fn: () => void) {
  const t0 = performance.now()
  fn()
  requestAnimationFrame(() => {
    const duration = performance.now() - t0
    perfLog.push({ type: 'action', name, duration, ts: Date.now() })
  })
}

// 4. 内存快照（每 60s 采集一次）
setInterval(() => {
  const mem = performance.memory // Chromium 特有
  perfLog.push({
    type: 'memory',
    usedHeap: mem?.usedJSHeapSize,
    totalHeap: mem?.totalJSHeapSize,
    ts: Date.now()
  })
}, 60_000)

// 5. 导出（开发模式下 console.table，发布前可写入本地文件）
window.__CN_PERF_DUMP__ = () => console.table(perfLog)
```

采集的 Baseline 指标：

| 指标 | 采集方式 | 采集场景 | 预期用途 |
| --- | --- | --- | --- |
| Cold Start Time | performance.measure | 关闭应用后重新打开 | 确定启动优化的真实基线 |
| Warm Start Time | performance.measure | Tab 切换回来 | 区分冷/热启动的优化策略 |
| Keystroke Latency (p50/p95/p99) | TipTap transaction 回调 | 空文档 / 1万字 / 10万字 | 输入延迟是否随文档大小增长 |
| Panel Switch Duration | Zustand action wrapper | 侧边栏切换、AI 面板开关 | 定位最慢的面板切换 |
| JS Heap Used | performance.memory | 启动后 / 30min 使用后 / 2h 使用后 | 检测内存泄漏趋势 |
| FPS (scroll) | requestAnimationFrame 帧率计算 | 大文档快速滚动 | 滚动性能是否达标 |

采集节奏：

1. 立即：加入 perf-probe.ts，采集 3 天日常使用数据

1. 第 1 周：汇总数据，确定各指标的 p50/p95/p99 作为 Baseline

1. 后续：每次改造前后对比，量化收益

---

## Bundle 分析

> 📦

Bundle 大小直接影响启动速度。 Electron 虽然不走网络，但 V8 仍然需要解析和编译 JS——bundle 越大，启动越慢。

### 分析工具链

```
# 1. Vite 内置可视化（推荐首选）
npx vite build --mode production
npx vite-bundle-visualizer

# 2. rollup-plugin-visualizer（更详细的 treemap）
# vite.config.ts 中添加：
import { visualizer } from 'rollup-plugin-visualizer'
plugins: [visualizer({ open: true, gzipSize: true })]

# 3. source-map-explorer（精确到模块级）
npx source-map-explorer dist/assets/*.js
```

### 需要关注的大依赖

| 依赖 | 预估大小 | 是否可 Tree-shake | 优化策略 |
| --- | --- | --- | --- |
| ProseMirror + TipTap | ~200-300KB (gzip) | 部分可 | 检查未使用的 TipTap extensions，删减 |
| Radix UI | ~50-80KB (gzip) | ✅ 模块化良好 | 确认只 import 实际使用的组件 |
| Zustand | ~2KB (gzip) | ✅ | 无需优化 |
| Tailwind CSS | 取决于用量 | ✅ PurgeCSS | 确保生产构建开启 purge |
| KnowledgeGraph 相关 | 可能很大（D3/Canvas） | 部分 | 必须懒加载，不进主 bundle |
| 其他工具库（lodash/date-fns 等） | 不确定 | 视导入方式 | 检查是否有整包导入（import _ from 'lodash'） |

### Code Splitting 策略

```
// vite.config.ts —— 建议的 chunk 分割策略
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        // 核心框架（始终加载）
        'vendor-react': ['react', 'react-dom'],
        'vendor-editor': ['@tiptap/core', '@tiptap/react', 'prosemirror-*'],
        'vendor-ui': ['@radix-ui/*'],

        // 懒加载 chunk（用户触发时才加载）
        // KnowledgeGraph、ExportDialog、VersionHistory 等
        // 通过 React.lazy() 自动分割
      }
    }
  }
}
```

### Bundle 健康检查清单

- [ ] 运行 vite-bundle-visualizer，获取当前总 bundle 大小

- [ ] 识别 Top 5 最大依赖，评估是否有替代方案或懒加载可能

- [ ] 检查是否存在整包导入（import X from 'lib' 而非 import { x } from 'lib'）

- [ ] 确认 KnowledgeGraph / VersionHistory / ExportDialog 已被懒加载

- [ ] 确认生产构建是否移除了 dev-only 代码（Storybook、测试工具等）

- [ ] 检查 CSS 产出大小，Tailwind purge 是否生效

---

## 持续监控

### 发版前检查流程

| 检查项 | 工具 | 通过标准 |
| --- | --- | --- |
| Bundle 大小变化 | vite-bundle-visualizer diff | 总体增量 ≤ 5%，或有明确理由 |
| Cold Start Time | perf-probe.ts | 不超过 Baseline p95 的 110% |
| Keystroke Latency | perf-probe.ts + 10万字测试文档 | p99 < 16ms |
| 内存泄漏 | Chrome DevTools heap snapshot | 2h 使用后 heap 增量 < 20% |
| Lighthouse 审计 | Electron 内置 DevTools | Performance score ≥ 90 |

### 回归测试场景

1. 空项目启动 — 冷启动时间

1. 大文档打开 — 10万字 Markdown 文件的打开时间 + 首屏渲染

1. 大文档编辑 — 10万字文档中连续输入 30s 的平均延迟

1. 多面板 — 同时打开编辑器 + AI 面板 + 文件树 + 搜索的内存占用

1. 长时间使用 — 2h 使用后的内存趋势曲线
