import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import React from "react";

import { EditorContextMenu } from "./EditorContextMenu";
import {
  EditorStoreProvider,
  createEditorStore,
} from "../../stores/editorStore";
import {
  AiStoreProvider,
  createAiStore,
  type IpcInvoke,
} from "../../stores/aiStore";

/**
 * Minimal mock for TipTap Editor sufficient for context menu testing.
 */
function createMockEditor(overrides?: {
  hasSelection?: boolean;
  isEditable?: boolean;
}) {
  const hasSelection = overrides?.hasSelection ?? true;
  const isEditable = overrides?.isEditable ?? true;

  return {
    isEditable,
    state: {
      selection: {
        empty: !hasSelection,
      },
    },
    isActive: vi.fn().mockReturnValue(false),
    can: vi.fn().mockReturnValue({
      chain: vi.fn().mockReturnValue({
        toggleBold: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleItalic: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleMark: vi.fn().mockReturnValue({ run: vi.fn() }),
        undo: vi.fn().mockReturnValue({ run: vi.fn() }),
        redo: vi.fn().mockReturnValue({ run: vi.fn() }),
      }),
    }),
    chain: vi.fn().mockReturnValue({
      focus: vi.fn().mockReturnValue({
        toggleBold: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleItalic: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleMark: vi.fn().mockReturnValue({ run: vi.fn() }),
        undo: vi.fn().mockReturnValue({ run: vi.fn() }),
        redo: vi.fn().mockReturnValue({ run: vi.fn() }),
        insertContent: vi.fn().mockReturnValue({ run: vi.fn() }),
        run: vi.fn(),
      }),
    }),
    commands: {
      undo: vi.fn(),
      redo: vi.fn(),
    },
  } as unknown;
}

const noopInvoke: IpcInvoke = async () => ({ ok: true, data: {} }) as never;

function createTestEditorStore() {
  const store = createEditorStore({
    invoke: async () => ({ ok: true, data: {} }) as never,
  });
  store.setState({
    bootstrapStatus: "ready",
    projectId: "project-1",
    documentId: "doc-1",
    documentStatus: "draft",
  });
  return store;
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const editorStore = React.useMemo(() => createTestEditorStore(), []);
  const aiStore = React.useMemo(
    () => createAiStore({ invoke: noopInvoke }),
    [],
  );
  return (
    <EditorStoreProvider store={editorStore}>
      <AiStoreProvider store={aiStore}>{children}</AiStoreProvider>
    </EditorStoreProvider>
  );
}

describe("EditorContextMenu", () => {
  /**
   * ED-FE-CM-S1: renders custom context menu with basic actions.
   *
   * Scenario: 编辑区右键弹出 Context Menu（非浏览器默认）
   * 断言：渲染 EditorContextMenu，复制/粘贴/撤销/重做菜单项出现
   */
  it("renders custom context menu with basic actions (ED-FE-CM-S1)", async () => {
    const editor = createMockEditor({ hasSelection: true });

    render(
      <Wrapper>
        <EditorContextMenu editor={editor as never}>
          <div data-testid="editor-area">Editor content</div>
        </EditorContextMenu>
      </Wrapper>,
    );

    // Right-click (context menu trigger)
    const editorArea = screen.getByTestId("editor-area");
    await userEvent.pointer({ keys: "[MouseRight]", target: editorArea });

    // Assert basic action menu items appear
    expect(screen.getByTestId("ctx-copy")).toBeInTheDocument();
    expect(screen.getByTestId("ctx-paste")).toBeInTheDocument();
    expect(screen.getByTestId("ctx-undo")).toBeInTheDocument();
    expect(screen.getByTestId("ctx-redo")).toBeInTheDocument();
  });

  /**
   * ED-FE-CM-S1b: disables format actions when no selection.
   *
   * Scenario: 无选区时格式/AI 动作 disabled
   * 断言：加粗/斜体/润色/改写 disabled
   */
  it("disables format actions when no selection (ED-FE-CM-S1b)", async () => {
    const editor = createMockEditor({ hasSelection: false });

    render(
      <Wrapper>
        <EditorContextMenu editor={editor as never}>
          <div data-testid="editor-area">Editor content</div>
        </EditorContextMenu>
      </Wrapper>,
    );

    const editorArea = screen.getByTestId("editor-area");
    await userEvent.pointer({ keys: "[MouseRight]", target: editorArea });

    // Format actions should be disabled
    const boldItem = screen.getByTestId("ctx-bold");
    const italicItem = screen.getByTestId("ctx-italic");
    const polishItem = screen.getByTestId("ctx-ai-polish");
    const rewriteItem = screen.getByTestId("ctx-ai-rewrite");

    expect(boldItem).toHaveAttribute("data-disabled");
    expect(italicItem).toHaveAttribute("data-disabled");
    expect(polishItem).toHaveAttribute("data-disabled");
    expect(rewriteItem).toHaveAttribute("data-disabled");
  });
});
