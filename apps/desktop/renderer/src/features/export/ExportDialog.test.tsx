import { afterEach, beforeAll, describe, it, expect, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import type { IpcError } from "@shared/types/ipc-generated";
import { AppToastProvider } from "../../components/providers/AppToastProvider";
import { ExportDialog } from "./ExportDialog";
import * as ipcClient from "../../lib/ipcClient";
import { i18n } from "../../i18n";

// =============================================================================
// Mock 设置
// =============================================================================

vi.mock("@radix-ui/react-dialog", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;

  return {
    ...actual,
    Root: ({ children }: { children: ReactNode }) => <>{children}</>,
    Portal: ({ children }: { children: ReactNode }) => <>{children}</>,
    Overlay: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    Content: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    Title: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
      <h2 {...props}>{children}</h2>
    ),
    Description: ({
      children,
      ...props
    }: HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
    Close: ({
      children,
      ...props
    }: ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
  };
});

vi.mock("../../components/primitives", async () => {
  const actual = await vi.importActual("../../components/primitives");

  return {
    ...actual,
    Select: ({
      value,
      onValueChange,
      options,
      disabled,
    }: {
      value: string;
      onValueChange?: (value: string) => void;
      options: Array<{ value: string; label: string }>;
      disabled?: boolean;
    }) => (
      <select
        data-testid="export-page-size-select"
        value={value}
        disabled={disabled}
        onChange={(event) => onValueChange?.(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ),
  };
});

vi.mock("@radix-ui/react-radio-group", async () => {
  const React = await import("react");
  const RadioGroupContext = React.createContext<{
    value?: string;
    onValueChange?: (value: string) => void;
  }>({});

  return {
    Root: ({
      children,
      value,
      onValueChange,
      ...props
    }: {
      children: React.ReactNode;
      value?: string;
      onValueChange?: (value: string) => void;
    } & React.HTMLAttributes<HTMLDivElement>) => (
      <RadioGroupContext.Provider value={{ value, onValueChange }}>
        <div {...props} data-value={value}>
          {children}
        </div>
      </RadioGroupContext.Provider>
    ),
    Item: ({
      children,
      value,
      disabled,
      ...props
    }: {
      children: React.ReactNode;
      value: string;
      disabled?: boolean;
    } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
      const radioGroup = React.useContext(RadioGroupContext);
      const isChecked = radioGroup.value === value;

      return (
        <button
          type="button"
          role="radio"
          aria-checked={isChecked}
          data-state={isChecked ? "checked" : "unchecked"}
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              radioGroup.onValueChange?.(value);
            }
          }}
          {...props}
        >
          {children}
        </button>
      );
    },
  };
});

// =============================================================================
// 测试生命周期
// =============================================================================

beforeAll(async () => {
  await act(async () => {
    await i18n.changeLanguage("en");
  });
});

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  await act(async () => {
    await i18n.changeLanguage("en");
  });
});

function renderWithToastProvider(ui: JSX.Element) {
  return render(<AppToastProvider>{ui}</AppToastProvider>);
}

