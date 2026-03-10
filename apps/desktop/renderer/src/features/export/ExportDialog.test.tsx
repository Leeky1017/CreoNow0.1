import { afterEach, beforeAll, describe, it, expect, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { IpcError } from "@shared/types/ipc-generated";
import { ExportDialog } from "./ExportDialog";
import * as ipcClient from "../../lib/ipcClient";
import { i18n } from "../../i18n";

vi.mock("@radix-ui/react-dialog", async (importOriginal) => {
  const React = await import("react");
  const actual = await importOriginal<typeof import("@radix-ui/react-dialog")>();

  return {
    ...actual,
    Root: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Overlay: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    Content: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    Title: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 {...props}>{children}</h2>
    ),
    Description: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p {...props}>{children}</p>
    ),
    Close: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
  };
});

vi.mock("../../components/primitives", async () => {
  const actual = await vi.importActual<typeof import("../../components/primitives")>(
    "../../components/primitives",
  );

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

describe("ExportDialog", () => {
  it("renders config view with Markdown selected by default", () => {
    render(
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
    render(
      <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
    );

    expect(screen.getByTestId("export-format-pdf")).not.toBeDisabled();
    expect(screen.getByTestId("export-format-docx")).not.toBeDisabled();
    expect(screen.getByTestId("export-format-txt")).not.toBeDisabled();
    expect(screen.getByTestId("export-format-markdown")).not.toBeDisabled();
  });

  it("disables Export when projectId is missing", () => {
    render(<ExportDialog open={true} onOpenChange={() => {}} />);

    expect(screen.getByTestId("export-submit")).toBeDisabled();
    expect(screen.getByText(/NO_PROJECT:/)).toBeInTheDocument();
  });

  it("renders controlled progress view", () => {
    render(
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
    render(
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

    render(
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

  it("shows explicit error and avoids success state when export IPC throws", async () => {
    const user = userEvent.setup();
    vi.spyOn(ipcClient, "invoke").mockRejectedValueOnce(
      new Error("disk write permission denied"),
    );

    render(
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
});

describe("ExportDialog format capability hints", () => {
  it("shows plain text hint for PDF and DOCX format options", async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    render(
      <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
    );

    const hints = screen.getAllByText("Plain text export · no formatting");
    expect(hints).toHaveLength(2);
  });

  it("keeps Markdown format description as .md", async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    render(
      <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
    );

    expect(screen.getByText(".md")).toBeInTheDocument();
  });

  it("keeps TXT format description as .txt", async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    render(
      <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
    );

    expect(screen.getByText(".txt")).toBeInTheDocument();
  });

  it("shows Chinese hint when locale is zh-CN", async () => {
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
    render(
      <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
    );

    const hints = screen.getAllByText("纯文本导出 · 不含格式");
    expect(hints.length).toBeGreaterThanOrEqual(2);
  });

  it("shows English hint when locale is en", async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    render(
      <ExportDialog open={true} onOpenChange={() => {}} projectId="test" />,
    );

    const hints = screen.getAllByText("Plain text export · no formatting");
    expect(hints.length).toBeGreaterThanOrEqual(2);
  });
});
