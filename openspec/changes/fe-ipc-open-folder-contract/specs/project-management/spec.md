# Project Management Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-ipc-open-folder-contract

### Requirement: 文件夹即工作区（Open Folder 语义） [ADDED]

- 当用户选择一个文件夹并打开时，该文件夹即被视为工作区。
- 系统不得强制创建“项目”中间层才能进入编辑。

#### Scenario: 打开文件夹后必须进入该工作区 [ADDED]

- **假设** 用户通过 open-folder IPC 选择了一个目录
- **当** 系统完成打开流程
- **则** Workbench 必须切换到该工作区并展示其文件树
- **并且** 若目录下存在 `.creonow/` 元目录，系统应识别并加载其元数据（若可用）
