# Tasks: v1-12a 拆分 SkillManagerDialog

- **父 change**: v1-12-interaction-motion-and-native-cleanup
- **状态**: 📋 待实施
- **任务数**: 6

---

## 新建文件

- [ ] `skill-manager.types.ts` 提取类型定义
      实例（3 处）:
        :18 `CustomSkillListItem` 类型
        :21 `SkillFormState` 类型
        :31 `CustomSkillContextRules` 类型
      验证: `pnpm typecheck`

- [ ] `skill-manager-utils.ts` 提取工具函数
      实例（3 处）:
        :43-60 `buildSkillDraftFromDescription`（18 行）
        :62-86 `parseContextRulesText`（25 行）
        :88-95 `readFieldName`（8 行）
      验证: `pnpm typecheck`

- [ ] `SkillFormFields.tsx` 提取表单组件
      实例（1 处）:
        :104-268 `SkillFormFields` 组件（165 行）
      验证: `pnpm typecheck`

- [ ] `SkillItemList.tsx` 提取列表组件
      实例（1 处）:
        :269-345 `SkillItemList` 组件（77 行）
      验证: `pnpm typecheck`

## 修改文件

- [ ] `SkillManagerDialog.tsx` 移除已提取代码，添加 import
      实例（4 处）:
        :18-31 删除类型 → import from `./skill-manager.types`
        :43-95 删除工具函数 → import from `./skill-manager-utils`
        :104-268 删除 SkillFormFields → import from `./SkillFormFields`
        :269-345 删除 SkillItemList → import from `./SkillItemList`
      验证: `wc -l` → ≤300

## 回归验证

- [ ] 全量验证
      验证: `pnpm typecheck && pnpm -C apps/desktop exec vitest run SkillManager`

---

## 整体验证

```bash
wc -l apps/desktop/renderer/src/features/ai/SkillManagerDialog.tsx
wc -l apps/desktop/renderer/src/features/ai/SkillFormFields.tsx
wc -l apps/desktop/renderer/src/features/ai/SkillItemList.tsx
pnpm typecheck
pnpm -C apps/desktop exec vitest run SkillManager
```
