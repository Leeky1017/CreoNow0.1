# Project Management Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-project-image-cropper

### Requirement: 项目封面图必须支持 Reposition（聚焦调整） [ADDED]

创建项目时，用户上传封面图后必须能够调整显示焦点与缩放，以避免 `object-cover` 的不可控裁剪。

#### Scenario: 上传后用户可拖拽平移与滚轮缩放 [ADDED]

- **假设** 用户已上传一张封面图
- **当** 用户拖拽图片或滚轮缩放
- **则** 系统必须实时更新预览
- **并且** 系统必须维护可持久化的裁剪参数（如 `{ x, y, zoom }`）

#### Scenario: 提交创建项目时必须包含裁剪参数 [ADDED]

- **假设** 用户完成封面图 reposition
- **当** 用户提交创建项目
- **则** 创建项目 payload 必须包含封面图文件与裁剪参数
- **并且** 后续渲染封面图时必须能复现相同焦点
