/**
 * Surface Registry — 前端资产与 App/QA 入口的唯一映射表
 *
 * 本文件是 P0-001 的核心产物，实现：
 * 1. 60/60 Storybook 资产全量映射（截至 2026-02-14）
 * 2. 每个 surface 都有明确的入口（App/QA/Storybook）
 * 3. 每个 surface 都有 data-testid 用于 E2E 测试
 *
 * SSOT: 此文件是 surface ↔ storybookTitle ↔ entrypoints 的唯一真相源
 */

/**
 * Surface 种类
 *
 * - page: 全屏页面（Onboarding/Dashboard/Editor）
 * - leftPanel: 左侧面板内容（Files/Search/Outline 等）
 * - rightPanel: 右侧面板内容（AI/Info/Quality）
 * - dialog: 模态对话框
 * - overlay: 覆盖层（ZenMode）
 * - primitive: UI 原语（Button/Input 等）
 * - layout: 布局组件（AppShell/Sidebar 等）
 */
export type SurfaceKind =
  | "page"
  | "leftPanel"
  | "rightPanel"
  | "dialog"
  | "overlay"
  | "primitive"
  | "layout";

/**
 * 入口点类型
 *
 * - iconBar: 左侧图标栏点击
 * - commandPalette: 命令面板命令
 * - shortcut: 快捷键
 * - navigation: 路由导航
 * - menu: 菜单项
 * - button: 按钮点击
 * - storybookOnly: 仅在 Storybook 中可达
 */
export type EntryPointType =
  | "iconBar"
  | "commandPalette"
  | "shortcut"
  | "navigation"
  | "menu"
  | "button"
  | "storybookOnly";

/**
 * 入口点定义
 */
export interface EntryPoint {
  /** 入口类型 */
  type: EntryPointType;
  /** 入口描述（命令名/快捷键/路由等） */
  description: string;
}

/**
 * Surface 注册条目
 */
export interface SurfaceRegistryItem {
  /** 唯一标识符（驼峰命名） */
  id: string;
  /** Surface 种类 */
  kind: SurfaceKind;
  /** 入口点列表 */
  entryPoints: EntryPoint[];
  /** E2E 测试用的 data-testid */
  testId: string;
  /** 对应的 Storybook meta.title（必须与 *.stories.tsx 中的 title 完全一致） */
  storybookTitle: string;
}

/**
 * 完整的 Surface Registry（69/69）
 *
 * 按类别组织：Layout → Primitives → Features → Patterns
 */
