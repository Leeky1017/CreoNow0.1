本 change 涉及 ExportDialog / CreateProjectDialog / CreateTemplateDialog / OnboardingPage / SettingsGeneral，
均为视觉 + 结构重构（破坏性重构 + Design Token 对齐），不修改对外行为协议。
变更限于 JSX/CSS 渲染层，不影响 Store / IPC / Service。

无需 delta spec。如实施中发现对外行为变更，须先更新 spec 再实现。
