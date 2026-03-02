## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：为项目封面图提供拖拽平移 + 滚轮缩放裁剪能力，输出可持久化 crop 参数。不做滤镜/旋转/多裁剪比例。
- [ ] 1.2 审阅并确认错误路径与边界路径：取消编辑恢复原状；无图片时不显示裁剪区；zoom 限制在合理范围（1x-3x）。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：提交 payload 必须包含 `cropArea: { x, y, zoom }`；现有 `ImageUpload` API 不破坏。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/renderer/src/components/primitives/ImageUpload.tsx`
  - 保持现有 API 不变，ImageCropper 作为增强包装
- 新增 `apps/desktop/renderer/src/components/composites/ImageCropper.tsx`：
  - Props：`file: File | null`、`onCropChange: (crop: CropArea) => void`、`aspectRatio?`
  - 内部状态：`{ x, y, zoom }` — 拖拽更新 x/y，滚轮更新 zoom
  - 渲染：overflow-hidden 容器 + transform 定位图片
  - 输出：`CropArea = { x: number, y: number, zoom: number }`
- `apps/desktop/renderer/src/features/projects/CreateProjectDialog.tsx`
  - L83：`coverImage` state → 扩展为 `{ file, cropArea }` 或新增 `cropArea` state
  - L288：`<ImageUpload>` → 包裹 `<ImageCropper>` 或替换为 `<ImageCropper>` + `<ImageUpload>` 组合
  - L148：`coverImage` 提交 → 附带 `cropArea` 参数

**为什么是这些触点**：CreateProjectDialog 是唯一的封面图上传入口，ImageCropper 作为 Composite 独立于 Primitive。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `PM-FE-CROP-S1` | `apps/desktop/renderer/src/components/composites/ImageCropper.test.tsx` | `it('updates crop position on drag')` | 模拟 pointerdown+pointermove，断言 onCropChange 被调用且 x/y 变化 | 无 | `pnpm -C apps/desktop test:run components/composites/ImageCropper` |
| `PM-FE-CROP-S1b` | 同上 | `it('updates zoom on wheel event')` | 模拟 wheel 事件，断言 onCropChange 的 zoom 值变化 | 无 | 同上 |
| `PM-FE-CROP-S1c` | 同上 | `it('clamps zoom within 1x-3x range')` | 极端 wheel 值，断言 zoom 不超出范围 | 无 | 同上 |
| `PM-FE-CROP-S2` | `apps/desktop/renderer/src/features/projects/CreateProjectDialog.cropper.test.tsx` | `it('submits cover with crop metadata')` | 渲染 CreateProjectDialog，上传图片，提交，断言 onSubmit payload 含 cropArea | mock onSubmit | `pnpm -C apps/desktop test:run features/projects/CreateProjectDialog.cropper` |
| `PM-FE-CROP-S2b` | 同上 | `it('does not show cropper when no image selected')` | 无图片时断言 ImageCropper 不渲染 | 无 | 同上 |

### 可复用测试范本

- ImageUpload 测试：`apps/desktop/renderer/src/components/primitives/ImageUpload.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `PM-FE-CROP-S1`：import `ImageCropper`，渲染带 file，模拟 drag，断言 onCropChange 的 x/y 变化。
  - 期望红灯原因：`composites/ImageCropper.tsx` 不存在。
- [ ] 3.2 `PM-FE-CROP-S1b`：模拟 wheel 事件，断言 zoom 变化。
  - 期望红灯原因：同上。
- [ ] 3.3 `PM-FE-CROP-S1c`：极端 wheel 值，断言 zoom 被 clamp 到 1x-3x。
  - 期望红灯原因：同上。
- [ ] 3.4 `PM-FE-CROP-S2`：渲染 CreateProjectDialog，上传图片并提交，断言 payload 含 cropArea。
  - 期望红灯原因：当前提交 payload 仅含 `coverImage: File`，无 cropArea。
- [ ] 3.5 `PM-FE-CROP-S2b`：无图片时断言 ImageCropper 不渲染。
  - 期望红灯原因：当前无 ImageCropper 组件。
- 运行：`pnpm -C apps/desktop test:run components/composites/ImageCropper` / `features/projects/CreateProjectDialog.cropper`

## 4. Green（最小实现通过）

- [ ] 4.1 新增 `ImageCropper.tsx`：
  - overflow-hidden 容器 + img transform(translate + scale)
  - pointerdown/pointermove 更新 x/y，wheel 更新 zoom（clamp 1-3）
  - onCropChange 回调输出 `{ x, y, zoom }`
  → S1/S1b/S1c 转绿
- [ ] 4.2 `CreateProjectDialog.tsx`：新增 `cropArea` state，`<ImageUpload>` 后接 `<ImageCropper>`（有图片时显示）
- [ ] 4.3 提交 payload 扩展为 `{ coverImage, cropArea }` → S2/S2b 转绿

## 5. Refactor（保持绿灯）

- [ ] 5.1 确认 ImageCropper 在触摸设备上的 touch 事件兼容（可选，桌面优先）
- [ ] 5.2 确认 ImageUpload API 未被破坏（保持向后兼容）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
