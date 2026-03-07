# CreoNow Windows 首发就绪度与 WSL 本地运行补充


> "工欲善其事，必先利其器。"——Win 首发不是一句“我们优先做 Windows”就能自动成立的，它既包括产品本身能不能用，也包括安装、升级、崩溃、备份、签名、调试环境这些用户看不见、却会决定首发口碑的地基。

---

## 文件索引

| § | 章节 | 内容 |
|---|------|------|
| 一 | 为什么单列此文 | 为什么这不是现有体验/工程文档里的附注 |
| 二 | WSL 本地运行判断 | Linux 图形库到底要不要补 |
| 三 | 当前 Windows 首发缺口 | 仓库里尚未闭环的发布准备 |
| 四 | 新增应补问题 | 这轮额外发现的几个重要盲区 |
| 五 | 数据安全与本地存储 | 创作内容在 Windows 上的安全边界 |
| 六 | 行动建议 | 按优先级收口的做法 |

---

## 一、为什么单列此文

前面的 `01-05` 文件已经把产品体验、工程风险、护城河和执行总表收了进来，但它们主要回答的是：

- 产品怎么更好用
- 工程怎么更稳
- 护城河怎么显化

而 **Windows 首发就绪度** 回答的是另一类问题：

- 用户下载到的安装包是否可信
- Windows 上的键盘、原生窗口、升级路径是否稳定
- 崩溃后我们能不能知道为什么崩
- “备份”“更新”这些对外承诺到底是不是真能力

这组问题与“体验设计”相关，但不等于“体验设计”；与“工程质量”相关，但不等于“架构债”。因此单独成卷更清楚。

---

## 二、WSL 本地运行判断

### 2.1 结论

如果你想在这台 `WSL` 里直接运行 CN 桌面端，**补 Linux 图形依赖是值得的**。

原因：

- 当前环境已存在图形通道：`DISPLAY=:0`、`WAYLAND_DISPLAY=wayland-0`
- 这说明 `WSLg` 路是通的，不是纯终端环境
- 之前 `Playwright` 已成功下载浏览器，但宿主 Linux 图形库缺失

### 2.2 这件事会不会影响 Win 首发？

不会。

它的性质是：

- **对仓库**：零语义影响，不改业务逻辑
- **对 Win 版产品**：零发行影响
- **对你本机开发**：有帮助，能让 WSL 本地运行 Electron / Playwright 更顺

换言之，它是**开发机补地基**，不是**产品方向偏航**。

### 2.3 当前可执行命令

我已经把 Playwright 官方给出的依赖安装命令完整拉出来了。由于系统安装需要 `sudo` 密码，我这边无法替你完成最后一步提权，但命令已经准确收口：

```bash
sudo -- sh -c "apt-get update&& apt-get install -y --no-install-recommends libasound2t64 libatk-bridge2.0-0t64 libatk1.0-0t64 libatspi2.0-0t64 libcairo2 libcups2t64 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0t64 libnspr4 libnss3 libpango-1.0-0 libx11-6 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxkbcommon0 libxrandr2 libcairo-gobject2 libfontconfig1 libfreetype6 libgdk-pixbuf-2.0-0 libgtk-3-0t64 libpangocairo-1.0-0 libx11-xcb1 libxcb-shm0 libxcursor1 libxi6 libxrender1 gstreamer1.0-libav gstreamer1.0-plugins-bad gstreamer1.0-plugins-base gstreamer1.0-plugins-good libicu74 libatomic1 libenchant-2-2 libepoxy0 libevent-2.1-7t64 libflite1 libgles2 libgstreamer-gl1.0-0 libgstreamer-plugins-bad1.0-0 libgstreamer-plugins-base1.0-0 libgstreamer1.0-0 libgtk-4-1 libharfbuzz-icu0 libharfbuzz0b libhyphen0 libjpeg-turbo8 liblcms2-2 libmanette-0.2-0 libopus0 libpng16-16t64 libsecret-1-0 libvpx9 libwayland-client0 libwayland-egl1 libwayland-server0 libwebp7 libwebpdemux2 libwoff1 libxml2 libxslt1.1 libx264-164 libavif16 xvfb fonts-noto-color-emoji fonts-unifont xfonts-cyrillic xfonts-scalable fonts-liberation fonts-ipafont-gothic fonts-wqy-zenhei fonts-tlwg-loma-otf fonts-freefont-ttf"
```

