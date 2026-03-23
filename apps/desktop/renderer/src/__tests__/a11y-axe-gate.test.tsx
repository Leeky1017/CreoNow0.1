// Comprehensive axe-core gate: covers all primitives, composites, patterns, and key features
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

// --- Primitives ---
import { Button } from "../components/primitives/Button";
import { Input } from "../components/primitives/Input";
import { Textarea } from "../components/primitives/Textarea";
import { Card } from "../components/primitives/Card";
import { ListItem } from "../components/primitives/ListItem";
import { ScrollArea } from "../components/primitives/ScrollArea";
import { Text } from "../components/primitives/Text";
import { Heading } from "../components/primitives/Heading";
import { Dialog } from "../components/primitives/Dialog";
import { Select } from "../components/primitives/Select";
import { Checkbox } from "../components/primitives/Checkbox";
import { Tabs } from "../components/primitives/Tabs";
import { Badge } from "../components/primitives/Badge";
import { Avatar } from "../components/primitives/Avatar";
import { Spinner } from "../components/primitives/Spinner";
import { Skeleton } from "../components/primitives/Skeleton";
import { Tooltip, TooltipProvider } from "../components/primitives/Tooltip";
import {
  Toast,
  ToastProvider,
  ToastViewport,
} from "../components/primitives/Toast";
import { Accordion } from "../components/primitives/Accordion";
import { RadioGroup } from "../components/primitives/Radio";
import { Toggle } from "../components/primitives/Toggle";
import { Slider } from "../components/primitives/Slider";
import { ImageUpload } from "../components/primitives/ImageUpload";

// --- Composites ---
import { CommandItem } from "../components/composites/CommandItem";
import { ConfirmDialog } from "../components/composites/ConfirmDialog";
import { FormField } from "../components/composites/FormField";
import { InfoBar } from "../components/composites/InfoBar";
import { PanelContainer } from "../components/composites/PanelContainer";
import { SearchInput } from "../components/composites/SearchInput";
import { SidebarItem } from "../components/composites/SidebarItem";
import { ToolbarGroup } from "../components/composites/ToolbarGroup";
import { EmptyState as CompositeEmptyState } from "../components/composites/EmptyState";

// --- Patterns ---
import { EmptyState } from "../components/patterns/EmptyState";
import { LoadingState } from "../components/patterns/LoadingState";
import { ErrorState } from "../components/patterns/ErrorState";
import { ErrorBoundary } from "../components/patterns/ErrorBoundary";
import { RegionErrorBoundary } from "../components/patterns/RegionErrorBoundary";
import { RegionFallback } from "../components/patterns/RegionFallback";
import { PanelHeader } from "../components/patterns/PanelHeader";

// --- Features ---
import { FileTreePanel } from "../features/files/FileTreePanel";

expect.extend(toHaveNoViolations);

// ---------------------------------------------------------------------------
// Store mocks for FileTreePanel
// ---------------------------------------------------------------------------

type FileItem = {
  documentId: string;
  title: string;
  updatedAt: number;
  type: "chapter" | "note" | "setting" | "timeline" | "character";
  status: "draft" | "final";
  sortOrder: number;
  parentId?: string;
};

let fileItems: FileItem[] = [];
let currentDocumentId: string | null = null;

vi.mock("../stores/fileStore", () => ({
  useFileStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      items: fileItems,
      currentDocumentId,
      bootstrapStatus: "ready",
      lastError: null,
      createAndSetCurrent: vi
        .fn()
        .mockResolvedValue({ ok: true, data: { documentId: "new-doc" } }),
      rename: vi.fn().mockResolvedValue({ ok: true }),
      updateStatus: vi.fn().mockResolvedValue({
        ok: true,
        data: { updated: true, status: "draft" },
      }),
      delete: vi.fn().mockResolvedValue({ ok: true }),
      setCurrent: vi.fn().mockResolvedValue({ ok: true }),
      clearError: vi.fn(),
    }),
  ),
}));

