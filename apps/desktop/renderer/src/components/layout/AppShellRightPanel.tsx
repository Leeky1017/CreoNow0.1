import type { SettingsTab } from "../../features/settings-dialog/SettingsDialog";
import { RegionErrorBoundary } from "../patterns/RegionErrorBoundary";
import { RightPanel } from "./RightPanel";
import type { PanelVisibilityActions } from "./PanelOrchestrator";

type AppShellRightPanelProps = {
  width: number;
  collapsed: boolean;
  onOpenSettings: (tab?: SettingsTab) => void;
  onOpenVersionHistory: () => void;
  panelVisibility: PanelVisibilityActions;
};

/**
 * AppShellRightPanel – right panel region (AI / settings / version history).
 */
export function AppShellRightPanel(
  props: AppShellRightPanelProps,
): JSX.Element {
  return (
    <RegionErrorBoundary region="panel">
      <RightPanel
        width={props.width}
        collapsed={props.collapsed}
        onOpenSettings={(tab) => props.onOpenSettings(tab ?? "general")}
        onOpenVersionHistory={props.onOpenVersionHistory}
        onCollapse={props.panelVisibility.collapseRightPanel}
      />
    </RegionErrorBoundary>
  );
}
