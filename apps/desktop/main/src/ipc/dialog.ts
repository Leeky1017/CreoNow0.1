import type { IpcMain } from "electron";

import type { IpcResponse } from "@shared/types/ipc-generated";

type OpenDialogProperty =
  | "openDirectory"
  | "openFile"
  | "multiSelections"
  | "showHiddenFiles"
  | "createDirectory"
  | "promptToCreate"
  | "noResolveAliases"
  | "treatPackageAsDirectory"
  | "dontAddToRecent";

type OpenDialogResult = {
  canceled: boolean;
  filePaths: string[];
};

type OpenDialogOptions = {
  properties?: OpenDialogProperty[];
  title?: string;
};

type ShowOpenDialogFn = (
  options: OpenDialogOptions,
) => Promise<OpenDialogResult>;

export function registerDialogIpcHandlers(args: {
  ipcMain: IpcMain;
  showOpenDialog: ShowOpenDialogFn;
}): void {
  args.ipcMain.handle(
    "dialog:folder:open",
    async (): Promise<IpcResponse<{ selectedPath?: string }>> => {
      try {
        const result = await args.showOpenDialog({
          properties: ["openDirectory"],
        });

        if (result.canceled) {
          return { ok: true, data: {} };
        }

        return {
          ok: true,
          data: { selectedPath: result.filePaths[0] },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          ok: false,
          error: {
            code: "INTERNAL",
            message: `Failed to open folder dialog: ${message}`,
          },
        };
      }
    },
  );
}
