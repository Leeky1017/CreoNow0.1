// axe-core a11y gate: primitives
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

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

expect.extend(toHaveNoViolations);

async function expectNoViolations(container: HTMLElement) {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

describe("axe-core a11y gate — primitives", () => {
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
});
