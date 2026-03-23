import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { StatusBar } from "./StatusBar";
import {
  ProjectStoreProvider,
  createProjectStore,
} from "../../stores/projectStore";
import { FileStoreProvider, createFileStore } from "../../stores/fileStore";
import {
  EditorStoreProvider,
  createEditorStore,
  type AutosaveStatus,
} from "../../stores/editorStore";
import { expect } from "@storybook/test";

function createMockIpc() {
  return {
    invoke: async () => ({
      ok: true as const,
      data: { items: [], settings: {}, content: "" },
    }),
    on: (): (() => void) => () => {},
  };
}

function StatusBarScenario(props: {
  autosaveStatus: AutosaveStatus;
}): JSX.Element {
  const ipc = React.useMemo(() => createMockIpc(), []);
  const projectStore = React.useMemo(
    () => createProjectStore(ipc as Parameters<typeof createProjectStore>[0]),
    [ipc],
  );
  const fileStore = React.useMemo(
    () => createFileStore(ipc as Parameters<typeof createFileStore>[0]),
    [ipc],
  );
  const editorStore = React.useMemo(
    () => createEditorStore(ipc as Parameters<typeof createEditorStore>[0]),
    [ipc],
  );

  React.useEffect(() => {
    projectStore.setState({
      current: { projectId: "project-1", rootPath: "/tmp/project-1" },
      items: [
        {
          projectId: "project-1",
          name: "暗流",
          rootPath: "/tmp/project-1",
          updatedAt: 1700000000000,
        },
      ],
    });
    fileStore.setState({
      currentDocumentId: "doc-1",
      items: [
        {
          documentId: "doc-1",
          title: "第三章",
          status: "draft",
          type: "chapter",
          sortOrder: 0,
          updatedAt: 1700000000000,
        },
      ],
    });
    editorStore.setState({
      documentId: "doc-1",
      documentCharacterCount: 3250,
      autosaveStatus: props.autosaveStatus,
    });
  }, [editorStore, fileStore, projectStore, props.autosaveStatus]);

  return (
    <ProjectStoreProvider store={projectStore}>
      <FileStoreProvider store={fileStore}>
        <EditorStoreProvider store={editorStore}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "220px",
              width: "100%",
            }}
          >
            <div
              style={{
                flex: 1,
                backgroundColor: "var(--color-bg-base)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-fg-muted)",
              }}
            >
              Main Content Area
            </div>
            <StatusBar />
          </div>
        </EditorStoreProvider>
      </FileStoreProvider>
    </ProjectStoreProvider>
  );
}

const meta = {
  title: "Layout/StatusBar",
  component: StatusBar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof StatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NormalState: Story = {
  render: () => <StatusBarScenario autosaveStatus="idle" />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const SavingState: Story = {
  render: () => <StatusBarScenario autosaveStatus="saving" />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const ErrorState: Story = {
  render: () => <StatusBarScenario autosaveStatus="error" />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
