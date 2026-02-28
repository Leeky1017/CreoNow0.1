export type EditorSaveRequest = {
  projectId: string;
  documentId: string;
  contentJson: string;
  actor: "user" | "auto";
  reason: "manual-save" | "autosave";
};

export type EditorSaveQueueDeps = {
  executeSave: (request: EditorSaveRequest) => Promise<void>;
  onUnexpectedError?: (args: {
    request: EditorSaveRequest;
    error: unknown;
  }) => void;
};

export type EditorSaveQueue = {
  enqueue: (request: EditorSaveRequest) => Promise<void>;
};

type SaveQueueEntry = {
  request: EditorSaveRequest;
  resolve: () => void;
};

export function createEditorSaveQueue(
  deps: EditorSaveQueueDeps,
): EditorSaveQueue {
  const queue: SaveQueueEntry[] = [];
  let processing = false;

  const processQueue = async (): Promise<void> => {
    processing = true;
    try {
      while (queue.length > 0) {
        const current = queue.shift();
        if (!current) {
          continue;
        }

        try {
          await deps.executeSave(current.request);
        } catch (error) {
          deps.onUnexpectedError?.({
            request: current.request,
            error,
          });
        }

        current.resolve();
      }
    } finally {
      processing = false;
      if (queue.length > 0) {
        void processQueue();
      }
    }
  };

  const enqueue = async (request: EditorSaveRequest): Promise<void> => {
    await new Promise<void>((resolve) => {
      const entry: SaveQueueEntry = { request, resolve };

      if (request.reason === "manual-save") {
        const firstAutosaveIndex = queue.findIndex(
          (queued) =>
            queued.request.projectId === request.projectId &&
            queued.request.documentId === request.documentId &&
            queued.request.reason === "autosave",
        );

        if (firstAutosaveIndex >= 0) {
          queue.splice(firstAutosaveIndex, 0, entry);
        } else {
          queue.push(entry);
        }
      } else {
        queue.push(entry);
      }

      if (!processing) {
        void processQueue();
      }
    });
  };

  return { enqueue };
}