export const surfaceRegistry: SurfaceRegistryItem[] = [
  // ============================================================
  // Layout（10 个）
  // ============================================================
  {
    id: "appShell",
    kind: "layout",
    entryPoints: [{ type: "navigation", description: "App root layout" }],
    testId: "app-shell",
    storybookTitle: "Layout/AppShell",
  },
  {
    id: "layoutIntegration",
    kind: "layout",
    entryPoints: [{ type: "storybookOnly", description: "Storybook 综合测试" }],
    testId: "layout-integration",
    storybookTitle: "Layout/综合测试",
  },
  {
    id: "resizer",
    kind: "layout",
    entryPoints: [{ type: "storybookOnly", description: "Resizer component" }],
    testId: "resizer",
    storybookTitle: "Layout/Resizer",
  },
  {
    id: "sidebar",
    kind: "layout",
    entryPoints: [
      { type: "shortcut", description: "Cmd/Ctrl+\\" },
      { type: "commandPalette", description: "Toggle Sidebar" },
    ],
    testId: "sidebar",
    storybookTitle: "Layout/Sidebar",
  },
  {
    id: "statusBar",
    kind: "layout",
    entryPoints: [{ type: "navigation", description: "Always visible" }],
    testId: "status-bar",
    storybookTitle: "Layout/StatusBar",
  },
  {
    id: "iconBar",
    kind: "layout",
    entryPoints: [{ type: "navigation", description: "Left icon bar" }],
    testId: "icon-bar",
    storybookTitle: "Layout/IconBar",
  },
  {
    id: "rightPanel",
    kind: "layout",
    entryPoints: [
      { type: "shortcut", description: "Cmd/Ctrl+L" },
      { type: "commandPalette", description: "Toggle Right Panel" },
    ],
    testId: "right-panel",
    storybookTitle: "Layout/RightPanel",
  },
  {
    id: "layoutShell",
    kind: "layout",
    entryPoints: [
      { type: "storybookOnly", description: "Layout shell wrapper" },
    ],
    testId: "layout-shell",
    storybookTitle: "Layout/LayoutShell",
  },
  {
    id: "leftPanelDialogShell",
    kind: "layout",
    entryPoints: [
      { type: "storybookOnly", description: "Left panel dialog shell" },
    ],
    testId: "left-panel-dialog-shell",
    storybookTitle: "Layout/LeftPanelDialogShell",
  },
  {
    id: "saveIndicator",
    kind: "layout",
    entryPoints: [{ type: "storybookOnly", description: "Save indicator" }],
    testId: "save-indicator",
    storybookTitle: "Layout/SaveIndicator",
  },

  // ============================================================
  // Primitives（26 個）
  // ============================================================
  {
    id: "accordion",
    kind: "primitive",
    entryPoints: [
      { type: "storybookOnly", description: "Accordion primitive" },
    ],
    testId: "accordion",
    storybookTitle: "Primitives/Accordion",
  },
  {
    id: "avatar",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Avatar primitive" }],
    testId: "avatar",
    storybookTitle: "Primitives/Avatar",
  },
  {
    id: "badge",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Badge primitive" }],
    testId: "badge",
    storybookTitle: "Primitives/Badge",
  },
  {
    id: "button",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Button primitive" }],
    testId: "button",
    storybookTitle: "Primitives/Button",
  },
  {
    id: "card",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Card primitive" }],
    testId: "card",
    storybookTitle: "Primitives/Card",
  },
  {
    id: "checkbox",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Checkbox primitive" }],
    testId: "checkbox",
    storybookTitle: "Primitives/Checkbox",
  },
  {
    id: "contextMenu",
    kind: "primitive",
    entryPoints: [
      { type: "storybookOnly", description: "ContextMenu primitive" },
    ],
    testId: "context-menu",
    storybookTitle: "Primitives/ContextMenu",
  },
  {
    id: "dialog",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Dialog primitive" }],
    testId: "dialog",
    storybookTitle: "Primitives/Dialog",
  },
  {
    id: "dropdownMenu",
    kind: "primitive",
    entryPoints: [
      { type: "storybookOnly", description: "DropdownMenu primitive" },
    ],
    testId: "dropdown-menu",
    storybookTitle: "Primitives/DropdownMenu",
  },
  {
    id: "heading",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Heading primitive" }],
    testId: "heading",
    storybookTitle: "Primitives/Heading",
  },
  {
    id: "imageUpload",
    kind: "primitive",
    entryPoints: [
      { type: "storybookOnly", description: "ImageUpload primitive" },
    ],
    testId: "image-upload",
    storybookTitle: "Primitives/ImageUpload",
  },
  {
    id: "input",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Input primitive" }],
    testId: "input",
    storybookTitle: "Primitives/Input",
  },
  {
    id: "listItem",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "ListItem primitive" }],
    testId: "list-item",
    storybookTitle: "Primitives/ListItem",
  },
  {
    id: "popover",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Popover primitive" }],
    testId: "popover",
    storybookTitle: "Primitives/Popover",
  },
  {
    id: "radio",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Radio primitive" }],
    testId: "radio",
    storybookTitle: "Primitives/Radio",
  },
  {
    id: "scrollArea",
    kind: "primitive",
    entryPoints: [
      { type: "storybookOnly", description: "ScrollArea primitive" },
    ],
    testId: "scroll-area",
    storybookTitle: "Primitives/ScrollArea",
  },
  {
    id: "select",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Select primitive" }],
    testId: "select",
    storybookTitle: "Primitives/Select",
  },
  {
    id: "skeleton",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Skeleton primitive" }],
    testId: "skeleton",
    storybookTitle: "Primitives/Skeleton",
  },
  {
    id: "slider",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Slider primitive" }],
    testId: "slider",
    storybookTitle: "Primitives/Slider",
  },
  {
    id: "spinner",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Spinner primitive" }],
    testId: "spinner",
    storybookTitle: "Primitives/Spinner",
  },
  {
    id: "tabs",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Tabs primitive" }],
    testId: "tabs",
    storybookTitle: "Primitives/Tabs",
  },
  {
    id: "text",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Text primitive" }],
    testId: "text",
    storybookTitle: "Primitives/Text",
  },
  {
    id: "textarea",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Textarea primitive" }],
    testId: "textarea",
    storybookTitle: "Primitives/Textarea",
  },
  {
    id: "toast",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Toast primitive" }],
    testId: "toast",
    storybookTitle: "Primitives/Toast",
  },
  {
    id: "toggle",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Toggle primitive" }],
    testId: "toggle",
    storybookTitle: "Primitives/Toggle",
  },
  {
    id: "tooltip",
    kind: "primitive",
    entryPoints: [{ type: "storybookOnly", description: "Tooltip primitive" }],
    testId: "tooltip",
    storybookTitle: "Primitives/Tooltip",
  },

  // ============================================================
  // Features（28 个）
  // ============================================================
  {
    id: "aiDialogs",
    kind: "dialog",
    entryPoints: [
      { type: "button", description: "AI error/confirm/prompt actions" },
    ],
    testId: "ai-dialogs",
    storybookTitle: "Features/AiDialogs",
  },
  {
    id: "aiPanel",
    kind: "rightPanel",
    entryPoints: [{ type: "iconBar", description: "AI tab in right panel" }],
    testId: "ai-panel",
    storybookTitle: "Features/AiPanel",
  },
  {
    id: "analyticsPage",
    kind: "page",
    entryPoints: [{ type: "navigation", description: "Analytics page route" }],
    testId: "analytics-page",
    storybookTitle: "Features/AnalyticsPage",
  },
  {
    id: "characterPanel",
    kind: "leftPanel",
    entryPoints: [{ type: "iconBar", description: "Characters icon" }],
    testId: "character-panel",
    storybookTitle: "Features/CharacterPanel",
  },
  {
    id: "commandPalette",
    kind: "overlay",
    entryPoints: [{ type: "shortcut", description: "Cmd/Ctrl+P" }],
    testId: "command-palette",
    storybookTitle: "Features/CommandPalette",
  },
  {
    id: "createProjectDialog",
    kind: "dialog",
    entryPoints: [
      { type: "button", description: "New Project button" },
      { type: "shortcut", description: "Cmd/Ctrl+Shift+N" },
      { type: "commandPalette", description: "Create New Project" },
    ],
    testId: "create-project-dialog",
    storybookTitle: "Features/CreateProjectDialog",
  },
  {
    id: "projectSwitcher",
    kind: "layout",
    entryPoints: [
      { type: "navigation", description: "Top area of Sidebar in AppShell" },
    ],
    testId: "project-switcher",
    storybookTitle: "Features/Projects/ProjectSwitcher",
  },
  {
    id: "createTemplateDialog",
    kind: "dialog",
    entryPoints: [{ type: "button", description: "Create Template button" }],
    testId: "create-template-dialog",
    storybookTitle: "Features/CreateTemplateDialog",
  },
  {
    id: "dashboardPage",
    kind: "page",
    entryPoints: [
      { type: "navigation", description: "Dashboard route after onboarding" },
    ],
    testId: "dashboard-page",
    storybookTitle: "Features/Dashboard/DashboardPage",
  },
  {
    id: "diffView",
    kind: "leftPanel",
    entryPoints: [
      { type: "button", description: "Compare button in VersionHistory" },
    ],
    testId: "diff-view",
    storybookTitle: "Features/DiffView",
  },
  {
    id: "editorPane",
    kind: "page",
    entryPoints: [
      { type: "navigation", description: "Editor main content area" },
    ],
    testId: "editor-pane",
    storybookTitle: "Features/Editor/EditorPane",
  },
  {
    id: "editorToolbar",
    kind: "layout",
    entryPoints: [{ type: "navigation", description: "Editor toolbar" }],
    testId: "editor-toolbar",
    storybookTitle: "Features/Editor/EditorToolbar",
  },
  {
    id: "writeButton",
    kind: "layout",
    entryPoints: [{ type: "button", description: "Floating write trigger" }],
    testId: "write-button-group",
    storybookTitle: "Features/Editor/WriteButton",
  },
  {
    id: "exportDialog",
    kind: "dialog",
    entryPoints: [
      { type: "commandPalette", description: "Export..." },
      { type: "button", description: "Export button in toolbar" },
    ],
    testId: "export-dialog",
    storybookTitle: "Features/ExportDialog",
  },
  {
    id: "fileTreePanel",
    kind: "leftPanel",
    entryPoints: [{ type: "iconBar", description: "Files icon" }],
    testId: "file-tree-panel",
    storybookTitle: "Features/FileTreePanel",
  },
  {
    id: "knowledgeGraph",
    kind: "leftPanel",
    entryPoints: [{ type: "iconBar", description: "Knowledge Graph icon" }],
    testId: "knowledge-graph",
    storybookTitle: "Features/KnowledgeGraph",
  },
  {
    id: "kgViews",
    kind: "leftPanel",
    entryPoints: [
      {
        type: "storybookOnly",
        description: "KG2 graph/timeline/card acceptance stories",
      },
    ],
    testId: "kg-views",
    storybookTitle: "Features/KG/Views",
  },
  {
    id: "knowledgeGraphEntityDetail",
    kind: "leftPanel",
    entryPoints: [
      { type: "storybookOnly", description: "KG entity detail states" },
    ],
    testId: "kg-entity-detail-card",
    storybookTitle: "Features/KnowledgeGraph/EntityDetail",
  },
  {
    id: "memoryCreateDialog",
    kind: "dialog",
    entryPoints: [{ type: "button", description: "Add memory button" }],
    testId: "memory-create-dialog",
    storybookTitle: "Features/MemoryCreateDialog",
  },
  {
    id: "memoryPanel",
    kind: "leftPanel",
    entryPoints: [{ type: "iconBar", description: "Memory icon" }],
    testId: "memory-panel",
    storybookTitle: "Features/MemoryPanel",
  },
  {
    id: "memorySettingsDialog",
    kind: "dialog",
    entryPoints: [{ type: "button", description: "Memory settings button" }],
    testId: "memory-settings-dialog",
    storybookTitle: "Features/MemorySettingsDialog",
  },
  {
    id: "onboardingPage",
    kind: "page",
    entryPoints: [{ type: "navigation", description: "Initial app route" }],
    testId: "onboarding-page",
    storybookTitle: "Features/Onboarding/OnboardingPage",
  },
  {
    id: "outlinePanel",
    kind: "leftPanel",
    entryPoints: [{ type: "iconBar", description: "Outline icon" }],
    testId: "outline-panel",
    storybookTitle: "Features/OutlinePanel",
  },
  {
    id: "qualityGatesPanel",
    kind: "rightPanel",
    entryPoints: [
      { type: "iconBar", description: "Quality tab in right panel" },
    ],
    testId: "quality-gates-panel",
    storybookTitle: "Features/QualityGatesPanel",
  },
  {
    id: "searchPanel",
    kind: "leftPanel",
    entryPoints: [
      { type: "iconBar", description: "Search icon" },
      { type: "shortcut", description: "Cmd/Ctrl+Shift+F" },
    ],
    testId: "search-panel",
    storybookTitle: "Features/SearchPanel",
  },
  {
    id: "settingsDialog",
    kind: "dialog",
    entryPoints: [
      { type: "shortcut", description: "Cmd/Ctrl+," },
      { type: "commandPalette", description: "Open Settings" },
      { type: "iconBar", description: "Settings icon (opens dialog)" },
    ],
    testId: "settings-dialog",
    storybookTitle: "Features/SettingsDialog",
  },
  {
    id: "skillPicker",
    kind: "dialog",
    entryPoints: [
      { type: "button", description: "Skill picker toggle in AI panel" },
    ],
    testId: "skill-picker",
    storybookTitle: "Features/SkillPicker",
  },
  {
    id: "versionHistoryPanel",
    kind: "leftPanel",
    entryPoints: [{ type: "iconBar", description: "History icon" }],
    testId: "version-history-panel",
    storybookTitle: "Features/VersionHistoryPanel",
  },
  {
    id: "zenMode",
    kind: "overlay",
    entryPoints: [
      { type: "shortcut", description: "F11" },
      { type: "commandPalette", description: "Toggle Zen Mode" },
    ],
    testId: "zen-mode",
    storybookTitle: "Features/ZenMode",
  },

  // ============================================================
  // Patterns（7 个）
  // ============================================================
  {
    id: "panelHeader",
    kind: "overlay",
    entryPoints: [
      { type: "storybookOnly", description: "Shared panel header pattern" },
    ],
    testId: "panel-header",
    storybookTitle: "Patterns/PanelHeader",
  },
  {
    id: "errorBoundary",
    kind: "overlay",
    entryPoints: [
      { type: "storybookOnly", description: "Error boundary wrapper" },
    ],
    testId: "error-boundary",
    storybookTitle: "Patterns/ErrorBoundary",
  },
  {
    id: "errorState",
    kind: "overlay",
    entryPoints: [
      { type: "storybookOnly", description: "Error state display" },
    ],
    testId: "error-state",
    storybookTitle: "Patterns/ErrorState",
  },
  {
    id: "regionErrorBoundary",
    kind: "overlay",
    entryPoints: [
      { type: "storybookOnly", description: "Region-scoped error boundary" },
    ],
    testId: "region-error-boundary",
    storybookTitle: "Patterns/RegionErrorBoundary",
  },
  {
    id: "emptyState",
    kind: "overlay",
    entryPoints: [
      { type: "storybookOnly", description: "Empty state pattern" },
    ],
    testId: "empty-state",
    storybookTitle: "Patterns/EmptyState",
  },
  {
    id: "loadingState",
    kind: "overlay",
    entryPoints: [
      { type: "storybookOnly", description: "Loading state pattern" },
    ],
    testId: "loading-state",
    storybookTitle: "Patterns/LoadingState",
  },
  {
    id: "regionFallback",
    kind: "overlay",
    entryPoints: [
      { type: "storybookOnly", description: "Region fallback pattern" },
    ],
    testId: "region-fallback",
    storybookTitle: "Patterns/RegionFallback",
  },
];

