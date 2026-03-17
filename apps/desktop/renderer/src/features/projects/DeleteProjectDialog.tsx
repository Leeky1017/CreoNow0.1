import React from "react";
import { useTranslation } from "react-i18next";

import { Button, Dialog, Input, Text } from "../../components/primitives";

export interface DeleteProjectDialogProps {
  open: boolean;
  projectName: string;
  documentCount: number;
  submitting?: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

/**
 * DeleteProjectDialog enforces exact-name confirmation before destructive delete.
 *
 * Why: PM-2 requires explicit second confirmation to prevent accidental purge.
 */
export function DeleteProjectDialog(
  props: DeleteProjectDialogProps,
): JSX.Element {
  const { t } = useTranslation();
  const [typedName, setTypedName] = React.useState("");

  React.useEffect(() => {
    if (props.open) {
      setTypedName("");
    }
  }, [props.open]);

  const canDelete = typedName === props.projectName && !props.submitting;

  const description = t("projects.delete.description", {
    name: props.projectName,
    count: props.documentCount,
  });

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t("projects.delete.title")}
      description={description}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={() => props.onOpenChange(false)}
            disabled={Boolean(props.submitting)}
          >
            {t("projects.delete.cancel")}
          </Button>
          <Button
            data-testid="delete-project-confirm-button"
            type="button"
            variant="danger"
            disabled={!canDelete}
            loading={Boolean(props.submitting)}
            onClick={() => {
              if (!canDelete) {
                return;
              }
              void props.onConfirm();
            }}
          >
            {t("projects.delete.confirm")}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Text size="small" color="muted">
          {t("projects.delete.inputHint")}
        </Text>
        <Input
          data-testid="delete-project-name-input"
          value={typedName}
          onChange={(event) => setTypedName(event.target.value)}
          placeholder={props.projectName}
          autoFocus
        />
      </div>
    </Dialog>
  );
}
