import React from "react";
import { useOptionalLayoutStore } from "../../stores/layoutStore";
import { SlashCommandPanel } from "./SlashCommandPanel";
import { getSlashCommandRegistry, type SlashCommandId } from "./slashCommands";

export function useSlashPanel(): {
  isSlashPanelOpen: boolean;
  slashSearchQuery: string;
  setSlashSearchQuery: (query: string) => void;
  slashPanelOpenRef: React.MutableRefObject<boolean>;
  openSlashPanel: () => void;
  closeSlashPanel: () => void;
} {
  const zenMode = useOptionalLayoutStore((s) => s.zenMode) ?? false;
  const [isSlashPanelOpen, setIsSlashPanelOpen] = React.useState(false);
  const [slashSearchQuery, setSlashSearchQuery] = React.useState("");
  const slashPanelOpenRef = React.useRef(false);

  React.useEffect(() => {
    slashPanelOpenRef.current = isSlashPanelOpen;
  }, [isSlashPanelOpen]);

  const openSlashPanel = React.useCallback(() => {
    if (zenMode) {
      return;
    }
    setIsSlashPanelOpen(true);
  }, [zenMode]);

  const closeSlashPanel = React.useCallback(() => {
    setIsSlashPanelOpen(false);
    setSlashSearchQuery("");
  }, []);

  React.useEffect(() => {
    if (zenMode && isSlashPanelOpen) {
      closeSlashPanel();
    }
  }, [closeSlashPanel, isSlashPanelOpen, zenMode]);

  return {
    isSlashPanelOpen,
    slashSearchQuery,
    setSlashSearchQuery,
    slashPanelOpenRef,
    openSlashPanel,
    closeSlashPanel,
  };
}

export function SlashCommandMenu(props: {
  open: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onSelectCommand: (commandId: SlashCommandId) => void;
  onRequestClose: () => void;
}): JSX.Element | null {
  return (
    <SlashCommandPanel
      open={props.open}
      query={props.query}
      candidates={getSlashCommandRegistry()}
      onQueryChange={props.onQueryChange}
      onSelectCommand={props.onSelectCommand}
      onRequestClose={props.onRequestClose}
    />
  );
}