### 2.4 判断标准

对你当前目标而言：

- **如果只做 Win 构建与 Win 发行**：这一步不属于首波先做项。
- **如果想在 WSL 里本地运行桌面端/跑 Playwright**：建议补。

---

## 三、当前 Windows 首发缺口

### 3.1 打包有了，分发闭环还没有

`electron-builder.json` 当前仅定义：

- `nsis`
- `zip`
- `x64`

但还没有看到这些内容：

- `publish` provider
- 自动更新通道
- 代码签名策略
- 证书/SmartScreen 处理方案

这意味着目前更像：

> “能打出 Windows 安装包”

而不是：

> “已经具备 Windows 首发分发闭环”

### 3.2 Auto-update 尚未成形

此前 Amp 线程已指出：仓库里没有功能性的 `autoUpdater` / `electron-updater` 机制。

影响：

- 首发后每次发版都更依赖手动分发
- 无法给用户稳定的升级体验
- 没有升级失败/回滚的应用级策略

这不属于首波先做项，但它必须被明确写进发布策略，而不是默默缺席。

### 3.3 Windows 键盘稳定性已有预警信号

`command-palette.spec.ts` 已明确写着：

- Windows CI 下键盘事件时序不稳定
- 某条键盘导航 E2E 被 `test.skip`

这不是“测试工具小脾气”这么简单，它说明：

- Windows 输入层至少有一块尚未被完全咬实
- 对“IDE 类产品”来说，键盘链路比普通应用更关键

如果 Win 是首发主战场，这类问题不能只留在 TODO 注释里。

### 3.4 原生模块打包风险需要持续盯防

仓库历史里已经出现过与桌面原生 binding 打包相关的修复痕迹。对 Electron 应用而言，这类问题有一个典型特点：

- 本地 dev 正常
- CI 构建通过
- 真正安装后才 crash

所以 Win 首发不能只看 `build:win` 成功，还必须有**安装后冒烟**。

---

## 四、新增应补问题

这几项在此前 `amp` 路线图里提得还不够，值得正式补进去。

### 4.1 “Backup Interval” 看起来像 UI 已先行，能力未闭环

我沿着 `backupInterval` 往下查，当前只明确看到：

- 设置页有 `backupInterval` 选项
- 中英文文案里有“上次备份：2 分钟前 / Last backup: 2 minutes ago”

但没有看到与之对应的：

- 真实备份任务调度
- 备份写盘服务
- 备份恢复入口
- 最近备份时间的真实来源

这就意味着它很可能还是“**像功能的界面**”，而不是“**闭环的功能**”。

如果判断属实，这一点必须和导出一样处理：

- 要么尽快补真
- 要么在 v0.1 把它降格为占位，不要让用户误以为已有可靠备份

### 4.2 崩溃展示有了，但崩溃可观测性还不够

当前可以看到：

- 主进程有 `globalExceptionHandlers`
- 前端有 ErrorBoundary 文案，出现 `"App crashed"`

但同时也能看到：

- renderer `fireAndForget.ts` 里明确写着 `TODO(C9): wire to central telemetry once available`

这说明现状更像：

- **能告诉用户“崩了”**
- 但未必能系统性告诉开发者“为什么崩、在谁机器上崩、发生前做了什么”

对 Win 首发来说，这会直接影响冷启动阶段的问题定位速度。

### 4.3 Win 首发还缺“用户安装后的真实路径”视角

目前路线图更偏“代码内部怎么改”，但对首发还应补三种外部视角：

