import { afterEach, beforeAll, describe, it, expect, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

import type { IpcError } from "@shared/types/ipc-generated";
import { AppToastProvider } from "../../components/providers/AppToastProvider";
import { ExportDialog } from "./ExportDialog";
import * as ipcClient from "../../lib/ipcClient";
import { i18n } from "../../i18n";

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
    Description: ({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
      <p {...props}>{children}</p>
    ),
    Close: ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
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
beforeAll(async () => {
  await act(async () => {
    await i18n.changeLanguage("en");
  });
});

afterEach(async () => {
  cleanup();
  await act(async () => {
    await i18n.changeLanguage("en");
  });
});

function renderWithToastProvider(ui: JSX.Element) {
  return render(<AppToastProvider>{ui}</AppToastProvider>);
}

describe("ExportDialog", () => {
  it("renders config view with Markdown selected by default", () => {
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

    expect(screen.getByTestId("export-format-markdown")).toHaveAttribute(
      "data-state",
      "checked",
    );
    expect(screen.getByText("MARKDOWN • A4")).toBeInTheDocument();
  });

  it("enables all export formats (pdf/docx/txt/markdown)", () => {
    renderWithToastProvider(
      <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
    );

    expect(screen.getByTestId("export-format-pdf")).not.toBeDisabled();
    expect(screen.getByTestId("export-format-docx")).not.toBeDisabled();
    expect(screen.getByTestId("export-format-txt")).not.toBeDisabled();
    expect(screen.getByTestId("export-format-markdown")).not.toBeDisabled();
  });

  it("disables Export when projectId is missing", () => {
    renderWithToastProvider(
      <ExportDialog open={true} onOpenChange={() => {}} />,
    );

    expect(screen.getByTestId("export-submit")).toBeDisabled();
    expect(screen.getByText(/NO_PROJECT:/)).toBeInTheDocument();
  });

  it("renders controlled progress view", () => {
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

    // "Exporting Document" appears twice: sr-only title + visible heading
    expect(screen.getAllByText("Exporting Document")).toHaveLength(2);
    expect(screen.getByText("Exporting...")).toBeInTheDocument();
  });

  it("renders controlled success view with result fields", () => {
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

  it("renders error banner in config view when error is provided", () => {
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
    expect(screen.getByTestId("export-error-code")).toHaveTextContent(
      "IO_ERROR",
    );
    expect(screen.getByTestId("export-error-message")).toHaveTextContent(
      "failed",
    );
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });

  describe("format description labels (A0-19)", () => {
    it("shows structured capability hint for PDF format", () => {
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
      );

      const pdfCard = screen.getByTestId("export-format-pdf");
      expect(pdfCard).toHaveTextContent(
        "Structured pages · headings, lists, images",
      );
    });

    it("shows structured capability hint for DOCX format", () => {
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
      );

      const docxCard = screen.getByTestId("export-format-docx");
      expect(docxCard).toHaveTextContent(
        "Structured Word export · headings, links, images",
      );
    });

    it("shows structured capability hint for Markdown format", () => {
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
      );

      const mdCard = screen.getByTestId("export-format-markdown");
      expect(mdCard).toHaveTextContent(
        "Structured Markdown · headings, lists, links",
      );
    });

    it("keeps a plain-text boundary hint for TXT format", () => {
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
      );

      const txtCard = screen.getByTestId("export-format-txt");
      expect(txtCard).toHaveTextContent("Plain text only · formatting removed");
    });

    it("shows Chinese structured hints after switching to zh-CN locale", async () => {
      await act(async () => { await i18n.changeLanguage("zh-CN"); });
      renderWithToastProvider(
        <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
      );

      const pdfCard = screen.getByTestId("export-format-pdf");
      expect(pdfCard).toHaveTextContent("结构化分页 · 保留标题、列表、图片");

      const docxCard = screen.getByTestId("export-format-docx");
      expect(docxCard).toHaveTextContent("结构化 Word 导出 · 保留标题、链接、图片");

      const markdownCard = screen.getByTestId("export-format-markdown");
      expect(markdownCard).toHaveTextContent("结构化 Markdown · 保留标题、列表、链接");

      const txtCard = screen.getByTestId("export-format-txt");
      expect(txtCard).toHaveTextContent("纯文本导出 · 自动移除格式");

      await act(async () => { await i18n.changeLanguage("en"); });
    });

    it("does not show the old plain-text-only copy for PDF or DOCX", () => {
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

  it("shows explicit error and avoids success state when export IPC throws", async () => {
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
    expect(screen.getByTestId("export-error-code")).toHaveTextContent(
      "IO_ERROR",
    );
    expect(screen.getByTestId("export-error-message")).toHaveTextContent(
      "disk write permission denied",
    );
    expect(screen.queryByTestId("export-success")).not.toBeInTheDocument();
  });

  it("localizes unsupported-structure failures before showing them in the error surface", async () => {
    const user = userEvent.setup();
    vi.spyOn(ipcClient, "invoke").mockResolvedValueOnce({
      ok: false,
      error: {
        code: "INVALID_ARGUMENT",
        message: "Export format does not yet support: doc.content.0:table",
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
    expect(screen.getByTestId("export-error-code")).toHaveTextContent(
      "INVALID_ARGUMENT",
    );
    expect(screen.getByTestId("export-error-message")).toHaveTextContent(
      "This export format cannot write: doc.content.0:table",
    );
  });
});

