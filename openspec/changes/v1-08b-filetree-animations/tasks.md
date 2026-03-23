# Tasks: v1-08b 迁移文件树旋转动画

- **父 change**: v1-08-*
- **状态**: 📋 待实施
- **任务数**: 1

---

## 箭头旋转

- [ ] `FileTreeNodeRow.tsx` inline rotate → Tailwind rotate 类
      实例（1 处）:
        :171-174 `style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}`
        → 移除 `style` 属性，在 className 中按条件添加 `rotate-90` / `rotate-0`
      验证: `grep -c 'rotate(90deg)' SRC/features/files/FileTreeNodeRow.tsx` → 0

---

## 整体验证

```bash
grep -c 'rotate(90deg)\|rotate(0deg)' SRC/features/files/FileTreeNodeRow.tsx
# → 0
pnpm typecheck
pnpm -C apps/desktop exec vitest run FileTree
```
