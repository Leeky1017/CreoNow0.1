本 change 涉及 AiDiffModal / AiErrorCard / SystemDialog / AiInlineConfirm，
均为视觉 + 结构重构（破坏性重构 + 与 v1-06 AiPanel 风格统一），不修改对外行为协议。
变更限于 JSX/CSS 渲染层，不影响 AI 调用逻辑 / diff 算法 / IPC。

无需 delta spec。如实施中发现对外行为变更，须先更新 spec 再实现。
