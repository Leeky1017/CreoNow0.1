import React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../../components/primitives/Button";
import { Dialog } from "../../components/primitives/Dialog";
import { Input } from "../../components/primitives/Input";
import { Text } from "../../components/primitives/Text";

type RenameProjectDialogProps = {
  open: boolean;
  initialName: string;
  submitting: boolean;
  errorText: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
};

/**
 * RenameProjectDialog handles Dashboard rename flow with a validated text field.
 *
 * Why: rename is a first-class project action and must be explicit + recoverable.
 */
export function RenameProjectDialog(
  props: RenameProjectDialogProps,
): JSX.Element {
  const { t } = useTranslation();
  const [name, setName] = React.useState(props.initialName);
  const [nameError, setNameError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (props.open) {
      setName(props.initialName);
      setNameError(null);
    }
  }, [props.initialName, props.open]);

  /**
   * Submit a validated rename request.
   */
  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) {
        setNameError(t('dashboard.rename.nameRequired'));
        return;
      }
      setNameError(null);
      await props.onSubmit(trimmed);
    },
    [name, props, t],
  );

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t('dashboard.rename.title')}
      description={t('dashboard.rename.description')}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => props.onOpenChange(false)}
            disabled={props.submitting}
          >
            {t('dashboard.rename.cancel')}
          </Button>
          <Button
            data-testid="rename-project-submit"
            type="submit"
            form="rename-project-form"
            variant="secondary"
            size="sm"
            disabled={props.submitting}
          >
            {props.submitting ? t('dashboard.rename.renaming') : t('dashboard.rename.rename')}
          </Button>
        </>
      }
    >
      <form
        id="rename-project-form"
        data-testid="rename-project-dialog"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        <div>
          <Text size="small" color="muted" as="div" className="mb-2">
            {t('dashboard.rename.projectName')}
          </Text>
          <Input
            data-testid="rename-project-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) {
                setNameError(null);
              }
            }}
            autoFocus
            fullWidth
            error={Boolean(nameError)}
          />
        </div>

        {nameError ? (
          <Text size="small" className="text-[var(--color-error)]">
            {nameError}
          </Text>
        ) : null}

        {props.errorText ? (
          <Text size="small" className="text-[var(--color-error)]">
            {props.errorText}
          </Text>
        ) : null}
      </form>
    </Dialog>
  );
}