describe("ExportDialog", () => {
  // ===========================================================================
  // 渲染 — 基础渲染与默认状态
  // ===========================================================================
  describe("渲染", () => {
    it("open 为 true 时渲染对话框", () => {
      renderWithToastProvider(
        <ExportDialog
          open={true}
          onOpenChange={() => {}}
          projectId="test-project"
          documentTitle="Test Document"
        />,
      );

      expect(screen.getByTestId("export-dialog")).toBeInTheDocument();
      expect(screen.getByText("Export Document")).toBeInTheDocument();
      expect(screen.getByText("Test Document")).toBeInTheDocument();
    });

    it("默认选中 Markdown 格式", () => {
      renderWithToastProvider(
        <ExportDialog
          open={true}
          onOpenChange={() => {}}
          projectId="test-project"
        />,
      );

      expect(screen.getByTestId("export-format-markdown")).toHaveAttribute(
        "data-state",
        "checked",
      );
    });

    it("预览区显示当前格式和页面尺寸", () => {
      renderWithToastProvider(
        <ExportDialog
          open={true}
          onOpenChange={() => {}}
          projectId="test-project"
        />,
      );

      expect(screen.getByText("MARKDOWN • A4")).toBeInTheDocument();
    });

    it("所有 4 种导出格式均可用（无禁用项）", () => {
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
      );

      expect(screen.getByTestId("export-format-pdf")).not.toBeDisabled();
      expect(screen.getByTestId("export-format-docx")).not.toBeDisabled();
      expect(screen.getByTestId("export-format-txt")).not.toBeDisabled();
      expect(screen.getByTestId("export-format-markdown")).not.toBeDisabled();
    });

    it("缺少 documentTitle 时使用默认标题", () => {
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
      );

      expect(screen.getByText("Untitled Document")).toBeInTheDocument();
    });

    it("显示设置选项区域（元数据 / 版本历史 / 嵌入图片）", () => {
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
      );

      expect(screen.getByText("Include metadata")).toBeInTheDocument();
      expect(screen.getByText("Version history")).toBeInTheDocument();
      expect(screen.getByText("Embed images")).toBeInTheDocument();
    });

    it("显示页面尺寸选择器", () => {
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
      );

      expect(screen.getByTestId("export-page-size-select")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 交互 — 格式切换与选项变更
  // ===========================================================================
  describe("交互", () => {
    it("点击格式卡片切换选中格式", async () => {
      const user = userEvent.setup();
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
      );

      await user.click(screen.getByTestId("export-format-pdf"));

      expect(screen.getByTestId("export-format-pdf")).toHaveAttribute(
        "data-state",
        "checked",
      );
      expect(screen.getByTestId("export-format-markdown")).toHaveAttribute(
        "data-state",
        "unchecked",
      );
    });

    it("非 PDF 格式时页面尺寸选择器禁用", () => {
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
      );

      // Markdown is default — page size should be disabled
      expect(screen.getByTestId("export-page-size-select")).toBeDisabled();
    });

    it("切换到 PDF 格式后页面尺寸选择器启用", async () => {
      const user = userEvent.setup();
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
      );

      await user.click(screen.getByTestId("export-format-pdf"));

      expect(screen.getByTestId("export-page-size-select")).not.toBeDisabled();
    });

    it("切换页面尺寸后预览区更新", async () => {
      const user = userEvent.setup();
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
      );

      await user.click(screen.getByTestId("export-format-pdf"));
      await user.selectOptions(
        screen.getByTestId("export-page-size-select"),
        "letter",
      );

      expect(screen.getByText("PDF • LETTER")).toBeInTheDocument();
    });

    it("点击 Cancel 按钮调用 onOpenChange(false)", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      renderWithToastProvider(
        <ExportDialog
          open={true}
          onOpenChange={onOpenChange}
          projectId="test"
        />,
      );

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // ===========================================================================
  // 验证 — 导出前置条件检查
  // ===========================================================================
  describe("验证", () => {
    it("缺少 projectId 时导出按钮禁用并显示提示", () => {
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} />,
      );

      expect(screen.getByTestId("export-submit")).toBeDisabled();
      expect(
        screen.getByText("Please open a project first"),
      ).toBeInTheDocument();
    });

    it("projectId 为空字符串时导出按钮禁用", () => {
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="" />,
      );

      expect(screen.getByTestId("export-submit")).toBeDisabled();
    });

    it("projectId 存在时导出按钮启用", () => {
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="p1" />,
      );

      expect(screen.getByTestId("export-submit")).not.toBeDisabled();
    });
  });

  // ===========================================================================
  // 导出流程 — IPC 调用与状态转换
  // ===========================================================================
  describe("导出流程", () => {
    it("点击导出按钮后进入进度视图", async () => {
      const user = userEvent.setup();
      vi.spyOn(ipcClient, "invoke").mockImplementation(
        () => new Promise(() => {}),
      );

      renderWithToastProvider(
        <ExportDialog
          open={true}
          onOpenChange={() => {}}
          projectId="test-project"
          documentId="doc-1"
        />,
      );

      await user.click(screen.getByTestId("export-submit"));

      expect(screen.getAllByText("Exporting Document")).toHaveLength(2);
    });

    it("导出成功后进入成功视图并显示结果", async () => {
      const user = userEvent.setup();
      vi.spyOn(ipcClient, "invoke").mockResolvedValueOnce({
        ok: true,
        data: { relativePath: "exports/doc.md", bytesWritten: 1024 },
      });

      renderWithToastProvider(
        <ExportDialog
          open={true}
          onOpenChange={() => {}}
          projectId="test-project"
          documentId="doc-1"
        />,
      );

      await user.click(screen.getByTestId("export-submit"));

      expect(await screen.findByTestId("export-success")).toBeInTheDocument();
      expect(
        screen.getByTestId("export-success-relative-path"),
      ).toHaveTextContent("exports/doc.md");
      expect(
        screen.getByTestId("export-success-bytes-written"),
      ).toHaveTextContent("1024");
    });

    it("成功视图点击 Done 关闭对话框", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      vi.spyOn(ipcClient, "invoke").mockResolvedValueOnce({
        ok: true,
        data: { relativePath: "exports/doc.md", bytesWritten: 100 },
      });

      renderWithToastProvider(
        <ExportDialog
          open={true}
          onOpenChange={onOpenChange}
          projectId="test-project"
          documentId="doc-1"
        />,
      );

      await user.click(screen.getByTestId("export-submit"));
      await screen.findByTestId("export-success");
      await user.click(screen.getByTestId("export-done"));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // ===========================================================================
  // 受控模式 — view / progress / result props
  // ===========================================================================
  describe("受控模式", () => {
    it("受控进度视图渲染进度步骤标签", () => {
      renderWithToastProvider(
        <ExportDialog
          open={true}
          onOpenChange={() => {}}
          projectId="test"
          view="progress"
          progress={42}
          progressStep="Exporting..."
        />,
      );

      expect(screen.getAllByText("Exporting Document")).toHaveLength(2);
      expect(screen.getByText("Exporting...")).toBeInTheDocument();
      expect(screen.getByText("42%")).toBeInTheDocument();
    });

    it("受控成功视图渲染结果字段", () => {
      renderWithToastProvider(
        <ExportDialog
          open={true}
          onOpenChange={() => {}}
          projectId="test"
          view="success"
          result={{ relativePath: "exports/test/doc.md", bytesWritten: 99 }}
        />,
      );

      expect(screen.getByTestId("export-success")).toBeInTheDocument();
      expect(
        screen.getByTestId("export-success-relative-path"),
      ).toHaveTextContent("exports/test/doc.md");
      expect(
        screen.getByTestId("export-success-bytes-written"),
      ).toHaveTextContent("99");
    });
  });

  // ===========================================================================
  // 错误处理 — 各类 IPC 错误的展示与恢复
  // ===========================================================================
  describe("错误处理", () => {
    it("受控 error prop 渲染错误横幅，显示人类可读消息", () => {
      const error: IpcError = { code: "IO_ERROR", message: "failed" };

      renderWithToastProvider(
        <ExportDialog
          open={true}
          onOpenChange={() => {}}
          projectId="test"
          error={error}
        />,
      );

      expect(screen.getByTestId("export-error")).toBeInTheDocument();
      expect(screen.queryByTestId("export-error-code")).not.toBeInTheDocument();
      expect(screen.getByTestId("export-error-message")).toHaveTextContent(
        "Read/write operation failed. Please try again.",
      );
      expect(
        screen.getByRole("button", { name: "Dismiss" }),
      ).toBeInTheDocument();
    });

    it("IPC 抛异常时显示错误并保持在配置视图", async () => {
      const user = userEvent.setup();
      vi.spyOn(ipcClient, "invoke").mockRejectedValueOnce(
        new Error("disk write permission denied"),
      );

      renderWithToastProvider(
        <ExportDialog
          open={true}
          onOpenChange={() => {}}
          projectId="test-project"
          documentId="doc-1"
        />,
      );

      await user.click(screen.getByTestId("export-submit"));

      expect(await screen.findByTestId("export-error")).toBeInTheDocument();
      expect(screen.getByTestId("export-error-message")).toHaveTextContent(
        "Read/write operation failed. Please try again.",
      );
      expect(screen.queryByTestId("export-success")).not.toBeInTheDocument();
    });

    it("IPC 返回 ok:false 时显示错误并保持在配置视图", async () => {
      const user = userEvent.setup();
      vi.spyOn(ipcClient, "invoke").mockResolvedValueOnce({
        ok: false,
        error: {
          code: "PERMISSION_DENIED",
          message: "Cannot write to directory",
        },
      });

      renderWithToastProvider(
        <ExportDialog
          open={true}
          onOpenChange={() => {}}
          projectId="test-project"
          documentId="doc-1"
        />,
      );

      await user.click(screen.getByTestId("export-submit"));

      expect(await screen.findByTestId("export-error")).toBeInTheDocument();
      expect(screen.queryByTestId("export-success")).not.toBeInTheDocument();
    });

    it("unsupported-structure 错误本地化后展示具体节点路径", async () => {
      const user = userEvent.setup();
      vi.spyOn(ipcClient, "invoke").mockResolvedValueOnce({
        ok: false,
        error: {
          code: "INVALID_ARGUMENT",
          message:
            "Export format does not yet support: doc.content.0:table",
        },
      });

      renderWithToastProvider(
        <ExportDialog
          open={true}
          onOpenChange={() => {}}
          projectId="test-project"
          documentId="doc-1"
        />,
      );

      await user.click(screen.getByTestId("export-submit"));

      expect(await screen.findByTestId("export-error")).toBeInTheDocument();
      expect(screen.getByTestId("export-error-message")).toHaveTextContent(
        "This export format cannot write: doc.content.0:table",
      );
    });

    it("点击 Dismiss 按钮清除内部错误横幅", async () => {
      const user = userEvent.setup();
      vi.spyOn(ipcClient, "invoke").mockRejectedValueOnce(
        new Error("test error"),
      );

      renderWithToastProvider(
        <ExportDialog
          open={true}
          onOpenChange={() => {}}
          projectId="test-project"
          documentId="doc-1"
        />,
      );

      await user.click(screen.getByTestId("export-submit"));
      expect(await screen.findByTestId("export-error")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Dismiss" }));
      expect(screen.queryByTestId("export-error")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 国际化 — 格式描述标签多语言
  // ===========================================================================
  describe("国际化", () => {
    it("英文模式下各格式显示结构化能力提示", () => {
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
      );

      expect(screen.getByTestId("export-format-pdf")).toHaveTextContent(
        "Structured pages · headings, lists, images",
      );
      expect(screen.getByTestId("export-format-docx")).toHaveTextContent(
        "Structured Word export · headings, links, images",
      );
      expect(screen.getByTestId("export-format-markdown")).toHaveTextContent(
        "Structured Markdown · headings, lists, links",
      );
      expect(screen.getByTestId("export-format-txt")).toHaveTextContent(
        "Plain text only · formatting removed",
      );
    });

    it("切换到 zh-CN 后各格式显示中文结构化提示", async () => {
      await act(async () => {
        await i18n.changeLanguage("zh-CN");
      });
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
      );

      expect(screen.getByTestId("export-format-pdf")).toHaveTextContent(
        "结构化分页 · 保留标题、列表、图片",
      );
      expect(screen.getByTestId("export-format-docx")).toHaveTextContent(
        "结构化 Word 导出 · 保留标题、链接、图片",
      );
      expect(screen.getByTestId("export-format-markdown")).toHaveTextContent(
        "结构化 Markdown · 保留标题、列表、链接",
      );
      expect(screen.getByTestId("export-format-txt")).toHaveTextContent(
        "纯文本导出 · 自动移除格式",
      );
    });

    it("PDF / DOCX 不显示旧版纯文本描述", () => {
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
      );

      expect(screen.getByTestId("export-format-pdf")).not.toHaveTextContent(
        "Plain text export · no formatting",
      );
      expect(screen.getByTestId("export-format-docx")).not.toHaveTextContent(
        "Plain text export · no formatting",
      );
    });
  });
});
