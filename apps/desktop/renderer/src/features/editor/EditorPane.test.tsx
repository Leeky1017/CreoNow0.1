import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  IpcChannel,
  IpcInvokeResult,
  IpcRequest,
} from "@shared/types/ipc-generated";

import {
  EditorStoreProvider,
  createEditorStore,
} from "../../stores/editorStore";
import {
  VersionStoreProvider,
  createVersionStore,
  type IpcInvoke as VersionIpcInvoke,
} from "../../stores/versionStore";
import {
  LayoutStoreProvider,
  createLayoutStore,
} from "../../stores/layoutStore";
import type { PreferenceKey, PreferenceStore } from "../../lib/preferences";
import {
  AiStoreProvider,
  createAiStore,
  type IpcInvoke,
} from "../../stores/aiStore";
import {
  EditorPane,
  InlineAiOverlay,
  EDITOR_DOCUMENT_CHARACTER_LIMIT,
  LARGE_PASTE_THRESHOLD_CHARS,
  chunkLargePasteText,
  parseEditorContentJsonSafely,
  sanitizePastedHtml,
  shouldConfirmOverflowPaste,
  shouldWarnDocumentCapacity,
} from "./EditorPane";
import { createInlineAiStore } from "./inlineAiStore";
import { captureSelectionRef } from "../ai/applySelection";

function createReadyEditorStore(args: {
  onSave: (payload: {
    actor: string;
    reason: string;
    projectId: string;
    documentId: string;
    contentJson: string;
  }) => void;
}) {
  const store = createEditorStore({
    invoke: async (channel, payload) => {
      if (channel === "file:document:save") {
        const savePayload = payload as IpcRequest<"file:document:save">;
        args.onSave({
          actor: savePayload.actor,
          reason: savePayload.reason,
          projectId: savePayload.projectId,
          documentId: savePayload.documentId,
          contentJson: savePayload.contentJson,
        });
        return {
          ok: true,
          data: {
            contentHash: "hash-manual",
            updatedAt: 101,
          },
        };
      }

      if (channel === "file:document:updatestatus") {
        return {
          ok: true,
          data: {
            updated: true,
            status: "draft",
          },
        };
      }

      throw new Error(`Unexpected channel: ${channel}`);
    },
  });

  store.setState({
    bootstrapStatus: "ready",
    projectId: "project-1",
    documentId: "doc-1",
    documentStatus: "draft",
    documentContentJson: JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Initial" }] },
      ],
    }),
    autosaveStatus: "idle",
    autosaveError: null,
  });

  return store;
}

function createVersionStoreForEditorPaneTests() {
  const invoke: VersionIpcInvoke = async (_channel, _payload) => {
    return {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "test stub",
      },
    };
  };

  return createVersionStore({
    invoke,
  });
}

function createPreferenceStub(
  initial: Partial<Record<PreferenceKey, unknown>> = {},
): PreferenceStore {
  const values = new Map<PreferenceKey, unknown>(
    Object.entries(initial).map(([key, value]) => [
      key as PreferenceKey,
      value,
    ]),
  );

  return {
    get<T>(key: PreferenceKey) {
      return values.has(key) ? (values.get(key) as T) : null;
    },
    set<T>(key: PreferenceKey, value: T) {
      values.set(key, value);
    },
    remove: (key: PreferenceKey) => {
      values.delete(key);
    },
    clear: () => {
      values.clear();
    },
  };
}

function createAiStoreForEditorPaneTests(args: {
  onSkillRun?: (payload: IpcRequest<"ai:skill:run">) => void;
  onPersistAiApply?: (payload: IpcRequest<"file:document:save">) => void;
  outputText?: string;
}) {
  const invoke: IpcInvoke = async <C extends IpcChannel>(
    channel: C,
    payload: IpcRequest<C>,
  ): Promise<IpcInvokeResult<C>> => {
    if (channel === "ai:skill:run") {
      args.onSkillRun?.(payload as IpcRequest<"ai:skill:run">);
      return {
        ok: true,
        data: {
          executionId: "run-s2-bubble-ai",
          runId: "run-s2-bubble-ai",
          outputText: args.outputText ?? "mock-output",
        },
      } as IpcInvokeResult<C>;
    }

    if (channel === "file:document:save") {
      args.onPersistAiApply?.(payload as IpcRequest<"file:document:save">);
      return {
        ok: true,
        data: {
          contentHash: "hash-ai-apply",
          updatedAt: 202,
        },
      } as IpcInvokeResult<C>;
    }

    throw new Error(`Unexpected channel: ${String(channel)}`);
  };

  return createAiStore({
    invoke,
  });
}

