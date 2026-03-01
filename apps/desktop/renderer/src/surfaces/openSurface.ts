/**
 * openSurface — 统一的 Surface 打开/关闭入口
 *
 * 本文件提供统一的 API 来打开/关闭各种 surfaces，避免：
 * 1. 散落的 setState 调用
 * 2. 不一致的入口逻辑
 * 3. 重复的 surface 切换代码
 *
 * 依赖：surfaceRegistry.ts 中定义的 surface 映射
 */

import type {
  DialogType,
  LeftPanelType,
  RightPanelType,
} from "../stores/layoutStore";

/**
 * Surface 打开参数
 */
export interface OpenSurfaceParams {
  /** Surface ID（来自 surfaceRegistry） */
  surfaceId: string;
  /** 可选的额外参数（如打开特定文档的版本历史） */
  context?: Record<string, unknown>;
}

/**
 * Surface 操作结果
 */
export interface SurfaceActionResult {
  ok: boolean;
  /** 失败时的错误信息 */
  error?: {
    code: "UNKNOWN_SURFACE" | "INVALID_CONTEXT" | "ACTION_FAILED";
    message: string;
  };
}

/**
 * LayoutStore 接口（用于依赖注入）
 */
export interface LayoutStoreActions {
  setActiveLeftPanel: (panel: LeftPanelType) => void;
  setActiveRightPanel: (panel: RightPanelType) => void;
  setDialogType: (dialog: DialogType | null) => void;
  setSpotlightOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setPanelCollapsed: (collapsed: boolean) => void;
  setZenMode: (enabled: boolean) => void;
}

/**
 * DialogStore 接口（用于依赖注入）
 */
export interface DialogStoreActions {
  openSettingsDialog: () => void;
  openExportDialog: () => void;
  openCreateProjectDialog: () => void;
  openCreateTemplateDialog: () => void;
  openMemoryCreateDialog: () => void;
  openMemorySettingsDialog: () => void;
  openSkillPicker: () => void;
  closeDialog: () => void;
}

/**
 * Surface ID 到 LeftPanelType 的映射
 */
const leftPanelMapping: Record<string, LeftPanelType> = {
  fileTreePanel: "files",
  outlinePanel: "outline",
  // Note: settings 不再映射到 leftPanel，而是打开 SettingsDialog
};

const dialogMapping: Record<string, DialogType> = {
  versionHistoryPanel: "versionHistory",
  memoryPanel: "memory",
  characterPanel: "characters",
  knowledgeGraph: "knowledgeGraph",
};

const spotlightMapping = new Set<string>(["searchPanel"]);

/**
 * Surface ID 到 RightPanelType 的映射
 */
const rightPanelMapping: Record<string, RightPanelType> = {
  aiPanel: "ai",
  qualityGatesPanel: "quality",
  // Note: info panel 暂无独立 surface
};

/**
 * 创建 Surface 操作器
 *
 * @param layoutStore - Layout store actions
 * @param dialogStore - Dialog store actions
 * @returns Surface 操作函数集合
 *
 * @example
 * ```typescript
 * const surfaceActions = createSurfaceActions(layoutStore, dialogStore);
 * surfaceActions.open({ surfaceId: "settingsDialog" });
 * surfaceActions.toggleLeftPanel("files");
 * ```
 */
