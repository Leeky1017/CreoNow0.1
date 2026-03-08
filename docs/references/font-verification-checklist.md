# 字体验收清单

> 适用于所有涉及 UI/字体/排版改动的 PR。审计 Agent 验证 Tier 3 字体问题时依此执行。

---

## §1 Electron 环境字体加载验证

1. 启动开发环境：`pnpm desktop:dev`
2. 打开 DevTools（`Ctrl+Shift+I` 或 `Cmd+Opt+I`）
3. 在 Console 中执行以下命令，确认字体加载状态：
   ```js
   // 验证 UI 字体
   document.fonts.check('16px "Inter"')    // 应返回 true
   // 验证正文字体
   document.fonts.check('16px "Lora"')     // 应返回 true
   // 验证等宽字体
   document.fonts.check('14px "JetBrains Mono"')  // 应返回 true
   ```
4. 执行 `document.fonts.ready.then(() => console.log('All fonts loaded'))` 确认无挂起的字体加载
5. 在 DevTools → Elements → Computed 中选中文本元素，确认 `font-family` resolved 值与 Design Token 一致

## §2 CJK 代表字符验证

在编辑器中输入以下字符，逐一确认渲染正常（无方块字、无 tofu）：

| 类别 | 字符 | 预期字体 |
|------|------|---------|
| 简体中文 | 你 好 世 界 龙 | `--font-family-body` fallback → 系统 CJK 字体 |
| 繁体中文 | 國 語 學 習 龍 | `--font-family-body` fallback → 系统 CJK 字体 |
| 日文平假名 | あ い う え お | `--font-family-body` fallback → 系统日文字体 |
| 日文片假名 | ア イ ウ エ オ | `--font-family-body` fallback → 系统日文字体 |
| 韩文 | 가 나 다 라 마 | `--font-family-body` fallback → 系统韩文字体 |

验证方法：在 DevTools 中选中 CJK 字符，查看 Computed → Rendered Fonts，确认使用了合理的 CJK 字体（如 "Microsoft YaHei"、"PingFang SC"、"Noto Sans CJK" 等），而非显示为 `.` 或 `□`。

## §3 Fallback 字体链验证

当前 Design Token 定义（`design/system/01-tokens.css`）：

```css
--font-family-ui:   "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-family-body: "Lora", "Crimson Pro", Georgia, serif;
--font-family-mono: "JetBrains Mono", "Fira Code", Consolas, monospace;
```

验证步骤：
1. 在 DevTools → Elements 中临时修改 `--font-family-ui` 删除 `"Inter"`
2. 确认 UI 文本回退到 `-apple-system`（macOS）或 `"Segoe UI"`（Windows）
3. 恢复后确认字体切换正常
4. 对 `--font-family-body` 和 `--font-family-mono` 重复上述步骤

## §4 Storybook 字体预览

新增或修改涉及排版/字体的组件时，必须在 Storybook 中包含以下 Story：

1. **中英文混排 Story**：同一段落包含中文和英文，验证行高、字间距、对齐
2. **纯 CJK Story**：纯中文/日文/韩文段落，验证排版无异常
3. **长文本段落 Story**：超过 500 字的中文段落，验证换行和段落间距

验证命令：`pnpm -C apps/desktop storybook:build` 必须成功。