// ============================================================
// 辅助函数
// ============================================================

/**
 * 获取所有 Storybook titles（用于门禁测试）
 */
export function getRegistryStorybookTitles(): string[] {
  return surfaceRegistry.map((item) => item.storybookTitle);
}

/**
 * 按 kind 分类获取 surfaces
 */
export function getSurfacesByKind(kind: SurfaceKind): SurfaceRegistryItem[] {
  return surfaceRegistry.filter((item) => item.kind === kind);
}

/**
 * 按 storybookTitle 查找 surface
 */
export function getSurfaceByStorybookTitle(
  title: string,
): SurfaceRegistryItem | undefined {
  return surfaceRegistry.find((item) => item.storybookTitle === title);
}

/**
 * 按 id 查找 surface
 */
export function getSurfaceById(id: string): SurfaceRegistryItem | undefined {
  return surfaceRegistry.find((item) => item.id === id);
}

/**
 * 获取所有需要 App 入口的 surfaces（非 storybookOnly）
 */
export function getAppSurfaces(): SurfaceRegistryItem[] {
  return surfaceRegistry.filter((item) =>
    item.entryPoints.some((ep) => ep.type !== "storybookOnly"),
  );
}

/**
 * 获取所有仅 Storybook 可达的 surfaces
 */
export function getStorybookOnlySurfaces(): SurfaceRegistryItem[] {
  return surfaceRegistry.filter((item) =>
    item.entryPoints.every((ep) => ep.type === "storybookOnly"),
  );
}

