import React from "react";
import { useTranslation } from "react-i18next";

import { Button, Select, Text, Textarea } from "../../components/primitives";
import { Dialog } from "../../components/primitives/Dialog";
import { useMemoryStore } from "../../stores/memoryStore";

type MemoryType = "preference" | "fact" | "note";
type MemoryScope = "global" | "project" | "document";

/**
 * MemoryCreateDialog provides a modal interface for creating new memories.
 *
 * The dialog allows users to:
 * - Select memory type (preference/fact/note)
 * - Input memory content
 * - Scope is automatically set based on the active scope in MemoryPanel
 */
export function MemoryCreateDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: MemoryScope;
  scopeLabel: string;
}): JSX.Element {
  const { t } = useTranslation();
  const create = useMemoryStore((s) => s.create);

  const [type, setType] = React.useState<MemoryType>("preference");
  const [content, setContent] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (props.open) {
      setType("preference");
      setContent("");
      setIsSubmitting(false);
    }
  }, [props.open]);

  const handleSubmit = async (): Promise<void> => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const res = await create({
      type,
      scope: props.scope,
      content: content.trim(),
    });

    if (res.ok) {
      props.onOpenChange(false);
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t('memory.create.title')}
      description={t('memory.create.description', { scope: props.scopeLabel })}
      footer={
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="md"
            onClick={() => props.onOpenChange(false)}
          >
            {t('memory.create.cancel')}
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => void handleSubmit()}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? t('memory.create.saving') : t('memory.create.save')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {/* Type selector */}
        <div className="flex flex-col gap-2">
          <Text size="small" color="muted">
            {t('memory.create.type')}
          </Text>
          <Select
            data-testid="memory-create-type"
            value={type}
            onValueChange={(value) => setType(value as MemoryType)}
            options={[
              { value: "preference", label: t('memory.create.typePreference') },
              { value: "fact", label: t('memory.create.typeFact') },
              { value: "note", label: t('memory.create.typeNote') },
            ]}
            className="w-full"
          />
        </div>

        {/* Content input */}
        <div className="flex flex-col gap-2">
          <Text size="small" color="muted">
            {t('memory.create.content')}
          </Text>
          <Textarea
            data-testid="memory-create-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              type === "preference"
                ? t('memory.create.examplePreference')
                : type === "fact"
                  ? t('memory.create.exampleFact')
                  : t('memory.create.exampleNote')
            }
            className="min-h-30"
          />
        </div>

        {/* Scope info */}
        <div className="flex items-center gap-2 p-2 rounded bg-[var(--color-bg-subtle)]">
          <Text size="tiny" color="muted">
            {t('memory.create.layerHint')}
          </Text>
        </div>
      </div>
    </Dialog>
  );
}
