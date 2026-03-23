// axe-core a11y gate: composites and patterns
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

import { Button } from "../components/primitives/Button";
import { Input } from "../components/primitives/Input";
import { Textarea } from "../components/primitives/Textarea";

import { CommandItem } from "../components/composites/CommandItem";
import { ConfirmDialog } from "../components/composites/ConfirmDialog";
import { FormField } from "../components/composites/FormField";
import { InfoBar } from "../components/composites/InfoBar";
import { PanelContainer } from "../components/composites/PanelContainer";
import { SearchInput } from "../components/composites/SearchInput";
import { SidebarItem } from "../components/composites/SidebarItem";
import { ToolbarGroup } from "../components/composites/ToolbarGroup";
import { EmptyState as CompositeEmptyState } from "../components/composites/EmptyState";

import { EmptyState } from "../components/patterns/EmptyState";
import { LoadingState } from "../components/patterns/LoadingState";
import { ErrorState } from "../components/patterns/ErrorState";
import { ErrorBoundary } from "../components/patterns/ErrorBoundary";
import { RegionErrorBoundary } from "../components/patterns/RegionErrorBoundary";
import { RegionFallback } from "../components/patterns/RegionFallback";
import { PanelHeader } from "../components/patterns/PanelHeader";

expect.extend(toHaveNoViolations);

async function expectNoViolations(container: HTMLElement) {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

describe("axe-core a11y gate — composites & patterns", () => {
  // =========================================================================
  // Composites
  // =========================================================================

  it("CommandItem has no axe violations", async () => {
    const { container } = render(
      <div role="listbox" aria-label="Commands">
        <CommandItem label="Copy" onSelect={() => {}} />
        <CommandItem label="Paste" hint="Ctrl+V" onSelect={() => {}} />
        <CommandItem label="Cut" onSelect={() => {}} active />
      </div>,
    );
    await expectNoViolations(container);
  });

  it("ConfirmDialog has no axe violations", async () => {
    const { container } = render(
      <ConfirmDialog
        open={true}
        title="Delete file?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {}}
        onCancel={() => {}}
        destructive
      />,
    );
    await expectNoViolations(container);
  });

  it("FormField has no axe violations", async () => {
    const { container } = render(
      <div>
        <FormField label="Username" htmlFor="ff-username" required>
          <Input id="ff-username" placeholder="Enter username" />
        </FormField>
        <FormField
          label="Bio"
          htmlFor="ff-bio"
          help="Brief description"
          error="Too short"
        >
          <Textarea id="ff-bio" />
        </FormField>
      </div>,
    );
    await expectNoViolations(container);
  });

  it("InfoBar has no axe violations", async () => {
    const { container } = render(
      <div>
        <InfoBar variant="info" message="Informational message" />
        <InfoBar variant="warning" message="Warning message" />
        <InfoBar variant="error" message="Error message" />
        <InfoBar variant="success" message="Success message" />
      </div>,
    );
    await expectNoViolations(container);
  });

  it("PanelContainer has no axe violations", async () => {
    const { container } = render(
      <PanelContainer title="File Manager">
        <p>Panel body content</p>
      </PanelContainer>,
    );
    await expectNoViolations(container);
  });

  it("SearchInput has no axe violations", async () => {
    const { container } = render(
      <SearchInput
        value=""
        onChange={() => {}}
        onClear={() => {}}
        placeholder="Search files..."
      />,
    );
    await expectNoViolations(container);
  });

  it("SidebarItem has no axe violations", async () => {
    const { container } = render(
      <nav aria-label="Sidebar">
        <SidebarItem label="Dashboard" onClick={() => {}} />
        <SidebarItem label="Settings" active onClick={() => {}} />
        <SidebarItem label="Help" onClick={() => {}} />
      </nav>,
    );
    await expectNoViolations(container);
  });

  it("ToolbarGroup has no axe violations", async () => {
    const { container } = render(
      <div role="toolbar" aria-label="Formatting">
        <ToolbarGroup>
          <Button variant="ghost">Bold</Button>
          <Button variant="ghost">Italic</Button>
        </ToolbarGroup>
        <ToolbarGroup separator>
          <Button variant="ghost">Undo</Button>
          <Button variant="ghost">Redo</Button>
        </ToolbarGroup>
      </div>,
    );
    await expectNoViolations(container);
  });

  it("EmptyState (composite) has no axe violations", async () => {
    const { container } = render(
      <CompositeEmptyState
        title="No files yet"
        description="Create your first file to get started."
        action={<Button variant="primary">Create File</Button>}
      />,
    );
    await expectNoViolations(container);
  });

  // =========================================================================
  // Patterns
  // =========================================================================

  it("EmptyState (pattern) has no axe violations", async () => {
    const { container } = render(<EmptyState variant="generic" />);
    await expectNoViolations(container);
  });

  it("LoadingState has no axe violations", async () => {
    const { container } = render(
      <div>
        <LoadingState variant="spinner" text="Loading..." />
        <LoadingState variant="skeleton" />
      </div>,
    );
    await expectNoViolations(container);
  });

  it("ErrorState has no axe violations", async () => {
    const { container } = render(
      <div>
        <ErrorState message="Something went wrong" variant="inline" />
        <ErrorState
          message="Failed to save"
          variant="banner"
          actionLabel="Retry"
          onAction={() => {}}
        />
      </div>,
    );
    await expectNoViolations(container);
  });

  it("ErrorBoundary has no axe violations", async () => {
    const { container } = render(
      <ErrorBoundary>
        <p>Application content</p>
      </ErrorBoundary>,
    );
    await expectNoViolations(container);
  });

  it("RegionErrorBoundary has no axe violations", async () => {
    const { container } = render(
      <RegionErrorBoundary region="panel">
        <p>Panel content</p>
      </RegionErrorBoundary>,
    );
    await expectNoViolations(container);
  });

  it("RegionFallback has no axe violations", async () => {
    const { container } = render(
      <RegionFallback region="sidebar" onRetry={() => {}} />,
    );
    await expectNoViolations(container);
  });

  it("PanelHeader has no axe violations", async () => {
    const { container } = render(
      <PanelHeader
        title="Characters"
        subtitle="Story Characters"
        actions={<Button variant="ghost">Add</Button>}
      />,
    );
    await expectNoViolations(container);
  });
});