/**
 * Registry 统计信息
 */
export function getRegistryStats(): {
  total: number;
  byKind: Record<SurfaceKind, number>;
  byCategory: {
    layout: number;
    primitives: number;
    features: number;
    patterns: number;
  };
  appSurfaces: number;
  storybookOnlySurfaces: number;
} {
  const byKind: Record<SurfaceKind, number> = {
    page: 0,
    leftPanel: 0,
    rightPanel: 0,
    dialog: 0,
    overlay: 0,
    primitive: 0,
    layout: 0,
  };

  for (const item of surfaceRegistry) {
    byKind[item.kind]++;
  }

  const byCategory = {
    layout: surfaceRegistry.filter((i) =>
      i.storybookTitle.startsWith("Layout/"),
    ).length,
    primitives: surfaceRegistry.filter((i) =>
      i.storybookTitle.startsWith("Primitives/"),
    ).length,
    features: surfaceRegistry.filter((i) =>
      i.storybookTitle.startsWith("Features/"),
    ).length,
    patterns: surfaceRegistry.filter((i) =>
      i.storybookTitle.startsWith("Patterns/"),
    ).length,
  };

  return {
    total: surfaceRegistry.length,
    byKind,
    byCategory,
    appSurfaces: getAppSurfaces().length,
    storybookOnlySurfaces: getStorybookOnlySurfaces().length,
  };
}
