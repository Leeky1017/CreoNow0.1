import { beforeAll, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { IpcError } from "@shared/types/ipc-generated";
import { ExportDialog } from "./ExportDialog";
import * as ipcClient from "../../lib/ipcClient";
import { i18n } from "../../i18n";

beforeAll(async () => {
  await i18n.changeLanguage("en");
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
    expect(screen.getByText(/Please open a project first/)).toBeInTheDocument();
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
    expect(screen.getByTestId("export-error")).toHaveTextContent("failed");
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
    expect(screen.getByTestId("export-error")).toHaveTextContent(
      "disk write permission denied",
    );
    expect(screen.queryByTestId("export-success")).not.toBeInTheDocument();
  });
});