vi.mock("../stores/editorStore", () => ({
  useEditorStore: vi.fn(
    (selector: (state: Record<string, unknown>) => unknown) =>
      selector({
        openDocument: vi.fn().mockResolvedValue({ ok: true }),
        openCurrentDocumentForProject: vi.fn().mockResolvedValue({ ok: true }),
      }),
  ),
}));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function expectNoViolations(container: HTMLElement) {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("axe-core a11y gate — all component stories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentDocumentId = "doc-1";
    fileItems = [
      {
        documentId: "doc-1",
        title: "Chapter 1",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 0,
      },
      {
        documentId: "doc-2",
        title: "Chapter 2",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 1,
      },
    ];
  });

  // =========================================================================
  // Primitives
  // =========================================================================

  it("Button has no axe violations", async () => {
    const { container } = render(
      <div>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="pill">Pill</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
      </div>,
    );
    await expectNoViolations(container);
  });

  it("Input has no axe violations", async () => {
    const { container } = render(
      <div>
        <label htmlFor="test-input">Name</label>
        <Input id="test-input" placeholder="Enter name" />
        <label htmlFor="test-input-err">Error</label>
        <Input id="test-input-err" error />
      </div>,
    );
    await expectNoViolations(container);
  });

  it("Textarea has no axe violations", async () => {
    const { container } = render(
      <div>
        <label htmlFor="test-textarea">Description</label>
        <Textarea id="test-textarea" placeholder="Enter description" rows={3} />
      </div>,
    );
    await expectNoViolations(container);
  });

  it("Card has no axe violations", async () => {
    const { container } = render(
      <div>
        <Card>Default card content</Card>
        <Card variant="raised">Raised card</Card>
        <Card variant="bordered">Bordered card</Card>
        <Card variant="compact">Compact card</Card>
      </div>,
    );
    await expectNoViolations(container);
  });

  it("ListItem has no axe violations", async () => {
    const { container } = render(
      <div>
        <ListItem>Item one</ListItem>
        <ListItem selected>Selected item</ListItem>
        <ListItem disabled>Disabled item</ListItem>
        <ListItem compact>Compact item</ListItem>
      </div>,
    );
    await expectNoViolations(container);
  });

  it("ScrollArea has no axe violations", async () => {
    const { container } = render(
      <ScrollArea>
        <p>Scrollable content</p>
      </ScrollArea>,
    );
    await expectNoViolations(container);
  });

  it("Text has no axe violations", async () => {
    const { container } = render(
      <div>
        <Text>Default text</Text>
        <Text size="small" color="muted">
          Small muted
        </Text>
        <Text size="bodyLarge" color="default">
          Body large
        </Text>
        <Text as="p" size="tiny">
          Tiny paragraph
        </Text>
      </div>,
    );
    await expectNoViolations(container);
  });

  it("Heading has no axe violations", async () => {
    const { container } = render(
      <div>
        <Heading level="h1">Page Title</Heading>
        <Heading level="h2">Section Title</Heading>
        <Heading level="h3" color="muted">
          Subsection
        </Heading>
        <Heading level="h4">Minor Heading</Heading>
      </div>,
    );
    await expectNoViolations(container);
  });

  it("Dialog has no axe violations", async () => {
    const { container } = render(
      <Dialog
        open={true}
        onOpenChange={() => {}}
        title="Confirm Action"
        description="Are you sure you want to proceed?"
        footer={
          <>
            <Button variant="ghost">Cancel</Button>
            <Button variant="primary">Confirm</Button>
          </>
        }
      >
        <p>This will delete the selected item permanently.</p>
      </Dialog>,
    );
    await expectNoViolations(container);
  });

  it("Select has no axe violations", async () => {
    const { container } = render(
      <div>
        <label id="select-label">Choose option</label>
        <Select
          aria-labelledby="select-label"
          options={[
            { value: "a", label: "Option A" },
            { value: "b", label: "Option B" },
            { value: "c", label: "Option C" },
          ]}
          defaultValue="a"
        />
      </div>,
    );
    await expectNoViolations(container);
  });

  it("Checkbox has no axe violations", async () => {
    const { container } = render(
      <div>
        <Checkbox label="Accept terms" id="chk-1" />
        <Checkbox label="Subscribe" id="chk-2" checked />
        <Checkbox label="Disabled" id="chk-3" disabled />
      </div>,
    );
    await expectNoViolations(container);
  });

  it("Tabs has no axe violations", async () => {
    const { container } = render(
      <Tabs
        tabs={[
          { value: "tab1", label: "General", content: "General settings" },
          { value: "tab2", label: "Advanced", content: "Advanced settings" },
          { value: "tab3", label: "About", content: "About info" },
        ]}
        defaultValue="tab1"
      />,
    );
    await expectNoViolations(container);
  });

  it("Badge has no axe violations", async () => {
    const { container } = render(
      <div>
        <Badge>Default</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="error">Error</Badge>
        <Badge variant="info">Info</Badge>
      </div>,
    );
    await expectNoViolations(container);
  });

  it("Avatar has no axe violations", async () => {
    const { container } = render(
      <div>
        <Avatar fallback="AB" alt="User avatar" />
        <Avatar size="sm" fallback="CD" alt="Small avatar" />
        <Avatar size="lg" fallback="EF" alt="Large avatar" />
      </div>,
    );
    await expectNoViolations(container);
  });

  it("Spinner has no axe violations", async () => {
    const { container } = render(
      <div>
        <Spinner label="Loading content" />
        <Spinner size="sm" label="Small spinner" />
        <Spinner size="lg" label="Large spinner" />
      </div>,
    );
    await expectNoViolations(container);
  });

  it("Skeleton has no axe violations", async () => {
    const { container } = render(
      <div>
        <Skeleton />
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="rectangular" width="100%" height={100} />
      </div>,
    );
    await expectNoViolations(container);
  });

  it("Tooltip has no axe violations", async () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip content="Help text" open>
          <button>Hover me</button>
        </Tooltip>
      </TooltipProvider>,
    );
    await expectNoViolations(container);
  });

  it("Toast has no axe violations", async () => {
    const { container } = render(
      <ToastProvider>
        <Toast
          title="File saved"
          description="Your changes have been saved."
          variant="success"
          open={true}
          onOpenChange={() => {}}
        />
        <ToastViewport />
      </ToastProvider>,
    );
    await expectNoViolations(container);
  });

  it("Accordion has no axe violations", async () => {
    const { container } = render(
      <Accordion
        items={[
          { value: "item1", title: "Section One", content: "Content one" },
          { value: "item2", title: "Section Two", content: "Content two" },
          { value: "item3", title: "Section Three", content: "Content three" },
        ]}
      />,
    );
    await expectNoViolations(container);
  });

  it("RadioGroup has no axe violations", async () => {
    const { container } = render(
      <RadioGroup
        options={[
          { value: "opt1", label: "Option 1" },
          { value: "opt2", label: "Option 2" },
          { value: "opt3", label: "Option 3" },
        ]}
        defaultValue="opt1"
      />,
    );
    await expectNoViolations(container);
  });

  it("Toggle has no axe violations", async () => {
    const { container } = render(
      <div>
        <Toggle id="toggle-1" label="Enable notifications" />
        <Toggle
          id="toggle-2"
          label="Dark mode"
          description="Use dark theme"
          checked
        />
        <Toggle id="toggle-3" label="Disabled" disabled />
      </div>,
    );
    await expectNoViolations(container);
  });

  it("Slider has no axe violations", async () => {
    const { container } = render(
      <Slider aria-label="Volume" defaultValue={50} min={0} max={100} />,
    );
    await expectNoViolations(container);
  });

  it("ImageUpload has no axe violations", async () => {
    const { container } = render(
      <ImageUpload
        onChange={() => {}}
        placeholder="Upload an image"
        hint="Max 5MB"
      />,
    );
    await expectNoViolations(container);
  });

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

  // =========================================================================
  // Features (with mocks)
  // =========================================================================

  it("FileTreePanel has no axe violations", async () => {
    const { container } = render(<FileTreePanel projectId="test-project" />);
    await expectNoViolations(container);
  });
});