export function createSurfaceActions(
  layoutStore: LayoutStoreActions,
  dialogStore: DialogStoreActions,
) {
  /**
   * 打开指定 surface
   */
  function open(params: OpenSurfaceParams): SurfaceActionResult {
    const { surfaceId } = params;

    // 1. 检查是否是左侧面板
    if (surfaceId in leftPanelMapping) {
      const panelType = leftPanelMapping[surfaceId];
      layoutStore.setActiveLeftPanel(panelType);
      layoutStore.setDialogType(null);
      layoutStore.setSpotlightOpen(false);
      layoutStore.setSidebarCollapsed(false);
      return { ok: true };
    }

    // 1.5 检查是否是弹出式 Dialog
    if (surfaceId in dialogMapping) {
      const dialogType = dialogMapping[surfaceId];
      layoutStore.setDialogType(dialogType);
      layoutStore.setSpotlightOpen(false);
      return { ok: true };
    }

    // 1.6 检查是否是 Spotlight
    if (spotlightMapping.has(surfaceId)) {
      layoutStore.setDialogType(null);
      layoutStore.setSpotlightOpen(true);
      return { ok: true };
    }

    // 2. 检查是否是右侧面板
    if (surfaceId in rightPanelMapping) {
      const panelType = rightPanelMapping[surfaceId];
      layoutStore.setActiveRightPanel(panelType);
      layoutStore.setPanelCollapsed(false);
      return { ok: true };
    }

    // 3. 检查是否是对话框
    switch (surfaceId) {
      case "settingsDialog":
        dialogStore.openSettingsDialog();
        return { ok: true };
      case "exportDialog":
        dialogStore.openExportDialog();
        return { ok: true };
      case "createProjectDialog":
        dialogStore.openCreateProjectDialog();
        return { ok: true };
      case "createTemplateDialog":
        dialogStore.openCreateTemplateDialog();
        return { ok: true };
      case "memoryCreateDialog":
        dialogStore.openMemoryCreateDialog();
        return { ok: true };
      case "memorySettingsDialog":
        dialogStore.openMemorySettingsDialog();
        return { ok: true };
      case "skillPicker":
        dialogStore.openSkillPicker();
        return { ok: true };
    }

    // 4. 检查是否是 overlay
    switch (surfaceId) {
      case "zenMode":
        layoutStore.setZenMode(true);
        return { ok: true };
      case "commandPalette":
        // CommandPalette 通常由快捷键触发，这里提供编程式入口
        // 实际实现需要 CommandPalette 组件暴露 open 方法
        return {
          ok: false,
          error: {
            code: "ACTION_FAILED",
            message:
              "CommandPalette should be opened via shortcut (Cmd/Ctrl+P)",
          },
        };
    }

    // 5. 未知 surface
    return {
      ok: false,
      error: {
        code: "UNKNOWN_SURFACE",
        message: `Unknown surface: ${surfaceId}`,
      },
    };
  }

  /**
   * 关闭指定 surface
   */
  function close(surfaceId: string): SurfaceActionResult {
    // 对话框关闭
    const dialogSurfaces = [
      "settingsDialog",
      "exportDialog",
      "createProjectDialog",
      "createTemplateDialog",
      "memoryCreateDialog",
      "memorySettingsDialog",
      "skillPicker",
      "aiDialogs",
    ];

    if (dialogSurfaces.includes(surfaceId)) {
      dialogStore.closeDialog();
      return { ok: true };
    }

    // Overlay 关闭
    if (surfaceId === "zenMode") {
      layoutStore.setZenMode(false);
      return { ok: true };
    }

    // 面板不能"关闭"，只能折叠
    if (surfaceId in leftPanelMapping) {
      layoutStore.setSidebarCollapsed(true);
      return { ok: true };
    }

    if (surfaceId in dialogMapping) {
      layoutStore.setDialogType(null);
      return { ok: true };
    }

    if (spotlightMapping.has(surfaceId)) {
      layoutStore.setSpotlightOpen(false);
      return { ok: true };
    }

    if (surfaceId in rightPanelMapping) {
      layoutStore.setPanelCollapsed(true);
      return { ok: true };
    }

    return {
      ok: false,
      error: {
        code: "UNKNOWN_SURFACE",
        message: `Cannot close surface: ${surfaceId}`,
      },
    };
  }

  /**
   * 切换左侧面板
   */
  function toggleLeftPanel(panel: LeftPanelType): void {
    layoutStore.setActiveLeftPanel(panel);
    layoutStore.setSidebarCollapsed(false);
  }

  /**
   * 切换右侧面板
   */
  function toggleRightPanel(panel: RightPanelType): void {
    layoutStore.setActiveRightPanel(panel);
    layoutStore.setPanelCollapsed(false);
  }

  /**
   * 折叠/展开侧边栏
   */
  function toggleSidebar(collapsed?: boolean): void {
    if (collapsed !== undefined) {
      layoutStore.setSidebarCollapsed(collapsed);
    } else {
      // 需要获取当前状态来切换
      // 这里简化处理，实际需要 layoutStore 提供 getter
    }
  }

  /**
   * 折叠/展开右侧面板
   */
  function togglePanel(collapsed?: boolean): void {
    if (collapsed !== undefined) {
      layoutStore.setPanelCollapsed(collapsed);
    }
  }

  /**
   * 进入/退出禅模式
   */
  function toggleZenMode(enabled?: boolean): void {
    if (enabled !== undefined) {
      layoutStore.setZenMode(enabled);
    }
  }

  return {
    open,
    close,
    toggleLeftPanel,
    toggleRightPanel,
    toggleSidebar,
    togglePanel,
    toggleZenMode,
  };
}

/**
 * Surface 操作器类型
 */
export type SurfaceActions = ReturnType<typeof createSurfaceActions>;