/**
 * Wait until EditorPane wires the TipTap editor instance into editorStore.
 *
 * Why: tests need direct access to selection/formatting commands to verify
 * Bubble Menu scenarios against real editor state.
 */
async function waitForEditorInstance(
  store: ReturnType<typeof createReadyEditorStore>,
) {
  await waitFor(() => {
    expect(store.getState().editor).not.toBeNull();
  });
  return store.getState().editor!;
}

describe("EditorPane", () => {
  it("should trigger manual save with actor=user reason=manual-save on Ctrl/Cmd+S", async () => {
    const saveCalls: Array<{ actor: string; reason: string }> = [];
    const store = createReadyEditorStore({
      onSave: (payload) => {
        saveCalls.push({ actor: payload.actor, reason: payload.reason });
      },
    });
    const versionStore = createVersionStoreForEditorPaneTests();

    render(
      <VersionStoreProvider store={versionStore}>
        <EditorStoreProvider store={store}>
          <EditorPane projectId="project-1" />
        </EditorStoreProvider>
      </VersionStoreProvider>,
    );

    await screen.findByTestId("editor-pane");
    await screen.findByTestId("tiptap-editor");

    fireEvent.keyDown(document, { key: "s", ctrlKey: true });

    await waitFor(() => {
      expect(saveCalls).toContainEqual({
        actor: "user",
        reason: "manual-save",
      });
    });

    const settleStartedAt = Date.now();
    await waitFor(
      () => {
        expect(Date.now() - settleStartedAt).toBeGreaterThanOrEqual(700);
        const autosaveCalls = saveCalls.filter(
          (call) => call.reason === "autosave",
        );
        expect(autosaveCalls).toHaveLength(0);
      },
      { timeout: 1_500, interval: 50 },
    );
  });

  it("should strip unsupported paste formatting while preserving supported structure", () => {
    const inputHtml = `
      <p><span style="color:red;background:yellow">Hello <strong>world</strong></span></p>
      <div style="font-size:30px">Second line with <em>italic</em></div>
      <object data="evil.bin"></object>
    `;

    const sanitized = sanitizePastedHtml(inputHtml);

    expect(sanitized).toContain("<p>");
    expect(sanitized).toContain("<strong>world</strong>");
    expect(sanitized).toContain("<em>italic</em>");
    expect(sanitized).not.toContain("style=");
    expect(sanitized).not.toContain("<object");
  });

  it("should split large paste payload into deterministic chunks", () => {
    const text = "x".repeat(140_000);
    const chunks = chunkLargePasteText(text, 64_000);

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(64_000);
    expect(chunks[1]).toHaveLength(64_000);
    expect(chunks[2]).toHaveLength(12_000);
    expect(chunks.join("")).toBe(text);
  });

  it("should require confirmation when large paste overflows document capacity", () => {
    const shouldConfirm = shouldConfirmOverflowPaste({
      currentLength: EDITOR_DOCUMENT_CHARACTER_LIMIT - 100,
      pasteLength: LARGE_PASTE_THRESHOLD_CHARS,
    });
    expect(shouldConfirm).toBe(true);
  });

  it("should expose capacity warning when document length reaches limit", () => {
    expect(
      shouldWarnDocumentCapacity(EDITOR_DOCUMENT_CHARACTER_LIMIT - 1),
    ).toBe(false);
    expect(shouldWarnDocumentCapacity(EDITOR_DOCUMENT_CHARACTER_LIMIT)).toBe(
      true,
    );
  });

  it("should fallback to empty doc when persisted content is invalid JSON", () => {
    expect(parseEditorContentJsonSafely("{invalid")).toEqual({
      type: "doc",
      content: [{ type: "paragraph" }],
    });
  });

  it("S2-BA-1 should show Bubble Menu with inline actions when selection is non-empty", async () => {
    const store = createReadyEditorStore({ onSave: () => {} });
    const versionStore = createVersionStoreForEditorPaneTests();

    render(
      <VersionStoreProvider store={versionStore}>
        <EditorStoreProvider store={store}>
          <EditorPane projectId="project-1" />
        </EditorStoreProvider>
      </VersionStoreProvider>,
    );

    await screen.findByTestId("editor-pane");
    await screen.findByTestId("tiptap-editor");

    const editor = await waitForEditorInstance(store);

    act(() => {
      editor.commands.focus("start");
      editor.commands.setTextSelection({ from: 1, to: 6 });
    });

    await waitFor(() => {
      expect(screen.getByTestId("editor-bubble-menu")).toBeInTheDocument();
    });

    expect(screen.getByTestId("bubble-bold")).toBeInTheDocument();
    expect(screen.getByTestId("bubble-italic")).toBeInTheDocument();
    expect(screen.getByTestId("bubble-underline")).toBeInTheDocument();
    expect(screen.getByTestId("bubble-strike")).toBeInTheDocument();
    expect(screen.getByTestId("bubble-code")).toBeInTheDocument();
    expect(screen.getByTestId("bubble-link")).toBeInTheDocument();
    expect(screen.getByTestId("bubble-ai-polish")).toBeInTheDocument();
    expect(screen.getByTestId("bubble-ai-rewrite")).toBeInTheDocument();
    expect(screen.getByTestId("bubble-ai-describe")).toBeInTheDocument();
    expect(screen.getByTestId("bubble-ai-dialogue")).toBeInTheDocument();
  });

  it("should apply format through Bubble Menu while preserving selection and syncing toolbar active state", async () => {
    const store = createReadyEditorStore({ onSave: () => {} });
    const versionStore = createVersionStoreForEditorPaneTests();

    render(
      <VersionStoreProvider store={versionStore}>
        <EditorStoreProvider store={store}>
          <EditorPane projectId="project-1" />
        </EditorStoreProvider>
      </VersionStoreProvider>,
    );

    await screen.findByTestId("editor-pane");
    await screen.findByTestId("tiptap-editor");

    const editor = await waitForEditorInstance(store);

    act(() => {
      editor.commands.focus("start");
      editor.commands.setTextSelection({ from: 1, to: 6 });
    });

    const bubbleBold = await screen.findByTestId("bubble-bold");
    fireEvent.click(bubbleBold);

    await waitFor(() => {
      expect(editor.isActive("bold")).toBe(true);
      expect(editor.state.selection.empty).toBe(false);
      expect(screen.getByTestId("toolbar-bold")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });

  it("should apply link from Bubble Menu after entering URL", async () => {
    const store = createReadyEditorStore({ onSave: () => {} });
    const versionStore = createVersionStoreForEditorPaneTests();

    render(
      <VersionStoreProvider store={versionStore}>
        <EditorStoreProvider store={store}>
          <EditorPane projectId="project-1" />
        </EditorStoreProvider>
      </VersionStoreProvider>,
    );

    await screen.findByTestId("editor-pane");
    await screen.findByTestId("tiptap-editor");

    const editor = await waitForEditorInstance(store);

    act(() => {
      editor.commands.focus("start");
      editor.commands.setTextSelection({ from: 1, to: 6 });
    });

    fireEvent.click(await screen.findByTestId("bubble-link"));
    const input = await screen.findByLabelText("Enter URL");
    fireEvent.change(input, { target: { value: "https://creonow.dev" } });
    fireEvent.click(screen.getByTestId("link-apply"));

    await waitFor(() => {
      expect(editor.getHTML()).toContain('href="https://creonow.dev"');
      expect(editor.isActive("link")).toBe(true);
    });
  });

  it("should remove link from Bubble Menu", async () => {
    const store = createReadyEditorStore({ onSave: () => {} });
    const versionStore = createVersionStoreForEditorPaneTests();

    render(
      <VersionStoreProvider store={versionStore}>
        <EditorStoreProvider store={store}>
          <EditorPane projectId="project-1" />
        </EditorStoreProvider>
      </VersionStoreProvider>,
    );

    await screen.findByTestId("editor-pane");
    await screen.findByTestId("tiptap-editor");

    const editor = await waitForEditorInstance(store);

    act(() => {
      editor.commands.focus("start");
      editor.commands.setTextSelection({ from: 1, to: 6 });
    });

    fireEvent.click(await screen.findByTestId("bubble-link"));
    const input = await screen.findByLabelText("Enter URL");
    fireEvent.change(input, { target: { value: "https://creonow.dev" } });
    fireEvent.click(screen.getByTestId("link-apply"));

    await waitFor(() => {
      expect(editor.isActive("link")).toBe(true);
    });

    act(() => {
      editor.commands.focus("start");
      editor.commands.setTextSelection({ from: 1, to: 6 });
    });

    fireEvent.click(await screen.findByTestId("bubble-link"));
    fireEvent.click(await screen.findByTestId("link-remove"));

    await waitFor(() => {
      expect(editor.getHTML()).not.toContain('href="https://creonow.dev"');
      expect(editor.isActive("link")).toBe(false);
    });
  });
});

describe("EditorPane — selection and inline AI", () => {
  it("S2-BA-1 should hide Bubble Menu when selection is collapsed", async () => {
    const store = createReadyEditorStore({ onSave: () => {} });
    const versionStore = createVersionStoreForEditorPaneTests();

    render(
      <VersionStoreProvider store={versionStore}>
        <EditorStoreProvider store={store}>
          <EditorPane projectId="project-1" />
        </EditorStoreProvider>
      </VersionStoreProvider>,
    );

    await screen.findByTestId("editor-pane");
    await screen.findByTestId("tiptap-editor");

    const editor = await waitForEditorInstance(store);

    act(() => {
      editor.commands.focus("start");
      editor.commands.setTextSelection({ from: 1, to: 6 });
    });

    await screen.findByTestId("editor-bubble-menu");

    act(() => {
      editor.commands.setTextSelection({ from: 6, to: 6 });
    });

    await waitFor(() => {
      expect(
        screen.queryByTestId("editor-bubble-menu"),
      ).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId("bubble-ai-polish")).not.toBeInTheDocument();
  });

  it("A0-12 should run inline ai via aiStore and persist AI apply on accept", async () => {
    const skillRuns: IpcRequest<"ai:skill:run">[] = [];
    const aiApplySaves: IpcRequest<"file:document:save">[] = [];
    const store = createReadyEditorStore({ onSave: () => {} });
    const versionStore = createVersionStoreForEditorPaneTests();
    const aiStore = createAiStoreForEditorPaneTests({
      onSkillRun: (payload) => {
        skillRuns.push(payload);
      },
      onPersistAiApply: (payload) => {
        aiApplySaves.push(payload);
      },
      outputText: "Inline rewrite result",
    });

    render(
      <AiStoreProvider store={aiStore}>
        <VersionStoreProvider store={versionStore}>
          <EditorStoreProvider store={store}>
            <EditorPane projectId="project-1" />
          </EditorStoreProvider>
        </VersionStoreProvider>
      </AiStoreProvider>,
    );

    await screen.findByTestId("editor-pane");
    await screen.findByTestId("tiptap-editor");

    const editor = await waitForEditorInstance(store);
    const inlineStore = createInlineAiStore();

    let capturedSelection: ReturnType<typeof captureSelectionRef> | null = null;
    act(() => {
      editor.commands.focus("start");
      editor.commands.setTextSelection({ from: 1, to: 8 });
      capturedSelection = captureSelectionRef(editor);
      if (!capturedSelection.ok) {
        throw new Error("expected non-empty selection");
      }
      inlineStore.getState().openInput({
        from: capturedSelection.data.selectionRef.range.from,
        to: capturedSelection.data.selectionRef.range.to,
        text: capturedSelection.data.selectionText,
        selectionTextHash:
          capturedSelection.data.selectionRef.selectionTextHash,
      });
    });

    render(
      <AiStoreProvider store={aiStore}>
        <InlineAiOverlay
          inlineAiStore={inlineStore}
          editor={editor}
          projectId="project-1"
          documentId="doc-1"
        />
      </AiStoreProvider>,
    );

    const input = await screen.findByTestId("inline-ai-instruction-input");
    fireEvent.change(input, { target: { value: "Rewrite formally" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(skillRuns).toHaveLength(1);
    });

    expect(skillRuns[0]).toMatchObject({
      skillId: "builtin:rewrite",
      context: {
        projectId: "project-1",
        documentId: "doc-1",
      },
    });
    expect(skillRuns[0]?.input).toContain(`Selection context:
Initial`);
    expect(skillRuns[0]?.input).toContain("Rewrite formally");

    await waitFor(() => {
      expect(screen.getByTestId("inline-ai-accept-btn")).toBeEnabled();
    });

    fireEvent.click(screen.getByTestId("inline-ai-accept-btn"));

    await waitFor(() => {
      expect(aiApplySaves).toHaveLength(1);
    });

    expect(aiApplySaves[0]).toMatchObject({
      actor: "ai",
      reason: "ai-accept",
      projectId: "project-1",
      documentId: "doc-1",
    });
    expect(editor.getText()).toBe("Inline rewrite result");
  });

  it("S2-BA-2 should trigger mapped skill with selection text and selection reference when clicking Bubble AI item", async () => {
    const skillRuns: IpcRequest<"ai:skill:run">[] = [];
    const store = createReadyEditorStore({ onSave: () => {} });
    const versionStore = createVersionStoreForEditorPaneTests();
    const aiStore = createAiStoreForEditorPaneTests({
      onSkillRun: (payload) => {
        skillRuns.push(payload);
      },
    });

    render(
      <AiStoreProvider store={aiStore}>
        <VersionStoreProvider store={versionStore}>
          <EditorStoreProvider store={store}>
            <EditorPane projectId="project-1" />
          </EditorStoreProvider>
        </VersionStoreProvider>
      </AiStoreProvider>,
    );

    await screen.findByTestId("editor-pane");
    await screen.findByTestId("tiptap-editor");

    const editor = await waitForEditorInstance(store);

    act(() => {
      editor.commands.focus("start");
      editor.commands.setTextSelection({ from: 1, to: 8 });
    });

    fireEvent.click(await screen.findByTestId("bubble-ai-rewrite"));

    await waitFor(() => {
      expect(skillRuns).toHaveLength(1);
    });

    expect(skillRuns[0]).toMatchObject({
      skillId: "builtin:rewrite",
      input: "Initial",
      context: {
        projectId: "project-1",
        documentId: "doc-1",
      },
    });

    const aiState = aiStore.getState();
    expect(aiState.selectionText).toBe("Initial");
    expect(aiState.selectionRef?.range).toEqual({ from: 1, to: 8 });
    expect(aiState.selectionRef?.selectionTextHash).toBeTruthy();
  });
});

describe("EditorPane — advanced", () => {
  it("should suppress Bubble Menu in code block and disable inline toolbar buttons", async () => {
    const store = createReadyEditorStore({ onSave: () => {} });
    const versionStore = createVersionStoreForEditorPaneTests();

    render(
      <VersionStoreProvider store={versionStore}>
        <EditorStoreProvider store={store}>
          <EditorPane projectId="project-1" />
        </EditorStoreProvider>
      </VersionStoreProvider>,
    );

    await screen.findByTestId("editor-pane");
    await screen.findByTestId("tiptap-editor");

    const editor = await waitForEditorInstance(store);

    act(() => {
      editor.commands.setContent({
        type: "doc",
        content: [
          {
            type: "codeBlock",
            content: [{ type: "text", text: "const x = 1;" }],
          },
        ],
      });
      editor.commands.focus("start");
      editor.commands.setTextSelection({ from: 2, to: 8 });
    });

    await waitFor(() => {
      expect(
        screen.queryByTestId("editor-bubble-menu"),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("toolbar-bold")).toBeDisabled();
    expect(screen.getByTestId("toolbar-italic")).toBeDisabled();
    expect(screen.getByTestId("toolbar-underline")).toBeDisabled();
    expect(screen.getByTestId("toolbar-strike")).toBeDisabled();
    expect(screen.getByTestId("toolbar-code")).toBeDisabled();
  });

  it("should place Bubble Menu below selection when top boundary has insufficient space", async () => {
    const store = createReadyEditorStore({ onSave: () => {} });
    const versionStore = createVersionStoreForEditorPaneTests();
    const originalGetBoundingClientRect = Range.prototype.getBoundingClientRect;

    Object.defineProperty(Range.prototype, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        x: 0,
        y: 4,
        width: 120,
        height: 16,
        top: 4,
        right: 120,
        bottom: 20,
        left: 0,
        toJSON: () => ({}),
      }),
    });

    try {
      render(
        <VersionStoreProvider store={versionStore}>
          <EditorStoreProvider store={store}>
            <EditorPane projectId="project-1" />
          </EditorStoreProvider>
        </VersionStoreProvider>,
      );

      await screen.findByTestId("editor-pane");
      await screen.findByTestId("tiptap-editor");

      const editor = await waitForEditorInstance(store);

      act(() => {
        editor.commands.focus("start");
        editor.commands.setTextSelection({ from: 1, to: 6 });
      });

      await waitFor(() => {
        expect(screen.getByTestId("editor-bubble-menu")).toHaveAttribute(
          "data-bubble-placement",
          "bottom",
        );
      });
    } finally {
      Object.defineProperty(Range.prototype, "getBoundingClientRect", {
        configurable: true,
        value: originalGetBoundingClientRect,
      });
    }
  });

  it("should render preview banner and disable editor toolbar when preview mode is active", async () => {
    const store = createReadyEditorStore({
      onSave: () => undefined,
    });
    const versionStore = createVersionStoreForEditorPaneTests();

    versionStore.setState({
      previewStatus: "ready",
      previewVersionId: "v-1",
      previewTimestamp: "2 小时前",
      previewContentJson: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "History版本内容" }],
          },
        ],
      }),
      previewError: null,
    });

    render(
      <VersionStoreProvider store={versionStore}>
        <EditorStoreProvider store={store}>
          <EditorPane projectId="project-1" />
        </EditorStoreProvider>
      </VersionStoreProvider>,
    );

    expect(
      await screen.findByTestId("editor-preview-banner"),
    ).toHaveTextContent("Previewing version from 2 小时前");

    const editor = await screen.findByTestId("tiptap-editor");
    await waitFor(() => {
      expect(editor).toHaveAttribute("contenteditable", "false");
    });

    expect(screen.getByTestId("toolbar-bold")).toBeDisabled();
    expect(screen.getByTestId("toolbar-undo")).toBeDisabled();
  });

  it("should return to current version when clicking return button in preview banner", async () => {
    const store = createReadyEditorStore({
      onSave: () => undefined,
    });
    const versionStore = createVersionStoreForEditorPaneTests();

    versionStore.setState({
      previewStatus: "ready",
      previewVersionId: "v-2",
      previewTimestamp: "Yesterday",
      previewContentJson: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "History版本" }],
          },
        ],
      }),
      previewError: null,
    });

    render(
      <VersionStoreProvider store={versionStore}>
        <EditorStoreProvider store={store}>
          <EditorPane projectId="project-1" />
        </EditorStoreProvider>
      </VersionStoreProvider>,
    );

    const returnButton = await screen.findByRole("button", {
      name: "Back to current version",
    });
    fireEvent.click(returnButton);

    expect(versionStore.getState().previewStatus).toBe("idle");
    expect(versionStore.getState().previewVersionId).toBeNull();
  });

  it("[SCN-SF-1] should open slash command panel when typing / in editor", async () => {
    const store = createReadyEditorStore({ onSave: () => {} });
    const versionStore = createVersionStoreForEditorPaneTests();

    render(
      <VersionStoreProvider store={versionStore}>
        <EditorStoreProvider store={store}>
          <EditorPane projectId="project-1" />
        </EditorStoreProvider>
      </VersionStoreProvider>,
    );

    const editorRoot = await screen.findByTestId("tiptap-editor");
    const editor = await waitForEditorInstance(store);
    act(() => {
      editor.commands.focus("end");
    });
    fireEvent.keyDown(editorRoot, { key: "/" });

    await waitFor(() => {
      expect(screen.getByTestId("slash-command-panel")).toBeInTheDocument();
    });
  });

  it("[SCN-SF-1b] should keep slash logic disabled after leaving zen mode if / was typed inside zen mode", async () => {
    const store = createReadyEditorStore({ onSave: () => {} });
    const versionStore = createVersionStoreForEditorPaneTests();
    const layoutStore = createLayoutStore(createPreferenceStub());
    layoutStore.setState({ zenMode: true });

    render(
      <LayoutStoreProvider store={layoutStore}>
        <VersionStoreProvider store={versionStore}>
          <EditorStoreProvider store={store}>
            <EditorPane projectId="project-1" />
          </EditorStoreProvider>
        </VersionStoreProvider>
      </LayoutStoreProvider>,
    );

    const editorRoot = await screen.findByTestId("tiptap-editor");
    const editor = await waitForEditorInstance(store);
    act(() => {
      editor.commands.focus("end");
    });
    fireEvent.keyDown(editorRoot, { key: "/" });

    await waitFor(() => {
      expect(
        screen.queryByTestId("slash-command-panel"),
      ).not.toBeInTheDocument();
    });

    act(() => {
      layoutStore.setState({ zenMode: false });
    });

    await waitFor(() => {
      expect(
        screen.queryByTestId("slash-command-panel"),
      ).not.toBeInTheDocument();
    });
  });

  it("[SCN-SF-2] should filter slash candidates by keyword and render empty state", async () => {
    const store = createReadyEditorStore({ onSave: () => {} });
    const versionStore = createVersionStoreForEditorPaneTests();

    render(
      <VersionStoreProvider store={versionStore}>
        <EditorStoreProvider store={store}>
          <EditorPane projectId="project-1" />
        </EditorStoreProvider>
      </VersionStoreProvider>,
    );

    const editorRoot = await screen.findByTestId("tiptap-editor");
    const editor = await waitForEditorInstance(store);
    act(() => {
      editor.commands.focus("end");
    });
    fireEvent.keyDown(editorRoot, { key: "/" });
    await screen.findByTestId("slash-command-panel");

    const searchInput = screen.getByTestId(
      "slash-command-search-input",
    ) as HTMLInputElement;

    fireEvent.change(searchInput, {
      target: { value: "out" },
    });
    expect(
      screen.getByTestId("slash-command-item-outline"),
    ).toBeInTheDocument();

    fireEvent.change(searchInput, {
      target: { value: "not-exist-keyword" },
    });
    expect(screen.getByTestId("slash-command-empty-state")).toBeInTheDocument();
  });

  it("[SCN-SF-3] should close slash panel on Escape and keep normal typing", async () => {
    const store = createReadyEditorStore({ onSave: () => {} });
    const versionStore = createVersionStoreForEditorPaneTests();

    render(
      <VersionStoreProvider store={versionStore}>
        <EditorStoreProvider store={store}>
          <EditorPane projectId="project-1" />
        </EditorStoreProvider>
      </VersionStoreProvider>,
    );

    const editorRoot = await screen.findByTestId("tiptap-editor");
    const editor = await waitForEditorInstance(store);
    act(() => {
      editor.commands.focus("end");
    });
    fireEvent.keyDown(editorRoot, { key: "/" });
    await screen.findByTestId("slash-command-panel");

    fireEvent.keyDown(editorRoot, { key: "Escape" });
    await waitFor(() => {
      expect(
        screen.queryByTestId("slash-command-panel"),
      ).not.toBeInTheDocument();
    });

    act(() => {
      editor.commands.insertContent("x");
    });
    await waitFor(() => {
      expect(editor.getText()).toContain("x");
      expect(
        screen.queryByTestId("slash-command-panel"),
      ).not.toBeInTheDocument();
    });
  });
});

describe("EditorPane — coverImage integration", () => {
  it("renders EditorFeaturedImage when coverImage prop is provided", async () => {
    const store = createReadyEditorStore({ onSave: () => {} });
    const versionStore = createVersionStoreForEditorPaneTests();

    render(
      <VersionStoreProvider store={versionStore}>
        <EditorStoreProvider store={store}>
          <EditorPane
            projectId="project-1"
            coverImage="https://example.com/cover.jpg"
          />
        </EditorStoreProvider>
      </VersionStoreProvider>,
    );

    await screen.findByTestId("editor-pane");
    expect(screen.getByTestId("featured-image-container")).toBeInTheDocument();
  });

  it("does not render EditorFeaturedImage when coverImage is not provided", async () => {
    const store = createReadyEditorStore({ onSave: () => {} });
    const versionStore = createVersionStoreForEditorPaneTests();

    render(
      <VersionStoreProvider store={versionStore}>
        <EditorStoreProvider store={store}>
          <EditorPane projectId="project-1" />
        </EditorStoreProvider>
      </VersionStoreProvider>,
    );

    await screen.findByTestId("editor-pane");
    expect(
      screen.queryByTestId("featured-image-container"),
    ).not.toBeInTheDocument();
  });
});