1. 用户第一次安装时会看到什么
2. 用户升级安装时旧数据如何迁移
3. 用户遇到崩溃/损坏/更新失败时如何恢复

这些不是锦上添花，而是桌面产品与 Web 产品的本质差别。

### 4.4 WSL 与 Windows 的开发/验证分叉也需要记账

你当前在 WSL 里开发，但目标是 Win 首发。这带来一个天然风险：

- 你本地能跑，不代表 Windows 上键盘/窗口/路径/原生模块都稳

因此要补一条明确原则：

> WSL 负责开发效率，Windows 负责最终真相。

---

## 五、数据安全与本地存储

### 5.1 当前存储格式

CN 的创作内容在 Windows 上以以下形式存在：

| 数据类型 | 存储位置 | 格式 | 加密 |
|----------|----------|------|------|
| 项目文件 | 用户选择的目录 | JSON / Markdown 明文 | 无 |
| KG（知识图谱） | 应用数据目录 | 本地文件 | 无 |
| Memory（向量库） | 应用数据目录 | 嵌入文件 | 无 |
| 敏感凭证（API Key） | 系统凭证存储 | `safeStorage` 加密 | 有 |
| 编辑器临时缓存 | `.vite-temp` 等 | 临时文件 | 无 |

### 5.2 风险分析

对 Windows 桌面产品而言，本地文件安全的风险维度：

1. **其他进程读取**：任何拥有同等用户权限的进程都可以直接读取创作内容。
2. **恶意软件/间谍软件**：对写作者而言，未出版手稿是高价值目标。
3. **多用户环境**：共享电脑上的其他账户（管理员权限）可能访问数据。
4. **设备丢失/失窃**：若未启用 BitLocker，硬盘内容可被直接读取。

### 5.3 v0.1 处理建议

- **最低要求**：在发布事实表中诚实声明“创作内容以明文形式存储在本地文件系统，安全性取决于操作系统级保护（如 BitLocker）”。
- **推荐追加**：在设置页增加“数据存储说明”入口，简明解释哪些数据存在哪里。
- **不应做的**：不要在文档或营销材料中暗示有端到端加密或云级安全保护。

### 5.4 后续演进

| 阶段 | 能力 | 价值 |
|------|------|------|
| v0.2 | 评估 SQLCipher / 加密 FS 对 KG + Memory 的可行性 | 保护结构化创作数据 |
| v0.3 | 用户可选“工作区加密”选项 | 满足安全敏感用户需求 |
| 长期 | 备份加密 + 恢复密钥管理 | 完整本地安全闭环 |

---

## 六、行动建议

### 6.1 现在就该做

1. 把本文件纳入 `amp` 专题索引与主路线图，作为独立主题存在。
2. 在 backlog 中加入 Windows 首发专项任务：
   - 签名/分发策略
   - Windows 键盘链路专项回归
   - 安装后冒烟
   - 崩溃可观测性
   - 备份能力真伪核查
   - 数据安全边界声明
3. 若你要在 `WSL` 本地跑桌面端，就补 Linux 图形依赖；这一步只影响本机，不影响 Win 首发路线。

### 6.2 v0.1 前至少要讲清楚

- PDF/DOCX 是否 Beta
- 备份是否真实可用
- 是否暂不提供自动更新
- Windows 安装包是否已签名
- 创作内容以明文存储，安全性取决于 OS 级保护

### 6.3 v0.1 后紧跟

- auto-update
- crash telemetry
- backup engine / restore UX
- Windows 安装升级/降级与数据迁移策略
- KG / Memory 存储加密评估

---

> 总结成一句话：**CN 现在更像“具备 Windows 打包能力”，还不是“完成 Windows 首发准备”。**  
> 这不是坏消息，因为大部分缺口都不是推倒重来，而是把那些桌面产品迟早要补的“发布底座”正式纳入路线图，不再让它们散落在 TODO、注释和默认假设里。
