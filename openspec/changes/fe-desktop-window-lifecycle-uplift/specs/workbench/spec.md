# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-desktop-window-lifecycle-uplift

### Requirement: 桌面窗口状态必须持久化且应用必须为单实例 [ADDED]

#### Scenario: 重启后必须恢复窗口位置与尺寸 [ADDED]

- **假设** 用户调整了窗口位置与尺寸
- **当** 用户关闭并重新启动应用
- **则** 系统必须恢复上次的窗口位置与尺寸

#### Scenario: 第二实例启动必须聚焦已存在窗口 [ADDED]

- **假设** 应用已在运行
- **当** 用户再次启动应用
- **则** 系统不得创建第二个实例窗口
- **并且** 必须聚焦已有窗口
