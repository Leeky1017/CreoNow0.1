# Workbench Specification Delta

更新时间：2026-02-22 11:36

## Change: issue-606-phase-2-shell-decomposition

### Requirement: AppShell 拆分为 Workbench Shell 三层职责 [ADDED]

系统必须将当前 `AppShell` 拆分为 `LayoutShell`、`NavigationController`、`PanelOrchestrator` 三个职责边界清晰的壳层组件。

- `LayoutShell` 只负责布局骨架与区域插槽，不承载业务域编排。
- `NavigationController` 负责导航/路由/快捷键驱动的可见性切换，不负责尺寸分配。
- `PanelOrchestrator` 负责面板可见性、折叠状态、宽度约束与主编辑区保护。

#### Scenario: WB-P2-S1 LayoutShell 只承载布局骨架 [ADDED]

- **假设** Workbench 启动并渲染主界面
- **当** `LayoutShell` 组装 Topbar、LeftActivityBar、MainEditor、RightPanel、BottomStatusBar
- **则** `LayoutShell` 只输出布局结构与 slot
- **并且** 不直接发起业务 IPC 调用

#### Scenario: WB-P2-S2 NavigationController 仅负责导航切换 [ADDED]

- **假设** 用户触发面板切换快捷键（如侧边栏开关）
- **当** `NavigationController` 处理该输入
- **则** 仅更新面板路由与显示状态
- **并且** 不直接改写面板宽度或编辑区尺寸分配

### Requirement: 视口分配权限由 Shell 独占 [ADDED]

Workbench 必须将 viewport 分配权限收敛到 Shell 层，Feature 组件不得接管整屏尺寸。

- 非 Shell 组件禁止使用 `h-screen`、`w-screen`（以及等价整屏接管写法）。
- Feature 组件仅允许消费 `flex-1`、`size-full` 或 Shell 注入的容器尺寸。
- Shell 层负责统一控制滚动容器和可用空间，不允许子模块绕过。

#### Scenario: WB-P2-S3 非 Shell 组件使用 h-screen/w-screen 被阻断 [ADDED]

- **假设** 某 Feature 组件新增 `h-screen` 或 `w-screen`
- **当** 运行 renderer 静态治理规则
- **则** 产生阻断级 violation
- **并且** CI/本地门禁拒绝该改动进入主线

#### Scenario: WB-P2-S4 Feature 组件按 Shell 注入尺寸渲染 [ADDED]

- **假设** Shell 已分配主区域可用空间
- **当** Feature 面板组件渲染
- **则** 组件仅在容器内自适应（如 `flex-1` / `size-full`）
- **并且** 不自行声明整屏高度或整屏宽度

### Requirement: PanelOrchestrator 统一面板编排与编辑区保护 [ADDED]

`PanelOrchestrator` 必须作为唯一的面板编排入口，统一处理空间分配并保护编辑区稳定性。

- 统一管理左/右面板可见性、折叠状态、宽度上下限。
- 面板展开/折叠与宽度变更不得将主编辑区压缩到最小可用阈值以下。
- 面板业务组件不得绕过编排器直接改写全局布局分配。

#### Scenario: WB-P2-S5 PanelOrchestrator 统一处理面板展开与宽度约束 [ADDED]

- **假设** 用户连续执行“展开右侧面板 -> 调宽侧栏 -> 折叠左侧面板”
- **当** `PanelOrchestrator` 计算并应用布局结果
- **则** 面板状态与宽度按统一规则收敛
- **并且** 主编辑区保持可写作的最小可用空间

#### Scenario: WB-P2-S6 面板业务组件不得绕过编排器改写全局布局 [ADDED]

- **假设** 业务面板组件尝试直接修改全局布局尺寸状态
- **当** 组件未通过 `PanelOrchestrator` 暴露的受控接口发起变更
- **则** 该变更路径被拒绝或不生效
- **并且** 布局状态仍由编排器统一维护
