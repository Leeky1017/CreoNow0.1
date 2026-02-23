/**
 * Primitives - Atomic UI Components
 *
 * This module exports all primitive (atomic) components that form the
 * foundation of the design system. These components:
 *
 * - Follow the design spec in `design/DESIGN_DECISIONS.md`
 * - Use Tailwind CSS classes with CSS Variables
 * - Implement proper focus-visible states (§3.5)
 * - Support all required variants and sizes (§6)
 *
 * @example
 * ```tsx
 * import { Button, Input, Card, Text, Heading } from '@/components/primitives';
 *
 * <Button variant="primary" size="md">Save</Button>
 * <Input placeholder="Enter text..." />
 * <Card hoverable>Content</Card>
 * <Text size="small" color="muted">Caption</Text>
 * <Heading level="h1">Page Title</Heading>
 * ```
 */

// Form controls
export { Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";

export { Input } from "./Input";
export type { InputProps } from "./Input";

export { Textarea } from "./Textarea";
export type { TextareaProps } from "./Textarea";

// Layout
export { Card } from "./Card";
export type { CardProps, CardVariant } from "./Card";

export { ListItem } from "./ListItem";
export type { ListItemProps } from "./ListItem";

export { ScrollArea } from "./ScrollArea";
export type { ScrollAreaProps } from "./ScrollArea";

// Typography
export { Text } from "./Text";
export type { TextProps, TextSize, TextColor } from "./Text";

export { Heading } from "./Heading";
export type { HeadingProps, HeadingLevel, HeadingColor } from "./Heading";

// Radix-based components
export { Dialog, DialogTrigger } from "./Dialog";
export type { DialogProps } from "./Dialog";

export { Popover, PopoverClose, PopoverAnchor } from "./Popover";
export type { PopoverProps } from "./Popover";

export { Select } from "./Select";
export type { SelectProps, SelectOption, SelectGroup } from "./Select";

export { Checkbox } from "./Checkbox";
export type { CheckboxProps } from "./Checkbox";

export { Tabs, TabsRoot, TabsList, TabsTrigger, TabsContent } from "./Tabs";
export type { TabsProps, TabItem } from "./Tabs";

// Feedback & Status
export { Badge } from "./Badge";
export type { BadgeProps, BadgeVariant, BadgeSize } from "./Badge";

export { Avatar } from "./Avatar";
export type { AvatarProps, AvatarSize } from "./Avatar";

export { Spinner } from "./Spinner";
export type { SpinnerProps, SpinnerSize } from "./Spinner";

export { Skeleton } from "./Skeleton";
export type { SkeletonProps, SkeletonVariant } from "./Skeleton";

export { Tooltip, TooltipProvider } from "./Tooltip";
export type { TooltipProps } from "./Tooltip";

export { Toast, ToastProvider, ToastViewport, useToast } from "./Toast";
export type { ToastProps, ToastVariant, ToastState } from "./Toast";

export { Accordion } from "./Accordion";
export type { AccordionProps, AccordionItem } from "./Accordion";

export {
  RadioGroup,
  Radio,
  RadioGroupRoot,
  RadioCardGroup,
  RadioCardItem,
} from "./Radio";
export type {
  RadioGroupProps,
  RadioOption,
  RadioProps,
  RadioCardGroupProps,
  RadioCardOption,
  RadioCardItemProps,
} from "./Radio";

export { ContextMenu } from "./ContextMenu";
export type { ContextMenuProps, ContextMenuItem } from "./ContextMenu";

export { DropdownMenu } from "./DropdownMenu";
export type { DropdownMenuProps, DropdownMenuItem } from "./DropdownMenu";

export { ImageUpload } from "./ImageUpload";
export type { ImageUploadProps } from "./ImageUpload";

export { Toggle } from "./Toggle";
export type { ToggleProps } from "./Toggle";

export { Slider } from "./Slider";
export type { SliderProps } from "./Slider";
